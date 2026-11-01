<?php
/* BELDARI SAMAJ SEVA - dynamic OG page (shared/PHP hosting ke liye). /post/<slug>/ -> share.php?slug=<slug> (.htaccess) */
$cfg = json_decode(file_get_contents(__DIR__ . '/config.json'), true);
$site = rtrim($cfg['siteUrl'], '/');
$posts = json_decode(file_get_contents(__DIR__ . '/posts.json'), true) ?: [];
$slug = preg_replace('/[^a-z0-9\-]/', '', strtolower(isset($_GET['slug']) ? $_GET['slug'] : ''));
$p = null; foreach ($posts as $x) { if ($x['slug'] === $slug) { $p = $x; break; } }
if (!$p) { http_response_code(404); header('Location: ' . $site . '/'); exit; }
function e($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
$rel = !empty($p['ogImage']) ? $p['ogImage'] : (!empty($p['image']) ? $p['image'] : $cfg['defaultImage']);
$img = preg_match('#^https?://#', $rel) ? preg_replace('#^http://#', 'https://', $rel) : $site . '/' . ltrim($rel, '/');
$w = 1200; $h = 630; $t = 'image/jpeg'; $f = __DIR__ . '/' . ltrim($rel, '/');
if (is_file($f) && ($g = @getimagesize($f))) { $w = $g[0]; $h = $g[1]; $t = $g['mime']; }
$url = $site . '/post/' . $p['slug'] . '/'; $app = $site . '/#post=' . $p['id'];
$title = e($p['title']); $desc = e(!empty($p['description']) ? $p['description'] : $cfg['defaultDescription']); $name = e($cfg['siteName']);
header('Content-Type: text/html; charset=utf-8');
?><!DOCTYPE html><html lang="ne"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= $title ?> | <?= $name ?></title><meta name="description" content="<?= $desc ?>"><link rel="canonical" href="<?= e($url) ?>">
<meta property="og:locale" content="ne_NP"><meta property="og:type" content="article"><meta property="og:site_name" content="<?= $name ?>">
<meta property="og:title" content="<?= $title ?>"><meta property="og:description" content="<?= $desc ?>"><meta property="og:url" content="<?= e($url) ?>">
<meta property="og:image" content="<?= e($img) ?>"><meta property="og:image:secure_url" content="<?= e($img) ?>"><meta property="og:image:type" content="<?= e($t) ?>">
<meta property="og:image:width" content="<?= (int)$w ?>"><meta property="og:image:height" content="<?= (int)$h ?>"><meta property="og:image:alt" content="<?= $title ?>">
<?php if (!empty($p['date'])): ?><meta property="article:published_time" content="<?= e($p['date']) ?>"><?php endif; ?>
<meta name="twitter:card" content="summary_large_image"><?php if (!empty($cfg['twitterSite'])): ?><meta name="twitter:site" content="<?= e($cfg['twitterSite']) ?>"><?php endif; ?>
<meta name="twitter:title" content="<?= $title ?>"><meta name="twitter:description" content="<?= $desc ?>"><meta name="twitter:image" content="<?= e($img) ?>"><meta name="twitter:image:alt" content="<?= $title ?>">
<style>body{margin:0;font-family:system-ui,"Noto Sans Devanagari",sans-serif;background:#eef5ff;color:#0f172a}main{max-width:680px;margin:auto;padding:16px}img{max-width:100%;border-radius:14px}a.b{display:inline-block;background:#1d4ed8;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none}</style></head>
<body><main><h1><?= $title ?></h1><img src="<?= e($img) ?>" alt="<?= $title ?>"><p><?= $desc ?></p><p><a class="b" href="<?= e($app) ?>"><?= $name ?> मा पूरा हेर्नुहोस् →</a></p></main>
<script>location.replace(<?= json_encode($app) ?>)</script></body></html>
