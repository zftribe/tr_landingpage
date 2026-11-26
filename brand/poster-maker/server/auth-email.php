<?php
/* Invite-only email sign-in: send a one-time link to invited addresses. Always answers the same way, so the list stays private. */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/mail.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') zt_redirect('./');
zt_check_csrf();
$cfg = zt_config();
$email = zt_norm_email((string)($_POST['email'] ?? ''));
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) zt_redirect('./?m=sent');
if (!zt_rate('email-ip:' . zt_ip(), 6, 900) || !zt_rate('email-addr:' . $email, 3, 900)) zt_redirect('./?m=slow');

$inv = zt_read('invites');
$ok = (isset($inv[$email]) && empty($inv[$email]['revoked'])) || zt_is_admin_email($email);
if ($ok) {
    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    $exp = zt_now() + 60 * (int)$cfg['link_minutes'];
    zt_update('tokens', function (array &$d) use ($hash, $email, $exp) {
        $now = zt_now();
        foreach ($d as $k => $v) if (($v['exp'] ?? 0) < $now) unset($d[$k]);
        $d[$hash] = ['email' => $email, 'exp' => $exp];
    });
    $link = rtrim($cfg['base_url'], '/') . '/verify.php?t=' . $token;
    $name = $inv[$email]['name'] ?? '';
    $sent = zt_send_mail($email, 'Your sign-in link for the TR Poster Maker',
        "Hi" . ($name ? " $name" : "") . ",\n\nUse this link to sign in to the Trading Republic Poster Maker:\n\n$link\n\nIt works once and expires in {$cfg['link_minutes']} minutes. If you didn't ask for it, you can ignore this email.\n\nTrading Republic by ZFT\n");
    zt_log($sent ? 'email_link_sent' : 'email_link_failed', ['email' => $email]);
} else {
    zt_log('email_not_invited', ['email_hash' => substr(hash('sha256', $email), 0, 12)]);
}
zt_redirect('./?m=sent');
