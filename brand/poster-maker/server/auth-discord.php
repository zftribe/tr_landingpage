<?php
/* Discord OAuth2: identify + guilds.members.read. Access only with an allowed role (Guild Leader) or as an admin. */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/net.php';

$cfg = zt_config();
zt_session();
if ($cfg['discord_client_id'] === '' || $cfg['discord_client_secret'] === '') zt_redirect('./?m=failed');
$redirect = rtrim($cfg['base_url'], '/') . '/auth-discord.php';

if (isset($_GET['error'])) zt_redirect('./?m=denied');

if (!isset($_GET['code'])) {
    if (!zt_rate('discord:' . zt_ip(), 20, 600)) zt_redirect('./?m=slow');
    $state = bin2hex(random_bytes(16));
    $_SESSION['oauth_state'] = $state;
    $q = http_build_query([
        'client_id' => $cfg['discord_client_id'], 'redirect_uri' => $redirect, 'response_type' => 'code',
        'scope' => 'identify guilds.members.read', 'state' => $state,
    ]);
    zt_redirect('https://discord.com/oauth2/authorize?' . $q);
}

$state = $_GET['state'] ?? '';
if (!is_string($state) || empty($_SESSION['oauth_state']) || !hash_equals($_SESSION['oauth_state'], $state)) zt_redirect('./?m=failed');
unset($_SESSION['oauth_state']);


[$c, $tok] = zt_http('POST', $cfg['discord_api'] . '/oauth2/token', ['Content-Type: application/x-www-form-urlencoded'], http_build_query([
    'client_id' => $cfg['discord_client_id'], 'client_secret' => $cfg['discord_client_secret'],
    'grant_type' => 'authorization_code', 'code' => (string)$_GET['code'], 'redirect_uri' => $redirect,
]));
if ($c !== 200 || empty($tok['access_token'])) { zt_log('discord_token_fail', ['http' => $c]); zt_redirect('./?m=failed'); }
$auth = ['Authorization: Bearer ' . $tok['access_token']];

[$c, $me] = zt_http('GET', $cfg['discord_api'] . '/users/@me', $auth);
if ($c !== 200 || empty($me['id'])) zt_redirect('./?m=failed');

[$c, $member] = zt_http('GET', $cfg['discord_api'] . '/users/@me/guilds/' . rawurlencode($cfg['guild_id']) . '/member', $auth);
$isAdmin = in_array((string)$me['id'], array_map('strval', $cfg['admin_discord_ids']), true);
$roles = ($c === 200 && isset($member['roles']) && is_array($member['roles'])) ? array_map('strval', $member['roles']) : [];
$allowed = array_map('strval', array_keys(zt_allowed_roles()));
$hasRole = (bool)array_intersect($roles, $allowed);

// revoke the token right away: we only needed it for this check
zt_http('POST', $cfg['discord_api'] . '/oauth2/token/revoke', ['Content-Type: application/x-www-form-urlencoded'], http_build_query([
    'client_id' => $cfg['discord_client_id'], 'client_secret' => $cfg['discord_client_secret'], 'token' => $tok['access_token'],
]));

if (!$isAdmin && !$hasRole) {
    zt_log('discord_denied', ['user' => $me['id'], 'member' => $c === 200]);
    zt_redirect($c === 200 ? './?m=norole' : './?m=notmember');
}

$name = $member['nick'] ?? ($me['global_name'] ?? ($me['username'] ?? 'Guild Leader'));
zt_sign_in(['via' => 'discord', 'id' => (string)$me['id'], 'name' => (string)$name]);
zt_log('signin_discord', ['user' => $me['id']]);
zt_redirect('./');
