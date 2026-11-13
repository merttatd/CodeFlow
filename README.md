# CodeFlow

CodeFlow, kaynak kod projelerini tarayıcıda analiz ederek dosyalar, fonksiyonlar ve kütüphaneler arasındaki ilişkileri etkileşimli bir haritada gösteren yerel bir araçtır. Özellikle AI ile geliştirilen projelerde hangi parçanın nerede kullanıldığını incelemek ve kodun yapısını anlamak için tasarlanmıştır.

**Kurulum gerektirmez. İnternete veya API anahtarına ihtiyaç duymaz. Seçtiğiniz kodları sunucuya göndermez.**

> CodeFlow statik bir kod haritası üretir. Projeyi çalıştırmaz; oklar gerçek yürütme sırasını değil, bulunan bağımlılıkları ve olası çağrı ilişkilerini gösterir.

## Hızlı başlangıç

1. Depoyu bilgisayarınıza indirin ve ZIP indirdiyseniz klasöre çıkarın.
2. Windows üzerinde **Baslat.bat** dosyasına çift tıklayın. Alternatif olarak **index.html** dosyasını Chrome veya Edge ile açın.
3. **Proje klasörü aç** düğmesinden incelemek istediğiniz proje klasörünü seçin.
4. **Dosya akışı**, **Fonksiyonlar** veya **Kütüphaneler** görünümüne geçin.
5. Bir öğeye tıklayarak kaynak kodunu ve ilişkilerini inceleyin.

Kendi projenizi seçmeden denemek için **Örnek proje aç** düğmesini kullanabilirsiniz. Uygulama, küçük bir Python sipariş servisi örneği içerir.

Uygulamayı kullanmak için Node.js, Python, paket kurulumu veya yerel sunucu gerekmez. Tarayıcının klasör seçme ekranında “yükle” ifadesi görünse bile dosyalar yalnızca tarayıcı belleğinde okunur.

## Özellikler

### Üç farklı ilişki görünümü

| Görünüm | Gösterdikleri | Ok yönü |
| --- | --- | --- |
| Dosya akışı | Kaynak dosyalar ve yerel import ilişkileri | Kullanan dosya → kullanılan dosya |
| Fonksiyonlar | Tanınan fonksiyonlar ve olası proje içi çağrılar | Çağıran fonksiyon → çağrılan fonksiyon |
| Kütüphaneler | Dosyalar, yerel bağımlılıklar ve import edilen harici / standart modüller | Dosya → bağımlılık |

Kütüphane bilgileri kaynak koddaki import ifadelerinden çıkarılır. Paket sürümleri ve manifestte tanımlanıp kodda kullanılmayan bağımlılıklar gösterilmez.

### Ayrıntılı fonksiyon incelemesi

Bir fonksiyonu seçtiğinizde detay panelinde şunları görebilirsiniz:

- Dosya konumu, satır numarası ve kaynak kodu.
- Parametreler ve oluşturulan fonksiyon imzası.
- Kaynak yorumları veya Python docstring açıklaması.
- Kodda saptanan işlemlerden üretilen kısa görev özeti.
- Çağrı noktaları, çağrı satırları ve verilen argümanlar.
- Çağırdığı ve kendisini çağıran eşleşmiş fonksiyonlar.
- Dönüş ifadeleri ve tanınan arrow fonksiyonlarda örtük dönüşler.
- Koşullar, döngüler, hata yönetimi ve asenkron beklemeler gibi saptanan adımlar.

**Çağrı zincirini şemada göster**, seçilen fonksiyonu, doğrudan çağıranlarını ve ulaşılabilen çağrı hedeflerini haritada gösterir. Haritadaki öğe sınırı bu görünümde de geçerlidir.

Aynı hedefe yapılan çağrılar ayrı çağrı noktaları olarak tutulur. Örneğin bir bağlantıdaki **3 çağrı** etiketi, kodda bulunan üç çağrı noktasını ifade eder; fonksiyonun çalışma sırasında kaç kez çalıştığını göstermez.

### Geniş harita çalışma alanı

- Düz koyu arka plan ve açılıp kapatılabilen yan paneller.
- İlişkili kartları yakın sıralayan, döngüleri hesaba katan sütun yerleşimi.
- Kartların çevresindeki boşluklardan geçen dik açılı oklar.
- Seçilen öğenin doğrudan ilişkilerini vurgulama, diğer ilişkileri soluklaştırma.
- Ok üzerine gelindiğinde, klavyeyle odaklanıldığında veya tıklandığında çağrı sayısını gösterme.
- Sürükleyerek gezinme, yakınlaştırma ve ekrana sığdırma.

Yoğun grafiklerde oklar birbirini kesebilir. Dosya filtresi, arama veya bir fonksiyona odaklanma ile görünümü daraltabilirsiniz.

### Arama ve dışa aktarım

Dosya listesini ve şemayı ayrı ayrı arayabilirsiniz. Soldan bir dosya seçmek haritayı o dosyanın ilişkilerine daraltır. **Tümü**, dosya ve şema filtrelerini ve fonksiyon odağını temizler.

**Analizi dışa aktar**, analiz modelini JSON dosyası olarak indirir. Bu dosya düğümleri, ilişkileri, fonksiyon detaylarını ve **kaynak kodunu da içerir**. Mevcut sürümde dışa aktarılan JSON dosyasını yeniden içe aktarma özelliği yoktur.

## Harita kontrolleri

| Kontrol | İşlev |
| --- | --- |
| Haritayı büyüt | Üst bilgileri ve yan panelleri gizleyerek haritaya daha fazla alan ayırır |
| Normal görünüm / Escape | Büyütülmüş harita görünümünden çıkar |
| Dosyalar / Detaylar | İlgili yan paneli açar veya kapatır |
| Sığdır | Şemayı görünür alana sığdırır |
| ＋ / − | Yakınlaştırır veya uzaklaştırır |
| Ctrl + fare tekerleği | İşaretçinin bulunduğu noktayı esas alarak ölçeği değiştirir |
| Boş alanı sürükleme | Harita üzerinde gezinir |
| Öğeye tıklama | Detayları açar ve doğrudan bağlantıları vurgular |
| Boş alana tıklama | Seçim vurgusunu kaldırır |
| Tümü | Dosya / şema filtresini ve fonksiyon odağını temizler |

Büyük projelerde **Sığdır** yazıları küçültebilir. Böyle durumlarda yakınlaştırıp haritayı sürükleyerek inceleyin. Haritadaki kartlara ve bağlantılara Tab ile odaklanabilir, Enter ile seçim yapabilirsiniz.

## Desteklenen kaynaklar

| Dil / kaynak türü | Dosya uzantıları | Temel analiz |
| --- | --- | --- |
| JavaScript | .js, .jsx, .mjs, .cjs | Import / require, function tanımları, değişkene atanmış arrow fonksiyonlar |
| TypeScript | .ts, .tsx | Import ilişkileri ve desteklenen JavaScript tarzı fonksiyon tanımları |
| Python | .py | Import ilişkileri, def ve async def tanımları |

Python sınıf metotları def tanımı olarak bulunabilir; sınıf ve nesne kapsamı tam olarak çözümlenmez. JSX / TSX dosyalarının okunabilmesi, bileşen ağacının veya tüm sözdiziminin analiz edildiği anlamına gelmez.

## Nasıl çalışır?

1. Seçilen klasördeki desteklenen kaynak dosyaları okunur; hariç tutulan dizinler atlanır.
2. Statik analiz motoru import ifadelerini ve desteklenen fonksiyon tanımlarını arar.
3. Ayrıntı analizi çağrı noktalarını, parametreleri, yorumları ve dönüş ifadelerini çıkarır.
4. Eşleşen proje içi çağrılar ve dosya bağımlılıkları bir ilişki modeline dönüştürülür.
5. Yerleşim motoru kart konumlarını ve ok güzergâhlarını hesaplar; harita SVG ile çizilir.

Açıklamalar bir AI modeli tarafından üretilmez. Kaynak yorumları ve kodda bulunan kalıplar kullanılır. Örneğin tanınan bir HTTP çağrısı, özette “HTTP isteği gönderebilir” şeklinde belirtilir. Kaynak açıklamaları ile statik çıkarımlar detay panelinde ayrıştırılır.

## Analiz sınırları

Mevcut sürüm tam bir dil ayrıştırıcısı veya çalışma zamanı izleyicisi değildir. Sezgisel statik analiz kullanır; bu nedenle bazı ilişkiler eksik veya yanlış eşleşebilir.

- Gerçek yürütme sırası, çalışma zamanı değerleri ve fonksiyonların kesin iş amacı belirlenmez.
- Adım listesi kaynak satırı sırasını gösterir; iç içe çağrıların veya koşulların gerçek çalışma sırası değildir.
- Takma adla çağrılar, dinamik importlar, callback ilişkileri, decorator yapıları ve JS sınıf metotları tam çözümlenmez.
- Karmaşık sözdizimi, TypeScript path alias tanımları, monorepo paketleri ve Python paket kökleri eksik eşleşebilir.
- Noktalı nesne / metot çağrıları detaylarda listelenir; hedef fonksiyonları otomatik olarak çözümlenmez.
- Aynı isimde birden fazla aday varsa çağrı hedefi seçilmez. Çözümlenemeyen çağrı, detaylarda bu durum belirtilerek gösterilir.
- Kaynak yorumlarının güncelliği doğrulanmaz. Koddan üretilen özetler, fonksiyonun iş amacına dair kesin açıklamalar değildir.

### Boyut sınırları

| Sınır | Değer |
| --- | --- |
| Tek kaynak dosyası | 1.000.000 bayt |
| Toplam okunan kaynak | 30.000.000 bayt |
| Kaynak dosyası sayısı | 1.500 |
| Tek haritada gösterilen öğe | 150 |
| Detay panelindeki kaynak önizlemesi | İlk 220 satır |

Boyut veya dosya sayısı sınırı nedeniyle atlanan dosyalar durum mesajında belirtilir. Büyük projelerde dosya filtresini kullanın.

Şu dizinler analize dahil edilmez:

~~~text
node_modules  .git       dist          build
coverage      .venv      venv          __pycache__
vendor        .next
~~~

## Gizlilik ve veri işleme

- Kaynak dosyalar tarayıcı belleğinde işlenir; uygulama bunları bir sunucuya göndermez.
- Analiz edilen proje çalıştırılmaz ve kaynak dosyaları değiştirilmez.
- Uygulama analiz oturumunu kalıcı olarak saklamaz; sayfa yenilendiğinde proje yeniden seçilir.
- JSON dışa aktarımı kullanıcı tarafından başlatılır ve kaynak kodunu içerir.
- Uygulama harici CDN, analiz servisi veya API anahtarı kullanmaz.

## Proje yapısı

~~~text
CodeFlow/
├── index.html                 # Uygulama arayüzü
├── style.css                  # Genel koyu tema
├── graph.css                  # Harita alanı ve etkileşim stilleri
├── app.js                     # Proje yükleme, filtreler ve uygulama durumu
├── analyzer.js                # Temel statik analiz
├── analysis-details.js        # Fonksiyon detayları ve çağrı noktaları
├── function-details.js        # Fonksiyon detay paneli
├── graph-layout.js            # Kart yerleşimi ve ok güzergâhları
├── graph-view.js              # SVG çizimi, seçim ve gezinme kontrolleri
├── analyzer.test.js           # Temel analiz testleri
├── analysis-details.test.js   # Ayrıntılı analiz testleri
├── graph-layout.test.js       # Yerleşim ve ok çakışması testleri
├── Baslat.bat                 # Windows başlatıcısı
└── README.md
~~~

Uygulama HTML, CSS ve JavaScript ile geliştirilmiştir. Paket bağımlılığı veya derleme adımı yoktur.

## Geliştirme ve testler

Dosyaları düzenleyip tarayıcıyı yenileyerek değişiklikleri inceleyebilirsiniz. Tarayıcı eski dosyaları gösteriyorsa **Ctrl + F5** kullanın.

Testleri çalıştırmak için Node.js gerekir. Proje klasöründe:

~~~sh
node analyzer.test.js
node analysis-details.test.js
node graph-layout.test.js
~~~

Testler; Python ve TypeScript import ilişkilerini, fonksiyon sınırlarını, çağrı noktalarını, argümanları, kaynak açıklamalarını, özyinelemeyi ve kartların içinden geçmeyen dik açılı ok güzergâhlarını kapsar. Bu kontroller tam tarayıcı veya tüm dil sözdizimleri için uyumluluk testi değildir.

## Katkıda bulunma

Hata bildirirken mümkünse sorunu yeniden üreten küçük bir kaynak örneği, beklenen ilişki ve görünen sonucu paylaşın. Analiz motorundaki değişikliklere ilgili regresyon testini, yerleşim değişikliklerine ise çakışma kontrolünü ekleyin.
