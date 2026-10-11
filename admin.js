
/* =========================================================
   DULCES ANGIE - PANEL DE ADMINISTRACIÓN
   Autenticación y permisos mediante Supabase.
   ========================================================= */

(() => {
  "use strict";

  const cfg = window.DULCES_ANGIE_SUPABASE || {};

  const configured =
    typeof cfg.url === "string" &&
    cfg.url.startsWith("https://") &&
    typeof cfg.anonKey === "string" &&
    cfg.anonKey.trim().length > 0 &&
    !cfg.anonKey.includes("PEGÁ_ACÁ") &&
    !cfg.anonKey.includes("TU-ANON-KEY") &&
    !cfg.url.includes("TU-PROYECTO");

  const client =
    configured &&
    window.supabase &&
    typeof window.supabase.createClient === "function"
      ? window.supabase.createClient(cfg.url, cfg.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        })
      : null;

  const $ = (id) => document.getElementById(id);

  const loginView = $("loginView");
  const dashboardView = $("dashboardView");
  const setupWarning = $("setupWarning");

  let currentUser = null;
  let products = [];
  let editingImageUrl = "";
  let checkingSession = false;

  /* ---------- Mensajes y vistas ---------- */

  function message(id, text, isError = false) {
    const el = $(id);

    if (!el) {
      console.warn("No se encontró el elemento:", id, text);
      return;
    }

    el.textContent = text;
    el.style.color = isError ? "#b42358" : "#287746";
  }

  function showLogin() {
    loginView?.classList.remove("hidden");
    dashboardView?.classList.add("hidden");
  }

  function showDashboard() {
    loginView?.classList.add("hidden");
    dashboardView?.classList.remove("hidden");
  }

  function showSetupError(text) {
    if (loginView) loginView.classList.add("hidden");

    if (setupWarning) {
      setupWarning.classList.remove("hidden");
      setupWarning.textContent = text;
    }
  }

  function ars(value) {
    if (value === null || value === "") return "Consultar";

    const number = Number(value);

    if (!Number.isFinite(number)) return "Consultar";

    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2
    }).format(number);
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function showLoginError(error) {
    console.error("Error de inicio de sesión:", error);

    const detail = error?.message || "Error desconocido.";

    message(
      "loginMessage",
      "No se pudo iniciar sesión: " + detail,
      true
    );
  }

  /* ---------- Comprobación de administrador ---------- */

  async function verifyAndRenderSession() {
    if (!client || checkingSession) return;

    checkingSession = true;

    try {
      const { data, error } = await client.auth.getSession();

      if (error) throw error;

      const session = data?.session;

      if (!session) {
        currentUser = null;
        showLogin();
        return;
      }

      currentUser = session.user;

      const { data: admin, error: adminError } = await client
        .from("admin_users")
        .select("user_id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (adminError) {
        console.error("Error comprobando admin_users:", adminError);

        await client.auth.signOut();
        currentUser = null;
        showLogin();

        message(
          "loginMessage",
          "No se pudieron comprobar los permisos: " +
            adminError.message,
          true
        );

        return;
      }

      if (!admin) {
        await client.auth.signOut();
        currentUser = null;
        showLogin();

        message(
          "loginMessage",
          "Tu cuenta inició sesión, pero no está autorizada como administradora.",
          true
        );

        return;
      }

      showDashboard();
      await loadAdminProducts();

    } catch (error) {
      console.error("Error verificando la sesión:", error);

      showLogin();

      message(
        "loginMessage",
        "No se pudo verificar la sesión: " +
          (error.message || "Error desconocido."),
        true
      );

    } finally {
      checkingSession = false;
    }
  }

  /* ---------- Inicio de sesión ---------- */

  $("loginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!client) {
      showSetupError(
        "Supabase no está configurado. Revisá supabase-config.js, " +
        "la clave pública y que la biblioteca de Supabase esté cargada."
      );
      return;
    }

    const email = $("email")?.value.trim();
    const password = $("password")?.value;

    if (!email || !password) {
      message(
        "loginMessage",
        "Ingresá tu correo y tu contraseña.",
        true
      );
      return;
    }

    const submitButton = $("loginForm").querySelector(
      'button[type="submit"], button:not([type])'
    );

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Verificando...";
    }

    message("loginMessage", "Conectando con Supabase...");

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        showLoginError(error);
        return;
      }

      if (!data?.session) {
        message(
          "loginMessage",
          "Supabase no devolvió una sesión. Revisá la configuración del proveedor Email.",
          true
        );
        return;
      }

      await verifyAndRenderSession();

    } catch (error) {
      showLoginError(error);

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Iniciar sesión";
      }
    }
  });

  /* ---------- Cierre de sesión ---------- */

  $("logoutBtn")?.addEventListener("click", async () => {
    if (!client) return;

    try {
      const { error } = await client.auth.signOut();

      if (error) throw error;

      currentUser = null;
      products = [];
      showLogin();

    } catch (error) {
      console.error("Error cerrando sesión:", error);

      message(
        "loginMessage",
        "No se pudo cerrar la sesión: " + error.message,
        true
      );
    }
  });

  if (client) {
    client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        currentUser = null;
        showLogin();
      }
    });
  }

  /* ---------- Cargar productos ---------- */

  async function loadAdminProducts() {
    if (!client || !currentUser) return;

    const host = $("adminProductList");

    if (host) {
      host.innerHTML =
        '<p class="muted">Cargando productos...</p>';
    }

    try {
      const { data, error } = await client
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      products = data || [];

      const productCount = $("productCount");
      const pricedCount = $("pricedCount");

      if (productCount) {
        productCount.textContent = products.filter(
          (product) => product.is_active
        ).length;
      }

      if (pricedCount) {
        pricedCount.textContent = products.filter(
          (product) =>
            product.price !== null &&
            product.price !== ""
        ).length;
      }

      renderAdminList();

    } catch (error) {
      console.error("Error cargando productos:", error);

      if (host) {
        host.innerHTML =
          '<p class="muted">No se pudo cargar el catálogo: ' +
          escapeHtml(error.message) +
          "</p>";
      }
    }
  }

  /* ---------- Mostrar lista de productos ---------- */

  function renderAdminList() {
    const host = $("adminProductList");

    if (!host) return;

    if (!products.length) {
      host.innerHTML =
        '<p class="empty-list">Todavía no hay productos. ¡Agregá el primero! 💗</p>';
      return;
    }

    host.innerHTML = products.map((product) => {
      const image = product.image_url
        ? `<img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}">`
        : '<div class="mini-placeholder">🎁</div>';

      const status = product.is_active
        ? '<span class="status-pill">Publicado</span>'
        : '<span class="status-pill off">Oculto</span>';

      return `
        <article class="admin-product">
          <div>${image}</div>

          <div>
            <h3>
              ${escapeHtml(product.name)}
              ${status}
            </h3>

            <p>${escapeHtml(product.description || "Sin descripción")}</p>

            <span class="item-price">${ars(product.price)}</span>
          </div>

          <div class="item-actions">
            <button type="button" class="outline-btn" data-edit="${escapeHtml(product.id)}">
              Editar
            </button>

            <button type="button" class="outline-btn" data-toggle="${escapeHtml(product.id)}">
              ${product.is_active ? "Ocultar" : "Publicar"}
            </button>

            <button type="button" class="outline-btn" data-delete="${escapeHtml(product.id)}">
              Eliminar
            </button>
          </div>
        </article>
      `;
    }).join("");

    host.querySelectorAll("[data-edit]").forEach((button) => {
      button.addEventListener("click", () => {
        editProduct(button.dataset.edit);
      });
    });

    host.querySelectorAll("[data-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        toggleProduct(button.dataset.toggle);
      });
    });

    host.querySelectorAll("[data-delete]").forEach((button) => {
      button.addEventListener("click", () => {
        deleteProduct(button.dataset.delete);
      });
    });
  }

  /* ---------- Editar producto ---------- */

  function editProduct(id) {
    const product = products.find((item) => item.id === id);

    if (!product) return;

    $("productId").value = product.id;
    $("productName").value = product.name;
    $("productPrice").value = product.price ?? "";
    $("productDescription").value = product.description || "";
    $("productBadge").value = product.badge || "";
    $("productActive").checked = Boolean(product.is_active);
    $("productImage").value = "";

    editingImageUrl = product.image_url || "";

    $("currentImage").innerHTML = editingImageUrl
      ? `<img src="${escapeHtml(editingImageUrl)}" alt="Foto actual"><small>Foto actual</small>`
      : "<small>No hay foto cargada.</small>";

    $("formTitle").textContent = "Editar producto";
    $("saveProductBtn").textContent = "Guardar cambios";
    $("cancelEditBtn").classList.remove("hidden");

    message("productMessage", "");

    $("productForm").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  /* ---------- Limpiar formulario ---------- */

  function resetForm() {
    $("productForm")?.reset();

    if ($("productId")) $("productId").value = "";

    if ($("productActive")) {
      $("productActive").checked = true;
    }

    if ($("formTitle")) {
      $("formTitle").textContent = "Agregar un producto";
    }

    if ($("saveProductBtn")) {
      $("saveProductBtn").textContent = "Guardar y publicar";
    }

    $("cancelEditBtn")?.classList.add("hidden");

    if ($("currentImage")) {
      $("currentImage").innerHTML = "";
    }

    editingImageUrl = "";
    message("productMessage", "");
  }

  $("cancelEditBtn")?.addEventListener("click", resetForm);

  /* ---------- Subir imagen ---------- */

  async function uploadImage(file) {
    if (!file) return editingImageUrl;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error("La foto debe ser JPG, PNG o WebP.");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("La foto supera los 5 MB.");
    }

    if (!currentUser) {
      throw new Error("No hay una sesión de administrador activa.");
    }

    const extension = file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";

    const path =
      `${currentUser.id}/${crypto.randomUUID()}.${extension}`;

    const { error } = await client.storage
      .from("product-images")
      .upload(path, file, {
        upsert: false,
        contentType: file.type
      });

    if (error) {
      throw new Error(
        "No se pudo subir la foto: " + error.message
      );
    }

    const { data } = client.storage
      .from("product-images")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /* ---------- Guardar producto ---------- */

  $("productForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!client || !currentUser) {
      message(
        "productMessage",
        "La sesión no está activa. Volvé a iniciar sesión.",
        true
      );
      return;
    }

    const id = $("productId").value;
    const name = $("productName").value.trim();
    const priceRaw = $("productPrice").value;
    const price = priceRaw === "" ? null : Number(priceRaw);

    if (!name) {
      message("productMessage", "El nombre es obligatorio.", true);
      return;
    }

    if (
      price !== null &&
      (!Number.isFinite(price) || price < 0)
    ) {
      message("productMessage", "Ingresá un precio válido.", true);
      return;
    }

    const button = $("saveProductBtn");
    button.disabled = true;
    button.textContent = "Guardando...";

    try {
      const file = $("productImage").files[0];
      const image_url = await uploadImage(file);

      const payload = {
        name,
        price,
        description: $("productDescription").value.trim(),
        badge: $("productBadge").value.trim(),
        image_url,
        is_active: $("productActive").checked,
        updated_at: new Date().toISOString()
      };

      let result;

      if (id) {
        result = await client
          .from("products")
          .update(payload)
          .eq("id", id)
          .select()
          .maybeSingle();
      } else {
        result = await client
          .from("products")
          .insert({
            ...payload,
            sort_order: products.length
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      if (!result.data) {
        throw new Error(
          "No se confirmó el guardado. Revisá los permisos RLS de Supabase."
        );
      }

      resetForm();
      message("productMessage", "¡Producto guardado correctamente!");

      await loadAdminProducts();

    } catch (error) {
      console.error("Error guardando producto:", error);

      message(
        "productMessage",
        error.message || "Ocurrió un error al guardar.",
        true
      );

    } finally {
      button.disabled = false;
      button.textContent = $("productId").value
        ? "Guardar cambios"
        : "Guardar y publicar";
    }
  });

  /* ---------- Publicar u ocultar ---------- */

  async function toggleProduct(id) {
    if (!client || !currentUser) return;

    const product = products.find((item) => item.id === id);

    if (!product) return;

    try {
      const { data, error } = await client
        .from("products")
        .update({
          is_active: !product.is_active,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "No se modificó el producto. Revisá las políticas RLS."
        );
      }

      await loadAdminProducts();

    } catch (error) {
      console.error("Error cambiando publicación:", error);
      alert("No se pudo cambiar el estado: " + error.message);
    }
  }

  /* ---------- Eliminar producto ---------- */

  async function deleteProduct(id) {
    if (!client || !currentUser) return;

    const product = products.find((item) => item.id === id);

    if (!product) return;

    const confirmed = window.confirm(
      `¿Seguro que querés eliminar "${product.name}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      const { data, error } = await client
        .from("products")
        .delete()
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "No se eliminó el producto. Revisá las políticas RLS."
        );
      }

      if ($("productId")?.value === id) {
        resetForm();
      }

      await loadAdminProducts();

    } catch (error) {
      console.error("Error eliminando producto:", error);
      alert("No se pudo eliminar el producto: " + error.message);
    }
  }

  /* ---------- Botón actualizar catálogo ---------- */

  $("refreshBtn")?.addEventListener("click", loadAdminProducts);

  /* ---------- Inicialización ---------- */

  if (!client) {
    showSetupError(
      "No se pudo conectar con Supabase. Verificá que supabase-config.js " +
      "tenga la URL y la clave pública correctas, y que la biblioteca " +
      "de Supabase se cargue antes de admin.js."
    );
  } else {
    verifyAndRenderSession();
  }
})();
