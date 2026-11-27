<?php
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/page.php';

$user = zt_user();
if ($user) {
    zt_headers();
    header('Content-Type: text/html; charset=utf-8');
    $html = file_get_contents(__DIR__ . '/app.html');
    $name = zt_h($user['name'] ?? $user['email'] ?? 'Guild Leader');
    $bar = '<div class="ztbar"><span>Signed in as <b>' . $name . '</b>' . ($user['via'] === 'discord' ? ' · Discord' : ' · email') . '</span><span>'
         . (zt_is_admin($user) ? '<a href="admin.php">Access</a> · ' : '')
         . '<form method="post" action="logout.php" style="display:inline"><input type="hidden" name="csrf" value="' . zt_csrf() . '"><button type="submit" class="ztout">Sign out</button></form></span></div>';
    $style = '<style>.ztbar{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font:13px "DM Sans",Arial,sans-serif;color:#9a9aab;background:#0f0f15;border-bottom:1px solid #262632;padding:8px max(16px,env(safe-area-inset-left))}.ztbar b{color:#f5f5f7}.ztbar a{color:#FFB400}.ztout{all:unset;cursor:pointer;color:#FFB400}.ztout:focus-visible{outline:2px solid #FFB400}</style>';
    $cfg = zt_config();
    $hooks = is_array($cfg['discord_webhooks'] ?? null) ? array_keys(array_filter($cfg['discord_webhooks'], fn($v) => is_string($v) && $v !== '')) : [];
    require_once __DIR__ . '/lib/net.php';
    $fbs = $_SESSION['fb'] ?? null; $fbOn = zt_fb_connected();
    $fb = ['ready' => ($cfg['fb_app_id'] ?? '') !== '' && ($cfg['fb_page_id'] ?? '') !== '', 'connected' => (bool)$fbOn, 'page' => $fbOn ? $fbs['page'] : ''];
    $zt = '<script>window.ZT=' . json_encode(['admin' => zt_is_admin($user), 'hidden' => zt_hidden_templates(), 'csrf' => zt_csrf(), 'tourDone' => zt_tour_done($user),
        'name' => (string)($user['name'] ?? ''), 'via' => $user['via'], 'channels' => array_values(array_map('strval', $hooks)), 'presets' => (object)zt_read('presets'), 'fb' => zt_is_admin($user) ? $fb : ['ready' => false],
        'brand' => (function () { $b = zt_read('brand'); return ['colours' => array_values($b['colours'] ?? []), 'gfonts' => array_values($b['gfonts'] ?? []), 'fonts' => array_values(array_map(fn($f) => ['id' => $f['id'], 'name' => $f['name']], $b['fonts'] ?? []))]; })(),
        'cron' => (zt_read('cron')['last'] ?? 0) > zt_now() - 1800, 'events' => ($cfg['discord_bot_token'] ?? '') !== ''], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) . ';</script>';
    echo str_replace('<!--USERBAR-->', $style . $bar . $zt, $html);
    exit;
}

$m = $_GET['m'] ?? '';
$msgs = [
    'sent'      => ['ok', 'If that email is on the invite list, a sign-in link is on its way. It works once and expires in ' . (int)zt_config()['link_minutes'] . ' minutes. Check spam too.'],
    'expired'   => ['bad', 'That sign-in link has expired or was already used. Ask for a new one below.'],
    'norole'    => ['bad', 'You signed in with Discord, but your account doesn\'t have a role that can use this tool (like Guild Leaders) in Trading Republic. Ask a staff member if you think that\'s wrong.'],
    'notmember' => ['bad', 'That Discord account isn\'t in the Trading Republic server.'],
    'denied'    => ['bad', 'Discord sign-in was cancelled.'],
    'failed'    => ['bad', 'Discord sign-in didn\'t work. Please try again.'],
    'slow'      => ['bad', 'Too many sign-in requests. Wait a few minutes and try again.'],
    'out'       => ['ok', 'You\'re signed out.'],
];
$msg = isset($msgs[$m]) ? '<div class="msg ' . $msgs[$m][0] . '" role="status">' . zt_h($msgs[$m][1]) . '</div>' : '';
$csrf = zt_csrf();
$discordReady = zt_config()['discord_client_id'] !== '';

$discordBtn = $discordReady
    ? '<a class="btn discord" href="auth-discord.php"><svg width="22" height="16" viewBox="0 0 71 55" aria-hidden="true"><path fill="#fff" d="M60.1 4.9A58.5 58.5 0 0 0 45.4.4l-1.9 3.8a54 54 0 0 0-16.2 0L25.4.4a58.4 58.4 0 0 0-14.7 4.5C1.4 18.7-1.1 32.2.1 45.5a58.9 58.9 0 0 0 18 9.1l3.9-6.3a38.3 38.3 0 0 1-6-2.9l1.5-1.1a42 42 0 0 0 36 0l1.5 1.1a38 38 0 0 1-6.1 2.9l3.9 6.3a58.7 58.7 0 0 0 18-9.1c1.4-15.4-2.4-28.8-10.7-40.6ZM23.7 37.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 4-2.8 7.2-6.4 7.2Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.3 6.4 7.2c0 4-2.8 7.2-6.4 7.2Z"/></svg>Sign in with Discord</a>'
    : '<p class="note">Discord sign-in isn\'t switched on yet.</p>';

zt_page('TR Poster Maker · Sign in', <<<HTML
<main class="wrap">
  <div class="brand"><img src="tr-mark-gold.svg" alt="Trading Republic" style="height:34px"><img src="zft-wordmark-white.svg" alt="ZFT" style="height:26px"></div>
  <div><h1>TR <b>Poster Maker</b></h1><p class="muted">For Trading Republic Guild Leaders. Make event and announcement posters in the house style.</p></div>
  {$msg}
  <section class="card" aria-labelledby="h-discord">
    <h2 id="h-discord">Guild Leaders</h2>
    <p class="note">Sign in with the Discord account that has the Guild Leader role in Trading Republic.</p>
    {$discordBtn}
    <div class="or">or</div>
    <form method="post" action="auth-email.php" class="card" style="padding:0;border:0;background:none;gap:10px">
      <input type="hidden" name="csrf" value="{$csrf}">
      <label for="email">Invited by email? Get a sign-in link</label>
      <input type="email" id="email" name="email" required autocomplete="email" placeholder="you@example.com">
      <button class="btn gold" type="submit">Email me a sign-in link</button>
      <p class="note">Email sign-in works only for people George has invited.</p>
    </form>
  </section>
  <p class="note">Trading Republic by ZFT</p>
</main>
HTML);
