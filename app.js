// DULCES ANGIE · TIENDA PÚBLICA + CATÁLOGO COMPARTIDO
// El catálogo se lee desde Supabase para que los cambios de Angie aparezcan a todos.
const WHATSAPP = "5493815145977";
const defaultMessage = "Hola Angie! 💗 Quiero consultar por un pedido.";
const config = window.DULCES_ANGIE_SUPABASE || {};
const isSupabaseConfigured = Boolean(config.url && config.anonKey && !config.url.includes("TU-PROYECTO"));
const supabase = (isSupabaseConfigured && window.supabase) ? window.supabase.createClient(config.url, config.anonKey) : null;

function whatsappLink(message) { return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`; }
const whatsappButton = document.getElementById("whatsappBtn");
if (whatsappButton) whatsappButton.href = whatsappLink(defaultMessage);
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

const fallbackProducts = [
  {id:'sample-1',name:'Caja sorpresa',description:'Una presentación especial para un momento inolvidable.',price:null,badge:'Favorito',image_url:'',is_active:true},
  {id:'sample-2',name:'Caja de golosinas',description:'Golosinas elegidas para armar un regalo lleno de color.',price:null,badge:'Dulce',image_url:'',is_active:true},
  {id:'sample-3',name:'Detalle personalizado',description:'Un mensaje pensado especialmente para esa persona.',price:null,badge:'Especial',image_url:'',is_active:true}
];
const productGrid = document.getElementById('productGrid');
const money = value => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(value));
function safeText(value='') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function renderProducts(products) {
  if (!productGrid) return;
  if (!products.length) { productGrid.innerHTML = '<p class="products-loading">Pronto vamos a publicar nuevas creaciones. 💗</p>'; return; }
  productGrid.innerHTML = products.map((p, i) => {
    const hasImage = Boolean(p.image_url);
    const visual = hasImage
      ? `<img src="${safeText(p.image_url)}" alt="${safeText(p.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0">`
      : `<div class="catalog-placeholder" aria-hidden="true"><span>${['🎁','🍬','💌','🌸','🍓','💗'][i%6]}</span><small>Dulces Angie</small></div>`;
    const price = p.price !== null && p.price !== '' && Number.isFinite(Number(p.price)) ? money(p.price) : 'Consultar';
    return `<article class="product-card"><div class="product-image catalog-image">${p.badge ? `<span class="tag">${safeText(p.badge)}</span>` : ''}${visual}</div><div class="product-info"><h3>${safeText(p.name)}</h3><p>${safeText(p.description || 'Una creación hecha con amor para sorprender.')}</p><div class="product-bottom"><span class="price">${price}</span><button class="order-btn" type="button" data-product-id="${safeText(p.id)}">Pedir</button></div></div></article>`;
  }).join('');
  productGrid.querySelectorAll('.order-btn').forEach(button => button.addEventListener('click', () => {
    const p = products.find(item => String(item.id) === button.dataset.productId);
    if (!p) return;
    const price = p.price !== null && p.price !== '' ? ` El precio publicado es ${money(p.price)}.` : ' ¿Me pasás información y precio?';
    window.open(whatsappLink(`Hola Angie! 💗 Quiero consultar por "${p.name}".${price}`), '_blank', 'noopener,noreferrer');
  }));
}
async function loadProducts() {
  if (!supabase) { renderProducts(fallbackProducts); return; }
  const {data, error} = await supabase.from('products').select('id,name,description,price,image_url,badge,is_active,sort_order').eq('is_active',true).order('sort_order',{ascending:true}).order('created_at',{ascending:false});
  if (error) { console.error('No se pudo cargar el catálogo:', error.message); renderProducts(fallbackProducts); return; }
  renderProducts(data || []);
}
loadProducts();
// Actualización casi inmediata cuando Angie modifica el catálogo.
if (supabase) supabase.channel('public-products-changes').on('postgres_changes',{event:'*',schema:'public',table:'products'},loadProducts).subscribe();

// Menú móvil accesible
const menuButton = document.querySelector('.menu-btn');
const nav = document.querySelector('#mainNav');
if (menuButton && nav) {
  const closeMenu = () => { nav.classList.remove('mobile-open'); menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Abrir menú'); menuButton.textContent='☰'; };
  menuButton.addEventListener('click', () => { const isOpen=nav.classList.toggle('mobile-open'); menuButton.setAttribute('aria-expanded',String(isOpen)); menuButton.setAttribute('aria-label',isOpen?'Cerrar menú':'Abrir menú'); menuButton.textContent=isOpen?'✕':'☰'; });
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  document.addEventListener('click',event=>{if(!nav.contains(event.target)&&!menuButton.contains(event.target))closeMenu();});
}
