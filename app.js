
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

  // Precio y botón
  const bottom = document.createElement("div");
  bottom.className = "product-bottom";

  const price = document.createElement("span");
  price.className = "price";
  price.textContent = hasPrice(product.price)
    ? money(product.price)
    : "Consultar";

  const button = document.createElement("button");
  button.className = "order-btn";
  button.type = "button";
  button.textContent = "Pedir";

  // Abrir WhatsApp con el producto seleccionado
  button.addEventListener("click", () => {
    const priceMessage = hasPrice(product.price)
      ? ` El precio publicado es ${money(product.price)}.`
      : " ¿Me pasás información y precio?";

    const message =
      `Hola Angie! 💗 Quiero consultar por "${product.name}".` +
      priceMessage;

    window.location.href = whatsappLink(message);
  });

  bottom.append(price, button);
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
      console.info(
        "Estado de sincronización:",
        status
      );
    });
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
