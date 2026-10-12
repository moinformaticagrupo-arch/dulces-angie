
// =========================================================
// DULCES ANGIE · TIENDA PÚBLICA
// Supabase + Catálogo + WhatsApp + Menú móvil
// =========================================================

"use strict";

// ---------------------------------------------------------
// 1. CONFIGURACIÓN
// ---------------------------------------------------------

const WHATSAPP = "5493815145977";

const DEFAULT_MESSAGE =
  "Hola Angie! 💗 Quiero consultar por un pedido.";

const config = window.DULCES_ANGIE_SUPABASE || {};

const isSupabaseConfigured = Boolean(
  config.url &&
  config.anonKey &&
  !config.url.includes("TU-PROYECTO") &&
  !config.anonKey.includes("TU-ANON-KEY")
);

const supabase =
  isSupabaseConfigured &&
  typeof window.supabase?.createClient === "function"
    ? window.supabase.createClient(
        config.url,
        config.anonKey
      )
    : null;

// ---------------------------------------------------------
// 2. ELEMENTOS DEL HTML
// ---------------------------------------------------------

const productGrid = document.getElementById("productGrid");
const whatsappButton = document.getElementById("whatsappBtn");
const yearElement = document.getElementById("year");

// ---------------------------------------------------------
// 3. WHATSAPP
// ---------------------------------------------------------

function whatsappLink(message = DEFAULT_MESSAGE) {
  const phone = WHATSAPP.replace(/\D/g, "");

  return (
    "https://api.whatsapp.com/send?phone=" +
    phone +
    "&text=" +
    encodeURIComponent(message)
  );
}

// Abrir WhatsApp en una pestaña nueva para no perder la tienda.
function openWhatsApp(message) {
  const url = whatsappLink(message);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) window.location.href = url;
}

// Ventana de detalles creada en el momento, sin modificar el HTML principal.
function openProductDetails(product) {
  let modal = document.getElementById("productDetailsModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "productDetailsModal";
    modal.className = "product-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "productModalTitle");
    modal.innerHTML = `
      <div class="product-modal-backdrop" data-close-modal="true"></div>
      <section class="product-modal-card">
        <button type="button" class="product-modal-close" aria-label="Cerrar detalles" data-close-modal="true">×</button>
        <div class="product-modal-content">
          <div class="product-modal-image"></div>
          <div class="product-modal-info">
            <p class="product-modal-badge"></p>
            <h2 id="productModalTitle"></h2>
            <p class="product-modal-description"></p>
            <p class="product-modal-price"></p>
            <button type="button" class="order-btn product-modal-consult">Consultar por WhatsApp</button>
          </div>
        </div>
      </section>`;
    document.body.appendChild(modal);

    modal.addEventListener("click", event => {
      if (event.target.closest("[data-close-modal='true']")) closeProductDetails();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeProductDetails();
    });
  }

  const imageHost = modal.querySelector(".product-modal-image");
  imageHost.replaceChildren();
  if (isValidImageURL(product.image_url)) {
    const image = document.createElement("img");
    image.src = product.image_url;
    image.alt = product.name || "Producto";
    image.loading = "eager";
    imageHost.appendChild(image);
  } else {
    imageHost.textContent = "🎁";
  }

  modal.querySelector(".product-modal-badge").textContent = product.badge || "";
  modal.querySelector(".product-modal-badge").hidden = !product.badge;
  modal.querySelector("#productModalTitle").textContent = product.name || "Producto";
  modal.querySelector(".product-modal-description").textContent =
    product.description || "Una creación hecha con amor para sorprender.";
  modal.querySelector(".product-modal-price").textContent =
    hasPrice(product.price) ? money(product.price) : "Precio: consultar";

  modal.querySelector(".product-modal-consult").onclick = () => {
    const priceMessage = hasPrice(product.price) ? ` El precio publicado es ${money(product.price)}.` : " ¿Me pasás el precio?";
    openWhatsApp(`Hola Angie! 💗 Quería consultar por "${product.name}".${priceMessage}`);
  };

  modal.classList.add("is-open");
  document.body.classList.add("modal-open");
  modal.querySelector(".product-modal-close").focus();
}

function closeProductDetails() {
  const modal = document.getElementById("productDetailsModal");
  if (modal) modal.classList.remove("is-open");
  document.body.classList.remove("modal-open");
}

// ---------------------------------------------------------
// 4. UTILIDADES
// ---------------------------------------------------------

function money(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Consultar";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(amount);
}

function hasPrice(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value)) &&
    Number(value) >= 0
  );
}

function isValidImageURL(value) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value, window.location.href);

    return (
      url.protocol === "https:" ||
      url.origin === window.location.origin
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------
// 5. PRODUCTOS DE RESPALDO
// Solo son ejemplos si Supabase no está disponible.
// ---------------------------------------------------------

const fallbackProducts = [
  {
    id: "sample-1",
    name: "Caja sorpresa",
    description:
      "Una presentación especial para un momento inolvidable.",
    price: null,
    badge: "Favorito",
    image_url: "",
    is_active: true
  },
  {
    id: "sample-2",
    name: "Caja de golosinas",
    description:
      "Golosinas elegidas para armar un regalo lleno de color.",
    price: null,
    badge: "Dulce",
    image_url: "",
    is_active: true
  },
  {
    id: "sample-3",
    name: "Detalle personalizado",
    description:
      "Un mensaje pensado especialmente para esa persona.",
    price: null,
    badge: "Especial",
    image_url: "",
    is_active: true
  }
];

// ---------------------------------------------------------
// 6. MENSAJES DEL CATÁLOGO
// ---------------------------------------------------------

function showMessage(message) {
  if (!productGrid) return;

  const paragraph = document.createElement("p");
  paragraph.className = "products-loading";
  paragraph.textContent = message;

  productGrid.replaceChildren(paragraph);
}

// ---------------------------------------------------------
// 7. IMAGEN DE RESPALDO
// ---------------------------------------------------------

function createPlaceholder(index) {
  const emojis = ["🎁", "🍬", "💌", "🌸", "🍓", "💗"];

  const placeholder = document.createElement("div");
  placeholder.className = "catalog-placeholder";
  placeholder.setAttribute("aria-hidden", "true");

  const emoji = document.createElement("span");
  emoji.textContent = emojis[index % emojis.length];

  const label = document.createElement("small");
  label.textContent = "Dulces Angie";

  placeholder.append(emoji, label);

  return placeholder;
}

// ---------------------------------------------------------
// 8. TARJETAS DE PRODUCTOS
// ---------------------------------------------------------

function createProductCard(product, index) {
  const article = document.createElement("article");
  article.className = "product-card";

  // Imagen y etiqueta
  const imageContainer = document.createElement("div");
  imageContainer.className = "product-image catalog-image";

  if (product.badge) {
    const badge = document.createElement("span");
    badge.className = "tag";
    badge.textContent = product.badge;

    imageContainer.appendChild(badge);
  }

  if (isValidImageURL(product.image_url)) {
    const image = document.createElement("img");

    image.src = product.image_url;
    image.alt = product.name || "Producto de Dulces Angie";
    image.loading = "lazy";
    image.decoding = "async";

    image.style.cssText =
      "width:100%;height:100%;object-fit:cover;" +
      "position:absolute;inset:0";

    image.addEventListener(
      "error",
      () => {
        image.remove();

        if (
          !imageContainer.querySelector(
            ".catalog-placeholder"
          )
        ) {
          imageContainer.appendChild(
            createPlaceholder(index)
          );
        }
      },
      { once: true }
    );

    imageContainer.appendChild(image);
  } else {
    imageContainer.appendChild(createPlaceholder(index));
  }

  // Información
  const info = document.createElement("div");
  info.className = "product-info";

  const title = document.createElement("h3");
  title.textContent = product.name || "Producto";

  const description = document.createElement("p");
  description.textContent =
    product.description ||
    "Una creación hecha con amor para sorprender.";

  // Precio y acciones del producto
  const bottom = document.createElement("div");
  bottom.className = "product-bottom";

  const price = document.createElement("span");
  price.className = "price";
  price.textContent = hasPrice(product.price)
    ? money(product.price)
    : "Consultar";

  const actions = document.createElement("div");
  actions.className = "product-actions";

  const specsButton = document.createElement("button");
  specsButton.className = "order-btn specs-btn";
  specsButton.type = "button";
  specsButton.textContent = "Especificaciones";
  specsButton.setAttribute("aria-label", `Ver especificaciones de ${product.name || "producto"}`);
  specsButton.addEventListener("click", () => openProductDetails(product));

  const consultButton = document.createElement("button");
  consultButton.className = "order-btn consult-btn";
  consultButton.type = "button";
  consultButton.textContent = "Consultar";
  consultButton.addEventListener("click", () => {
    const priceMessage = hasPrice(product.price)
      ? ` Veo que el precio publicado es ${money(product.price)}.`
      : " ¿Me pasás el precio y más información?";
    openWhatsApp(
      `Hola Angie! 💗 Quería consultar por "${product.name}".${priceMessage}`
    );
  });

  const orderButton = document.createElement("button");
  orderButton.className = "order-btn";
  orderButton.type = "button";
  orderButton.textContent = "Pedir";
  orderButton.addEventListener("click", () => {
    const priceMessage = hasPrice(product.price)
      ? ` El precio publicado es ${money(product.price)}.`
      : " ¿Me pasás información y precio?";
    openWhatsApp(`Hola Angie! 💗 Quiero pedir "${product.name}".${priceMessage}`);
  });

  actions.append(specsButton, consultButton, orderButton);
  bottom.append(price, actions);
  info.append(title, description, bottom);
  article.append(imageContainer, info);
  return article;
}

// ---------------------------------------------------------
// 9. RENDERIZAR EL CATÁLOGO
// ---------------------------------------------------------

function renderProducts(products) {
  if (!productGrid) return;

  if (!Array.isArray(products) || products.length === 0) {
    showMessage(
      "Pronto vamos a publicar nuevas creaciones. 💗"
    );
    return;
  }

  const fragment = document.createDocumentFragment();

  products.forEach((product, index) => {
    fragment.appendChild(
      createProductCard(product, index)
    );
  });

  productGrid.replaceChildren(fragment);
}

// ---------------------------------------------------------
// 10. CARGAR PRODUCTOS DESDE SUPABASE
//
// Requiere public.products con las columnas:
// id, name, description, price, image_url, badge,
// is_active, sort_order y created_at.
// ---------------------------------------------------------

let loadInProgress = false;
let reloadRequested = false;
let lastSuccessfulProducts = null;

async function loadProducts() {
  if (!supabase) {
    console.warn(
      "Supabase no está configurado. Se muestran ejemplos."
    );

    if (lastSuccessfulProducts === null) {
      renderProducts(fallbackProducts);
    }

    return;
  }

  if (loadInProgress) {
    reloadRequested = true;
    return;
  }

  loadInProgress = true;

  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id,name,description,price,image_url,badge,is_active,sort_order,created_at"
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const products = Array.isArray(data) ? data : [];

    lastSuccessfulProducts = products;

    renderProducts(products);

    console.info(
      `Catálogo cargado: ${products.length} producto(s).`
    );
  } catch (error) {
    console.error(
      "Error al cargar los productos:",
      error.message || error
    );

    if (lastSuccessfulProducts !== null) {
      renderProducts(lastSuccessfulProducts);
    } else {
      renderProducts(fallbackProducts);
    }
  } finally {
    loadInProgress = false;

    if (reloadRequested) {
      reloadRequested = false;
      loadProducts();
    }
  }
}

// ---------------------------------------------------------
// 11. ACTUALIZACIONES AUTOMÁTICAS CON REALTIME
// ---------------------------------------------------------

function subscribeToProductChanges() {
  if (!supabase) return;

  supabase
    .channel("dulces-angie-products")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "products"
      },
      () => {
        loadProducts();
      }
    )
    .subscribe(status => {
      console.info("Estado de sincronización:", status);
    });

  // Respaldo por si Realtime no está habilitado en el proyecto Supabase.
  // Los cambios del panel aparecen aunque el visitante no recargue la página.
  window.setInterval(() => {
    if (document.visibilityState === "visible") loadProducts();
  }, 15000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") loadProducts();
  });

  window.addEventListener("focus", () => loadProducts());
}

// ---------------------------------------------------------
// 12. BOTÓN PRINCIPAL DE WHATSAPP
// ---------------------------------------------------------

function setupWhatsAppButton() {
  if (!whatsappButton) return;

  whatsappButton.href = whatsappLink(DEFAULT_MESSAGE);
  whatsappButton.target = "_blank";
  whatsappButton.rel = "noopener noreferrer";

  whatsappButton.addEventListener("click", event => {
    event.preventDefault();

    window.location.href = whatsappLink(DEFAULT_MESSAGE);
  });
}

// ---------------------------------------------------------
// 13. MENÚ PARA CELULARES
// ---------------------------------------------------------

function setupMobileMenu() {
  const menuButton = document.querySelector(".menu-btn");
  const nav = document.querySelector("#mainNav");

  if (!menuButton || !nav) return;

  function closeMenu() {
    nav.classList.remove("mobile-open");

    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menú");
    menuButton.textContent = "☰";
  }

  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("mobile-open");

    menuButton.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    menuButton.setAttribute(
      "aria-label",
      isOpen ? "Cerrar menú" : "Abrir menú"
    );

    menuButton.textContent = isOpen ? "✕" : "☰";
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  document.addEventListener("click", event => {
    if (
      !nav.contains(event.target) &&
      !menuButton.contains(event.target)
    ) {
      closeMenu();
    }
  });
}

// ---------------------------------------------------------
// 14. INICIALIZAR LA PÁGINA
// ---------------------------------------------------------

function initializeStore() {
  setupWhatsAppButton();
  setupMobileMenu();

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  if (productGrid) {
    showMessage("Preparando nuestras creaciones… 💗");

    loadProducts();
    subscribeToProductChanges();
  }
}

// Evitar problemas si el script se carga antes del HTML
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeStore,
    { once: true }
  );
} else {
  initializeStore();
}
