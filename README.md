
# BU PAKET ANA DİZİN / ROOT UYUMLUDUR

Bu sürüm özellikle GitHub'da dosyaları ana dizine yüklediğin yapı için hazırlandı.

Repo ana sayfasında şu dosyalar yan yana durmalı:

```text
index.html
products.html
cart.html
checkout.html
admin.html
style.css
app.js
admin.js
config.js
supabaseClient.js
koklu-logo.png
schema.sql
README.md
```

Bu pakette `assets/css/style.css` gibi klasör yolu kullanılmaz. CSS, JS ve logo doğrudan ana dizinden çağrılır.


# Köklü Zeytinyağı Satış Sitesi

Bu paket GitHub Pages uyumlu, boş içerikli ama admin panelden doldurulabilir bir zeytinyağı satış sitesidir.

Logo eklidir: `koklu-logo.png`

## Yeni Eklenenler

- Köklü Zeytinyağı logosu siteye eklendi.
- Açılışta animasyonlu logo ekranı eklendi.
- Daha premium görünen font yapısı eklendi.
- Müşteri yorumları yana doğru kayan slider haline getirildi.
- Yorumlar yine admin panelden eklenir, düzenlenir ve silinir.
- Ürün, fiyat, IBAN, telefon, WhatsApp, logo, ana sayfa görseli, kampanya yazısı ve siparişler admin panelden yönetilir.

## Dosya Yapısı

```text
index.html
products.html
cart.html
checkout.html
admin.html
assets/
  css/style.css
  img/koklu-logo.png
  js/config.js
  js/supabaseClient.js
  js/app.js
  js/admin.js
supabase/schema.sql
README.md
```

## Sistem Mantığı

Site dosyaları GitHub'a yüklenir. Ürünler, fiyatlar, IBAN, telefon, görseller, müşteri yorumları ve siparişler Supabase veritabanından yönetilir.

Yani sen siteyi GitHub'a koyduktan sonra her fiyat değişikliği için GitHub dosyalarını düzenlemek zorunda kalmazsın. Admin panelden değiştirirsin, sitede otomatik görünür.


## Önemli Güvenlik Notu

Bu final pakette sadece publishable key `config.js` içine yazıldı.

Secret key site dosyalarına koyulmadı ve koyulmamalı. Bu dosyalar GitHub Pages ile tarayıcıda çalışacağı için secret key herkese görünür hale gelir. Secret key sadece sunucu/Edge Function gibi gizli backend ortamında kullanılmalıdır.

Senin hala doldurman gereken tek şey:

```js
export const SUPABASE_URL = "https://cvpbhxqusmzklktentcz.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_m0v7AN24IauzyeS5IHFd1g_JcRxEF7w";
```

Önemli:

- Sadece `anon public` key koy.
- `service_role` key'i kesinlikle GitHub'a koyma.
- `service_role` key gizli kalmalı.

## 5. GitHub'a Yükle

1. GitHub'da yeni repo aç.
2. Bu paketteki tüm dosyaları repoya yükle.
3. Repo içinde `Settings` kısmına gir.
4. `Pages` bölümüne gir.
5. Source olarak `Deploy from a branch` seç.
6. Branch: `main`
7. Folder: `/root`
8. Save de.

Site linkin şu mantıkta olur:

```text
https://kullaniciadiniz.github.io/repo-adi/
```

Admin panel linki:

```text
https://kullaniciadiniz.github.io/repo-adi/admin.html
```

## 6. Admin Panelden Neleri Değiştireceksin?

`admin.html` sayfasına girip admin e-postan ve şifrenle giriş yap.

### Site Ayarları

Buradan şunları değiştirebilirsin:

- Marka adı
- Slogan
- Kısa açıklama
- Şehir
- Adres
- Telefon
- WhatsApp
- Instagram
- Facebook
- E-posta
- Banka adı
- IBAN
- Alıcı adı
- Ödeme notu
- Kargo notu
- Ana sayfa başlığı
- Ana sayfa açıklaması
- Kampanya başlığı
- Kampanya açıklaması
- Logo
- Ana sayfa görseli

### Ürünler

Buradan ürün ekleyebilirsin:

- Ürün adı
- Litre / boyut
- Fiyat
- Eski fiyat
- Etiket
- Kısa açıklama
- Detaylı açıklama
- Ürün fotoğrafı
- Stok durumu
- Ana sayfada göster/gösterme
- Aktif/pasif

### Yorumlar

Müşteri yorumları buradan yönetilir:

- Müşteri adı
- Şehir
- Puan
- Yorum
- Sıralama
- Aktif/pasif

Ana sayfadaki yorum alanı yana kayan slider şeklindedir. Buraya eklediğin yorumlar otomatik kayar.

### Siparişler

Müşteri siteden sipariş oluşturunca admin panelde görünür.

Durumları değiştirebilirsin:

- Ödeme bekleniyor
- Onaylandı
- Kargoya verildi
- İptal

## 7. Fotoğraf Yükleme

Admin panelden logo, ana sayfa görseli ve ürün görseli yükleyebilirsin.

Görseller Supabase Storage içinde `site-images` bucket'ına yüklenir.

Varsayılan logo zaten dosyanın içinde hazırdır:

```text
koklu-logo.png
```

Logo değiştirmek istersen admin panelden yeni logo yüklemen yeterli.

## 8. Ödeme Akışı

Site sadece IBAN / Havale / EFT mantığına göre hazırlandı.

Müşteri:

1. Ürünü sepete ekler.
2. Sepetten ödeme sayfasına geçer.
3. Ad, telefon, şehir ve adres girer.
4. Sipariş oluşturur.
5. Sistem sipariş kodu verir.
6. Müşteri IBAN'a ödeme yaparken açıklamaya sipariş kodunu yazar.

Örnek sipariş kodu:

```text
KOKLU-483920
```

Sen admin panelden siparişi görüp ödeme geldiyse durumunu `Onaylandı` yaparsın.

## 9. İlk Kurulumdan Sonra Kontrol Listesi

- `schema.sql` Supabase'de çalıştı mı?
- 2 admin Authentication > Users içinde açıldı mı?
- Adminler `admin_users` tablosuna eklendi mi?
- `config.js` içine Project URL ve anon key yazıldı mı?
- GitHub Pages açıldı mı?
- `/admin.html` ile giriş yapılabiliyor mu?
- Site Ayarları bölümünden IBAN, telefon ve WhatsApp eklendi mi?
- Ürün ve yorum eklendi mi?

## 10. Sorun Olursa

Admin panel açılıyor ama giriş yapmıyorsa:

- Admin e-postası Authentication > Users içinde var mı?
- Admin UID `admin_users` tablosunda var mı?
- `config.js` içindeki URL ve anon key doğru mu?

Ürün eklenmiyorsa:

- Supabase SQL kurulumu tam çalıştı mı?
- Admin olarak giriş yaptın mı?
- Görsel çok büyükse daha küçük bir fotoğraf dene.

Sitede ürünler görünmüyorsa:

- Ürün aktif mi?
- Ürün `active` seçili mi?
- Supabase bağlantısı doğru mu?
