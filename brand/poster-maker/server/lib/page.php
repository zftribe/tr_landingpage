<?php
/* Shared look for the sign-in, message and admin pages (Trading Republic dark + gold). */
declare(strict_types=1);

function zt_page(string $title, string $body): void {
    zt_headers();
    header('Content-Type: text/html; charset=utf-8');
    $t = zt_h($title);
    echo <<<HTML
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>{$t}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Plus+Jakarta+Sans:wght@700;800&display=swap">
<style>
:root{--bg:#0b0b0f;--panel:#13131a;--panel2:#1a1a23;--line:#262632;--ink:#f5f5f7;--muted:#9a9aab;--gold:#FFB400;--bad:#ff6b6b;--ok:#3ddc84;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg) radial-gradient(900px 500px at 80% -10%,rgba(255,180,0,.12),transparent);color:var(--ink);font:15px/1.5 "DM Sans","Segoe UI",Arial,sans-serif;min-height:100vh}
.wrap{max-width:440px;margin:0 auto;padding:48px max(16px,env(safe-area-inset-left)) 48px max(16px,env(safe-area-inset-right));display:grid;gap:20px}
.wrap.wide{max-width:900px}
.brand{display:flex;align-items:center;gap:12px}
.brand img{height:30px}
h1{font:800 26px/1.15 "Plus Jakarta Sans","Segoe UI",Arial,sans-serif;margin:0;letter-spacing:-.01em}
h1 b{color:var(--gold)}
h2{font:700 17px "Plus Jakarta Sans",Arial,sans-serif;margin:0}
p{margin:0}
.muted{color:var(--muted)}
.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:22px;display:grid;gap:14px}
.btn{display:flex;align-items:center;justify-content:center;gap:10px;font:700 15px "DM Sans",Arial,sans-serif;border-radius:12px;padding:13px 16px;border:1px solid var(--line);background:var(--panel2);color:var(--ink);text-decoration:none;cursor:pointer;width:100%}
.btn.discord{background:#5865F2;border-color:#5865F2;color:#fff}
.btn.gold{background:var(--gold);border-color:var(--gold);color:#111}
.btn:focus-visible,input:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.or{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.1em}
.or::before,.or::after{content:"";flex:1;height:1px;background:var(--line)}
label{font-weight:700;font-size:13px;color:var(--muted)}
input[type=email],input[type=text]{width:100%;font:inherit;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:12px}
.note{font-size:13px;color:var(--muted)}
.msg{border-radius:12px;padding:12px 14px;font-size:14px}
.msg.bad{background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.35)}
.msg.ok{background:rgba(61,220,132,.1);border:1px solid rgba(61,220,132,.35)}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--line);vertical-align:middle}
th{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.08em}
.scroll{overflow-x:auto}
.pill{display:inline-block;font-size:12px;border-radius:99px;padding:2px 8px;border:1px solid var(--line)}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:end}
.row>*{flex:1 1 180px}
.linkbtn{background:none;border:0;color:var(--muted);font:inherit;cursor:pointer;text-decoration:underline;padding:0}
a{color:var(--gold)}
</style></head><body>{$body}</body></html>
HTML;
    exit;
}

function zt_brand(): string {
    return '<div class="brand"><img src="tr-mark-gold.svg" alt="Trading Republic"></div>';
}
