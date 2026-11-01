BELDARI SAMAJ SEVA - OG IMAGE SYSTEM
====================================
Facebook/WhatsApp/Messenger/Twitter crawler JavaScript nahi chalate. Isliye har post ka apna
/post/<slug>/ page banta hai jisme OG + Twitter meta tags pehle se HTML me likhe hote hain.

FILES
  index.html   aapki site (design same; sirf <head> me default OG tags + </body> se pehle og.js)
  og.js        share buttons, post form me "OG image", Admin -> posts.json + 1200x630 images export
  generate.js  static pages banata hai (Node 16.7+)      <- option A (best)
  share.php    dynamic pages (PHP hosting)               <- option B
  .htaccess    /post/<slug>/ -> share.php (sirf option B)
  posts.json   har post ka slug, title, description, image
  config.json  siteUrl (https), siteName, defaultImage
  og/          1200x630 images (default + 2 current posts)

STEP 1: config.json me "siteUrl" apne asli https domain par set karo (jaise https://beldari.com)
        Bina https ya YOUR-DOMAIN ke generate.js error dega.

OPTION A (static, kisi bhi hosting par):
  node generate.js        -> dist/ folder banta hai
  dist/ ki saari files hosting ke root (public_html) me upload karo.
OPTION B (PHP/cPanel hosting, Node nahi):
  Saari files root me upload karo. index.html me "https://YOUR-DOMAIN.com" ko apne domain se replace karo.
  posts.json badalte hi naye post ka page apne aap chalta hai (generate.js ki zarurat nahi).

NAYA POST PUBLISH KARNE KA FLOW
  1. Site me Admin -> post banao. (Optional: form me alag "OG image" chuno; warna featured image use hogi.)
  2. Admin dashboard ke neeche "OG Preview Export" -> button dabao. posts.json + <slug>.jpg downloads honge.
  3. <slug>.jpg files ko og/ folder me daalo, posts.json replace karo.
  4. Option A: node generate.js chalao aur dist/ dobara upload karo. Option B: bas upload (step 3) kaafi hai.
  5. Share link: https://aapka-domain/post/<slug>/  (site ke post popup me "Link copy / Facebook / WhatsApp" buttons hain)
  (Ye manual upload isliye hai kyunki site abhi sirf frontend hai. Backend/database judne par step 2-4 automatic ho sakte hain.)

TEST (deploy ke baad)
  curl -A "facebookexternalhit/1.1" https://aapka-domain/post/beldari-road-condition/ | head -40
     -> og:title, og:image, og:image:width/height initial HTML me dikhne chahiye
  https://developers.facebook.com/tools/debug/  -> link daalo -> "Scrape Again"
  Image link browser me seedha kholkar check karo (public, https, 200 OK).
IMAGE RULES: https, public, 1200x630 (ya 1.91:1), 8MB se kam, JPG/PNG.
