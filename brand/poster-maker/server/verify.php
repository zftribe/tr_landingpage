<?php
/* One-time email link. GET shows a confirm button (so mail scanners can't use up the link); POST signs in. */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/page.php';

$t = (string)($_REQUEST['t'] ?? '');
if (!preg_match('/^[a-f0-9]{64}$/', $t)) zt_redirect('./?m=expired');
$hash = hash('sha256', $t);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    zt_check_csrf();
    $email = zt_update('tokens', function (array &$d) use ($hash) {
        $row = $d[$hash] ?? null; unset($d[$hash]);
        return ($row && $row['exp'] >= zt_now()) ? $row['email'] : null;
    });
    if (!$email) zt_redirect('./?m=expired');
    $inv = zt_read('invites');
    if ((!isset($inv[$email]) || !empty($inv[$email]['revoked'])) && !zt_is_admin_email($email)) zt_redirect('./?m=expired');
    zt_sign_in(['via' => 'email', 'email' => $email, 'name' => $inv[$email]['name'] ?? $email]);
    zt_update('invites', function (array &$d) use ($email) { if (isset($d[$email])) $d[$email]['last'] = gmdate('c'); });
    zt_log('signin_email', ['email' => $email]);
    zt_redirect('./');
}

$tokens = zt_read('tokens');
if (!isset($tokens[$hash]) || $tokens[$hash]['exp'] < zt_now()) zt_redirect('./?m=expired');
$csrf = zt_csrf(); $th = zt_h($t);
zt_page('Sign in · TR Poster Maker', <<<HTML
<main class="wrap">
  <div class="brand"><img src="tr-mark-gold.svg" alt="Trading Republic" style="height:34px"></div>
  <h1>Finish signing in</h1>
  <form method="post" class="card"><input type="hidden" name="csrf" value="{$csrf}"><input type="hidden" name="t" value="{$th}">
    <p class="muted">Tap the button to open the Poster Maker.</p>
    <button class="btn gold" type="submit">Sign in</button></form>
</main>
HTML);
