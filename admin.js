import { supabase, isConfigured } from './supabaseClient.js';

const qs = (s, r=document) => r.querySelector(s);
const qsa = (s, r=document) => [...r.querySelectorAll(s)];
const emptyToNull = v => v === '' || v === undefined ? null : v;
const toNumber = v => v === '' || v === null || v === undefined ? null : Number(v);
const escapeHtml = (str='') => String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
const money = value => new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:Number(value || 0) % 1 ? 2 : 0}).format(Number(value || 0));

let currentUser = null;
let products = [];
let reviews = [];
let orders = [];

function message(text, type='success'){
  const box = qs('[data-admin-message]');
  if(!box) return;
  box.innerHTML = `<div class="notice ${type}">${escapeHtml(text)}</div>`;
  setTimeout(() => { box.innerHTML = ''; }, 4500);
}
function showLogin(){ qs('[data-login-panel]').hidden = false; qs('[data-admin-panel]').hidden = true; }
function showPanel(){ qs('[data-login-panel]').hidden = true; qs('[data-admin-panel]').hidden = false; }
function setFormValues(form, data){
  Object.entries(data || {}).forEach(([key, value]) => {
    const input = form.elements[key];
    if(!input) return;
    if(input.type === 'checkbox') input.checked = Boolean(value);
    else input.value = value ?? '';
  });
}
function resetForm(form){ form.reset(); qsa('input[type="hidden"]', form).forEach(i => i.value = ''); }

async function requireAdmin(){
  if(!isConfigured){ qs('[data-config-warning]').hidden = false; return false; }
  const { data: { session } } = await supabase.auth.getSession();
  if(!session){ showLogin(); return false; }
  currentUser = session.user;
  const { data, error } = await supabase.rpc('is_admin');
  if(error || data !== true){
    await supabase.auth.signOut();
    showLogin();
    alert('Bu hesap admin olarak tanımlı değil. Supabase admin_users tablosuna eklemelisin.');
    return false;
  }
  showPanel();
  return true;
}
async function uploadFile(file, folder='general'){
  if(!file) return null;
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-');
  const path = `${folder}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from('site-images').upload(path, file, { cacheControl: '3600', upsert: false });
  if(error) throw error;
  const { data } = supabase.storage.from('site-images').getPublicUrl(path);
  return data.publicUrl;
}

async function loadSettings(){
  const { data, error } = await supabase.from('settings').select('*').eq('id',1).maybeSingle();
  if(error) throw error;
  if(data) setFormValues(qs('[data-settings-form]'), data);
}
async function saveSettings(e){
  e.preventDefault();
  const form = e.currentTarget;
  const fd = new FormData(form);
  try{
    const logoUrl = fd.get('logo_file')?.size ? await uploadFile(fd.get('logo_file'), 'logo') : fd.get('logo_url');
    const heroUrl = fd.get('hero_file')?.size ? await uploadFile(fd.get('hero_file'), 'hero') : fd.get('hero_image_url');
    const payload = {
      id: 1,
      brand_name: emptyToNull(fd.get('brand_name')),
      slogan: emptyToNull(fd.get('slogan')),
      short_description: emptyToNull(fd.get('short_description')),
      city: emptyToNull(fd.get('city')),
      address: emptyToNull(fd.get('address')),
      show_address: fd.get('show_address') === 'on',
      phone: emptyToNull(fd.get('phone')),
      whatsapp: emptyToNull(fd.get('whatsapp')),
      instagram_url: emptyToNull(fd.get('instagram_url')),
      facebook_url: emptyToNull(fd.get('facebook_url')),
      email: emptyToNull(fd.get('email')),
      bank_name: emptyToNull(fd.get('bank_name')),
      iban_holder: emptyToNull(fd.get('iban_holder')),
      iban: emptyToNull(fd.get('iban')),
      payment_note: emptyToNull(fd.get('payment_note')),
      shipping_text: emptyToNull(fd.get('shipping_text')),
      hero_title: emptyToNull(fd.get('hero_title')),
      hero_subtitle: emptyToNull(fd.get('hero_subtitle')),
      campaign_title: emptyToNull(fd.get('campaign_title')),
      campaign_text: emptyToNull(fd.get('campaign_text')),
      logo_url: emptyToNull(logoUrl),
      hero_image_url: emptyToNull(heroUrl)
    };
    const { error } = await supabase.from('settings').upsert(payload, { onConflict: 'id' });
    if(error) throw error;
    form.elements.logo_url.value = logoUrl || '';
    form.elements.hero_image_url.value = heroUrl || '';
    message('Site ayarları kaydedildi.');
  }catch(err){ message(`Ayarlar kaydedilemedi: ${err.message}`, 'error'); }
}

async function loadProducts(){
  const { data, error } = await supabase.from('products').select('*').order('display_order',{ascending:true}).order('created_at',{ascending:false});
  if(error) throw error;
  products = data || [];
  renderAdminProducts();
}
async function saveProduct(e){
  e.preventDefault();
  const form = e.currentTarget;
  const fd = new FormData(form);
  try{
    const imageUrl = fd.get('image_file')?.size ? await uploadFile(fd.get('image_file'), 'products') : fd.get('image_url');
    const payload = {
      name: fd.get('name'),
      size_label: emptyToNull(fd.get('size_label')),
      price: Number(fd.get('price')),
      old_price: toNumber(fd.get('old_price')),
      badge: emptyToNull(fd.get('badge')),
      short_description: emptyToNull(fd.get('short_description')),
      description: emptyToNull(fd.get('description')),
      display_order: Number(fd.get('display_order') || 0),
      image_url: emptyToNull(imageUrl),
      in_stock: fd.get('in_stock') === 'on',
      featured: fd.get('featured') === 'on',
      active: fd.get('active') === 'on'
    };
    const id = fd.get('id');
    const query = id ? supabase.from('products').update(payload).eq('id', id) : supabase.from('products').insert(payload);
    const { error } = await query;
    if(error) throw error;
    resetForm(form);
    form.elements.in_stock.checked = true; form.elements.featured.checked = true; form.elements.active.checked = true;
    await loadProducts();
    message('Ürün kaydedildi.');
  }catch(err){ message(`Ürün kaydedilemedi: ${err.message}`, 'error'); }
}
function renderAdminProducts(){
  const wrap = qs('[data-admin-products]');
  if(!products.length){ wrap.innerHTML = '<p class="small">Henüz ürün yok.</p>'; return; }
  wrap.innerHTML = products.map(p => `
    <div class="admin-row">
      <div><h3>${escapeHtml(p.name)} — ${money(p.price)}</h3><p>${escapeHtml(p.size_label || '')} ${p.active ? '• Aktif' : '• Pasif'} ${p.in_stock ? '• Stokta' : '• Stokta yok'}</p></div>
      <div class="row-actions"><button class="mini-btn" data-edit-product="${p.id}">Düzenle</button><button class="mini-btn danger" data-delete-product="${p.id}">Sil</button></div>
    </div>`).join('');
  qsa('[data-edit-product]').forEach(b => b.onclick = () => editProduct(b.dataset.editProduct));
  qsa('[data-delete-product]').forEach(b => b.onclick = () => deleteProduct(b.dataset.deleteProduct));
}
function editProduct(id){
  const p = products.find(x => x.id === id); if(!p) return;
  const form = qs('[data-product-form]');
  setFormValues(form, p);
  window.scrollTo({top:0, behavior:'smooth'});
}
async function deleteProduct(id){
  if(!confirm('Bu ürünü silmek istediğine emin misin?')) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if(error) return message(`Ürün silinemedi: ${error.message}`, 'error');
  await loadProducts(); message('Ürün silindi.');
}

async function loadReviews(){
  const { data, error } = await supabase.from('reviews').select('*').order('display_order',{ascending:true}).order('created_at',{ascending:false});
  if(error) throw error;
  reviews = data || [];
  renderAdminReviews();
}
async function saveReview(e){
  e.preventDefault();
  const form = e.currentTarget;
  const fd = new FormData(form);
  const payload = {
    customer_name: fd.get('customer_name'),
    city: emptyToNull(fd.get('city')),
    rating: Number(fd.get('rating') || 5),
    comment: fd.get('comment'),
    display_order: Number(fd.get('display_order') || 0),
    active: fd.get('active') === 'on'
  };
  const id = fd.get('id');
  const query = id ? supabase.from('reviews').update(payload).eq('id', id) : supabase.from('reviews').insert(payload);
  const { error } = await query;
  if(error) return message(`Yorum kaydedilemedi: ${error.message}`, 'error');
  resetForm(form); form.elements.active.checked = true; form.elements.rating.value = '5';
  await loadReviews(); message('Yorum kaydedildi.');
}
function renderAdminReviews(){
  const wrap = qs('[data-admin-reviews]');
  if(!reviews.length){ wrap.innerHTML = '<p class="small">Henüz yorum yok.</p>'; return; }
  wrap.innerHTML = reviews.map(r => `
    <div class="admin-row">
      <div><h3>${escapeHtml(r.customer_name)} ${'★'.repeat(r.rating || 5)}</h3><p>${escapeHtml(r.comment || '')}</p></div>
      <div class="row-actions"><button class="mini-btn" data-edit-review="${r.id}">Düzenle</button><button class="mini-btn danger" data-delete-review="${r.id}">Sil</button></div>
    </div>`).join('');
  qsa('[data-edit-review]').forEach(b => b.onclick = () => editReview(b.dataset.editReview));
  qsa('[data-delete-review]').forEach(b => b.onclick = () => deleteReview(b.dataset.deleteReview));
}
function editReview(id){
  const r = reviews.find(x => x.id === id); if(!r) return;
  setFormValues(qs('[data-review-form]'), r);
  window.scrollTo({top:0, behavior:'smooth'});
}
async function deleteReview(id){
  if(!confirm('Bu yorumu silmek istediğine emin misin?')) return;
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if(error) return message(`Yorum silinemedi: ${error.message}`, 'error');
  await loadReviews(); message('Yorum silindi.');
}

async function loadOrders(){
  const { data, error } = await supabase.from('orders').select('*').order('created_at',{ascending:false}).limit(100);
  if(error) throw error;
  orders = data || [];
  renderOrders();
}
function statusText(s){
  return ({ payment_pending:'Ödeme bekleniyor', approved:'Onaylandı', shipped:'Kargoya verildi', cancelled:'İptal' })[s] || s;
}
function renderOrders(){
  const wrap = qs('[data-admin-orders]');
  if(!orders.length){ wrap.innerHTML = '<p class="small">Henüz sipariş yok.</p>'; return; }
  wrap.innerHTML = orders.map(o => {
    const itemText = Array.isArray(o.items) ? o.items.map(i => `${i.name} x${i.qty}`).join(', ') : '';
    return `<div class="admin-row">
      <div><h3>${escapeHtml(o.order_code)} — ${money(o.total)}</h3><p>${escapeHtml(o.customer_name)} • ${escapeHtml(o.phone)} • ${escapeHtml(o.city || '')}</p><p>${escapeHtml(o.address || '')}</p><div class="order-items">${escapeHtml(itemText)}</div></div>
      <div class="row-actions"><select class="search-input status-select" data-order-status="${o.id}"><option value="payment_pending">Ödeme bekleniyor</option><option value="approved">Onaylandı</option><option value="shipped">Kargoya verildi</option><option value="cancelled">İptal</option></select></div>
    </div>`;
  }).join('');
  qsa('[data-order-status]').forEach(sel => {
    const order = orders.find(o => o.id === sel.dataset.orderStatus);
    if(order) sel.value = order.status;
    sel.onchange = async () => {
      const { error } = await supabase.from('orders').update({ status: sel.value }).eq('id', sel.dataset.orderStatus);
      if(error) return message(`Durum güncellenemedi: ${error.message}`, 'error');
      message(`Sipariş durumu: ${statusText(sel.value)}`);
    };
  });
}

function bindTabs(){
  qsa('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('[data-tab]').forEach(b => b.classList.remove('active'));
      qsa('[data-section]').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      qs(`[data-section="${btn.dataset.tab}"]`)?.classList.add('active');
      if(btn.dataset.tab === 'orders') loadOrders().catch(err => message(err.message, 'error'));
    });
  });
}
function bindForms(){
  qs('[data-login-form]')?.addEventListener('submit', async e => {
    e.preventDefault();
    if(!isConfigured){ qs('[data-config-warning]').hidden = false; return; }
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({ email: fd.get('email'), password: fd.get('password') });
    if(error) return alert(error.message);
    if(await requireAdmin()) bootPanel();
  });
  qs('[data-logout]')?.addEventListener('click', async () => { await supabase.auth.signOut(); showLogin(); });
  qs('[data-settings-form]')?.addEventListener('submit', saveSettings);
  qs('[data-product-form]')?.addEventListener('submit', saveProduct);
  qs('[data-product-reset]')?.addEventListener('click', () => { const f=qs('[data-product-form]'); resetForm(f); f.elements.in_stock.checked=true; f.elements.featured.checked=true; f.elements.active.checked=true; });
  qs('[data-review-form]')?.addEventListener('submit', saveReview);
  qs('[data-review-reset]')?.addEventListener('click', () => { const f=qs('[data-review-form]'); resetForm(f); f.elements.active.checked=true; f.elements.rating.value='5'; });
}
async function bootPanel(){
  try{
    await Promise.all([loadSettings(), loadProducts(), loadReviews()]);
  }catch(err){ message(`Veri yüklenemedi: ${err.message}`, 'error'); }
}

bindForms();
bindTabs();
if(await requireAdmin()) bootPanel();
