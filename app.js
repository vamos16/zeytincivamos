import { supabase, isConfigured } from './supabaseClient.js';

const DEFAULT_SETTINGS = {
  id: 1,
  brand_name: 'Köklü Zeytinyağı',
  slogan: 'Kökünden gelen hakiki lezzet',
  short_description: 'Marka açıklamanı, iletişim bilgilerini ve ödeme bilgilerini admin panelinden sonradan ekleyebilirsin.',
  city: '-',
  address: '',
  show_address: false,
  phone: '-',
  whatsapp: '',
  instagram_url: '',
  facebook_url: '',
  email: '-',
  bank_name: '-',
  iban_holder: '-',
  iban: '-',
  payment_note: 'Siparişten sonra IBAN bilgisine ödeme yapıp açıklamaya sipariş kodunu yazınız.',
  shipping_text: 'Kargo ve teslimat bilgisi admin panelinden düzenlenebilir.',
  hero_title: 'Köklü Zeytinyağı için hazır premium satış sitesi.',
  hero_subtitle: 'Ürünleri, fiyatları, IBAN bilgilerini, telefon numarasını, görselleri ve müşteri yorumlarını admin panelinden yönetebilirsin.',
  hero_image_url: '',
  logo_url: 'koklu-logo.png',
  campaign_title: 'Admin panelinden kampanya başlığı gir.',
  campaign_text: 'Bu bölüm ana sayfadaki kampanyayı, avantajı veya güven mesajını göstermek için hazırlandı.'
};

let settings = DEFAULT_SETTINGS;
let products = [];
let reviews = [];
const cartKey = 'koklu_olive_site_cart_v2';

const qs = (s, r=document) => r.querySelector(s);
const qsa = (s, r=document) => [...r.querySelectorAll(s)];
const page = document.body.dataset.page;

function money(value){
  const number = Number(value || 0);
  return new Intl.NumberFormat('tr-TR', { style:'currency', currency:'TRY', maximumFractionDigits: number % 1 ? 2 : 0 }).format(number);
}
function escapeHtml(str=''){
  return String(str ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
}
function initials(name='KZ'){
  return name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase() || 'KZ';
}
function getCart(){
  try { return JSON.parse(localStorage.getItem(cartKey)) || []; } catch { return []; }
}
function saveCart(cart){ localStorage.setItem(cartKey, JSON.stringify(cart)); updateCartUI(); }
function cartCount(){ return getCart().reduce((sum, i) => sum + Number(i.qty || 0), 0); }
function cartTotal(){ return getCart().reduce((sum, i) => sum + Number(i.price || 0) * Number(i.qty || 0), 0); }
function normalizeWhatsApp(number){ return String(number || '').replace(/[^0-9]/g,''); }
function whatsappUrl(message='Merhaba, sipariş vermek istiyorum.'){
  const n = normalizeWhatsApp(settings.whatsapp || settings.phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(message)}` : '#contact';
}
function updateCartUI(){
  qsa('[data-cart-count]').forEach(el => el.textContent = cartCount());
  qsa('[data-cart-total]').forEach(el => el.textContent = money(cartTotal()));
}

async function loadData(){
  if(!isConfigured){ return; }
  const [settingsRes, productsRes, reviewsRes] = await Promise.all([
    supabase.from('settings').select('*').eq('id',1).maybeSingle(),
    supabase.from('products').select('*').eq('active', true).order('display_order', { ascending:true }).order('created_at', { ascending:false }),
    supabase.from('reviews').select('*').eq('active', true).order('display_order', { ascending:true }).order('created_at', { ascending:false })
  ]);
  if(settingsRes.data) settings = { ...settings, ...settingsRes.data };
  if(productsRes.data) products = productsRes.data;
  if(reviewsRes.data) reviews = reviewsRes.data;
}

function applySettings(){
  document.title = settings.brand_name ? `${settings.brand_name} | Zeytinyağı` : document.title;
  qsa('[data-brand-name]').forEach(el => el.textContent = settings.brand_name || DEFAULT_SETTINGS.brand_name);
  qsa('[data-slogan]').forEach(el => el.textContent = settings.slogan || DEFAULT_SETTINGS.slogan);
  qsa('[data-short-description]').forEach(el => el.textContent = settings.short_description || DEFAULT_SETTINGS.short_description);
  qsa('[data-phone]').forEach(el => el.textContent = settings.phone || '-');
  qsa('[data-whatsapp]').forEach(el => el.textContent = settings.whatsapp || '-');
  qsa('[data-city]').forEach(el => el.textContent = settings.city || '-');
  qsa('[data-address]').forEach(el => el.textContent = settings.address || '-');
  qsa('[data-email]').forEach(el => el.textContent = settings.email || '-');
  qsa('[data-bank-name]').forEach(el => el.textContent = settings.bank_name || '-');
  qsa('[data-iban-holder]').forEach(el => el.textContent = settings.iban_holder || '-');
  qsa('[data-iban]').forEach(el => el.textContent = settings.iban || '-');
  qsa('[data-payment-note]').forEach(el => el.textContent = settings.payment_note || DEFAULT_SETTINGS.payment_note);
  qsa('[data-shipping-text]').forEach(el => el.textContent = settings.shipping_text || DEFAULT_SETTINGS.shipping_text);
  qsa('[data-hero-title]').forEach(el => el.textContent = settings.hero_title || DEFAULT_SETTINGS.hero_title);
  qsa('[data-hero-subtitle]').forEach(el => el.textContent = settings.hero_subtitle || DEFAULT_SETTINGS.hero_subtitle);
  qsa('[data-campaign-title]').forEach(el => el.textContent = settings.campaign_title || DEFAULT_SETTINGS.campaign_title);
  qsa('[data-campaign-text]').forEach(el => el.textContent = settings.campaign_text || DEFAULT_SETTINGS.campaign_text);
  qsa('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  qsa('[data-address-row]').forEach(el => el.style.display = settings.show_address && settings.address ? '' : 'none');
  qsa('[data-whatsapp-link]').forEach(el => el.href = whatsappUrl());

  const logo = settings.logo_url || DEFAULT_SETTINGS.logo_url;
  qsa('[data-logo]').forEach(el => {
    if(logo){ el.innerHTML = `<img src="${escapeHtml(logo)}" alt="${escapeHtml(settings.brand_name || 'Logo')}">`; }
    else { el.textContent = initials(settings.brand_name); }
  });
  qsa('[data-splash-logo]').forEach(el => {
    if(logo){ el.innerHTML = `<img src="${escapeHtml(logo)}" alt="${escapeHtml(settings.brand_name || 'Logo')}">`; }
    else { el.textContent = initials(settings.brand_name); }
  });

  const heroBg = qs('[data-hero-bg]');
  if(heroBg && settings.hero_image_url){
    heroBg.style.backgroundImage = `linear-gradient(110deg,rgba(20,28,12,.93),rgba(61,72,31,.68),rgba(20,24,15,.68)), url('${settings.hero_image_url}')`;
  }
}

function setupSplash(){
  const splash = qs('[data-splash]');
  if(!splash) return;
  const hide = () => {
    splash.classList.add('hide');
    setTimeout(() => splash.remove(), 700);
  };
  window.addEventListener('load', () => setTimeout(hide, 1350));
  setTimeout(hide, 2000);
}

function productCard(product){
  const disabled = !product.in_stock;
  return `
    <article class="product-card">
      <div class="product-image">
        ${product.badge ? `<span class="badge">${escapeHtml(product.badge)}</span>` : ''}
        ${product.image_url ? `<img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}">` : `<span class="placeholder">🫒</span>`}
      </div>
      <div class="product-body">
        <div class="product-meta"><span>${escapeHtml(product.size_label || 'Zeytinyağı')}</span><span class="stock ${disabled ? 'out' : ''}">${disabled ? 'Stokta yok' : 'Stokta var'}</span></div>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.short_description || product.description || 'Ürün açıklaması admin panelinden eklenecek.')}</p>
        <div class="price-row"><span class="price">${money(product.price)}</span>${product.old_price ? `<span class="old-price">${money(product.old_price)}</span>` : ''}</div>
        <button class="btn secondary full" data-add-cart="${product.id}" ${disabled ? 'disabled' : ''}>${disabled ? 'Stokta Yok' : 'Sepete Ekle'}</button>
      </div>
    </article>`;
}
function emptyProducts(){
  return `<div class="empty-state"><div class="big">🫒</div><h3>Henüz ürün eklenmedi</h3><p>Admin panelinden ürün eklediğinde burada otomatik görünecek.</p><a class="btn secondary" href="admin.html">Admin Panel</a></div>`;
}
function renderProducts(){
  const productWrap = qs('[data-products]');
  const featuredWrap = qs('[data-featured-products]');
  if(productWrap){
    const search = qs('[data-product-search]');
    const stockFilter = qs('[data-stock-filter]');
    const draw = () => {
      const term = (search?.value || '').toLowerCase().trim();
      const onlyStock = stockFilter?.value === 'stock';
      const list = products.filter(p => (!term || `${p.name} ${p.short_description || ''} ${p.size_label || ''}`.toLowerCase().includes(term)) && (!onlyStock || p.in_stock));
      productWrap.innerHTML = list.length ? list.map(productCard).join('') : emptyProducts();
      bindAddCart();
    };
    search?.addEventListener('input', draw);
    stockFilter?.addEventListener('change', draw);
    draw();
  }
  if(featuredWrap){
    const list = products.filter(p => p.featured).slice(0, 3);
    featuredWrap.innerHTML = list.length ? list.map(productCard).join('') : emptyProducts();
    bindAddCart();
  }
}
function reviewCard(r){
  return `
    <article class="review-card">
      <div class="stars">${'★'.repeat(Number(r.rating || 5))}</div>
      <p>“${escapeHtml(r.comment)}”</p>
      <footer>${escapeHtml(r.customer_name)} ${r.city ? `• ${escapeHtml(r.city)}` : ''}</footer>
    </article>`;
}
function renderReviews(){
  const wrap = qs('[data-reviews]');
  if(!wrap) return;
  if(!reviews.length){
    wrap.innerHTML = `<div class="empty-state"><div class="big">⭐</div><h3>Henüz yorum eklenmedi</h3><p>Admin panelinden müşteri yorumları ekleyebilirsin.</p></div>`;
    return;
  }
  const repeated = [...reviews, ...reviews, ...reviews].slice(0, Math.max(reviews.length * 3, 6));
  wrap.innerHTML = `
    <div class="reviews-slider" aria-label="Müşteri yorumları">
      <div class="reviews-track">
        ${repeated.map(reviewCard).join('')}
      </div>
    </div>`;
}
function bindAddCart(){
  qsa('[data-add-cart]').forEach(btn => {
    btn.onclick = () => {
      const product = products.find(p => p.id === btn.dataset.addCart);
      if(!product) return;
      const cart = getCart();
      const existing = cart.find(i => i.id === product.id);
      if(existing) existing.qty += 1;
      else cart.push({ id: product.id, name: product.name, price: Number(product.price), image_url: product.image_url, size_label: product.size_label, qty: 1 });
      saveCart(cart);
      btn.textContent = 'Sepete Eklendi';
      setTimeout(() => btn.textContent = 'Sepete Ekle', 1200);
    };
  });
}
function renderCart(){
  const wrap = qs('[data-cart-items]');
  if(!wrap) return;
  const draw = () => {
    const cart = getCart();
    if(!cart.length){
      wrap.innerHTML = `<div class="empty-state"><div class="big">🛒</div><h3>Sepetin boş</h3><p>Ürünleri sepete ekleyip ödeme adımına geçebilirsin.</p><a class="btn secondary" href="products.html">Ürünlere Git</a></div>`;
      updateCartUI();
      return;
    }
    wrap.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-product">
          <div class="cart-img">${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}">` : '🫒'}</div>
          <div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.size_label || '')}</p><strong>${money(item.price)}</strong></div>
        </div>
        <div class="qty-control">
          <button data-qty-minus="${item.id}">−</button><span>${item.qty}</span><button data-qty-plus="${item.id}">+</button>
          <button class="remove-btn" data-remove="${item.id}">Sil</button>
        </div>
      </div>`).join('');
    qsa('[data-qty-minus]').forEach(b => b.onclick = () => updateQty(b.dataset.qtyMinus, -1));
    qsa('[data-qty-plus]').forEach(b => b.onclick = () => updateQty(b.dataset.qtyPlus, 1));
    qsa('[data-remove]').forEach(b => b.onclick = () => removeItem(b.dataset.remove));
    updateCartUI();
  };
  function updateQty(id, delta){
    const cart = getCart().map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i);
    saveCart(cart); draw();
  }
  function removeItem(id){ saveCart(getCart().filter(i => i.id !== id)); draw(); }
  qs('[data-clear-cart]')?.addEventListener('click', () => { saveCart([]); draw(); });
  draw();
}

async function handleCheckout(e){
  e.preventDefault();
  const cart = getCart();
  if(!cart.length){ alert('Sepetin boş.'); return; }
  const fd = new FormData(e.currentTarget);
  const orderCode = `KOKLU-${Date.now().toString().slice(-6)}`;
  const payload = {
    order_code: orderCode,
    customer_name: fd.get('customer_name'),
    phone: fd.get('phone'),
    city: fd.get('city'),
    address: fd.get('address'),
    note: fd.get('note'),
    items: cart,
    total: cartTotal(),
    status: 'payment_pending'
  };
  if(isConfigured){
    const { error } = await supabase.from('orders').insert(payload);
    if(error){ alert(`Sipariş kaydedilemedi: ${error.message}`); return; }
  }
  saveCart([]);
  const result = qs('[data-order-result]');
  if(result){
    result.hidden = false;
    result.innerHTML = `<h3>Sipariş oluşturuldu</h3><p><strong>Sipariş kodun:</strong> ${escapeHtml(orderCode)}</p><p>Ödeme açıklamasına bu kodu yaz: <strong>${escapeHtml(orderCode)}</strong></p>`;
  }
  e.currentTarget.reset();
  updateCartUI();
}

function bindMobileMenu(){
  qs('.mobile-menu')?.addEventListener('click', () => qs('.nav')?.classList.toggle('open'));
}

async function init(){
  setupSplash();
  await loadData();
  applySettings();
  updateCartUI();
  bindMobileMenu();
  renderProducts();
  renderReviews();
  renderCart();
  qs('[data-checkout-form]')?.addEventListener('submit', handleCheckout);
}
init();
