<?php
/* "Sign in with Facebook" for admins, to post on the Trading Republic Page.
   Facebook Login → user token → the Page's own token for config 'fb_page_id'. The Page token is split: the server session
   (private folder) keeps it only encrypted, and the key sits only in an httponly cookie (see zt_fb_store in lib/net.php).
   It is never written in plain text, never put in data files and never readable by page scripts. 3-hour limit. */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/net.php';
require __DIR__ . '/lib/page.php';

$u = zt_user();
if (!$u) zt_redirect('./');
$cfg = zt_config();
$back = function (string $msg, bool $ok = false) { zt_page('Facebook · TR Poster Maker', '<main class="wrap"><h1>Facebook</h1><div class="msg ' . ($ok ? 'ok' : 'bad') . '" role="status">' . zt_h($msg) . '</div><a class="btn gold" href="./">Back to the Poster Maker</a></main>'); exit; };
if (!zt_is_admin($u)) $back('Only admins can post to the Trading Republic Page.');
$appId = (string)($cfg['fb_app_id'] ?? ''); $secret = (string)($cfg['fb_app_secret'] ?? ''); $pageId = (string)($cfg['fb_page_id'] ?? '');
if ($appId === '' || $secret === '' || $pageId === '') $back('The Facebook connection isn\'t set up yet.');
$graph = rtrim((string)($cfg['graph_api'] ?? 'https://graph.facebook.com/v21.0'), '/');
$dialog = (string)($cfg['fb_dialog'] ?? 'https://www.facebook.com/v21.0/dialog/oauth');
$redirect = rtrim($cfg['base_url'], '/') . '/fb-login.php';

if (isset($_GET['error'])) $back('Facebook sign-in was cancelled.');
if (!isset($_GET['code'])) {
    if (!zt_rate('fb:' . zt_ip(), 20, 600)) $back('Too many tries. Wait a few minutes.');
    $state = bin2hex(random_bytes(16)); $_SESSION['fb_state'] = $state;
    zt_redirect($dialog . '?' . http_build_query(['client_id' => $appId, 'redirect_uri' => $redirect, 'state' => $state, 'response_type' => 'code',
        'scope' => 'pages_show_list,pages_read_engagement,pages_manage_posts']));
}
$state = $_GET['state'] ?? '';
if (!is_string($state) || empty($_SESSION['fb_state']) || !hash_equals($_SESSION['fb_state'], $state)) $back('Facebook sign-in didn\'t work. Please try again.');
unset($_SESSION['fb_state']);

[$c, $tok] = zt_http('GET', $graph . '/oauth/access_token?' . http_build_query(['client_id' => $appId, 'client_secret' => $secret, 'redirect_uri' => $redirect, 'code' => (string)$_GET['code']]), []);
if ($c !== 200 || empty($tok['access_token'])) { zt_log('fb_token_fail', ['http' => $c]); $back('Facebook sign-in didn\'t work. Please try again.'); }
[$c, $acc] = zt_http('GET', $graph . '/me/accounts?' . http_build_query(['fields' => 'id,name,access_token,tasks', 'limit' => 100, 'access_token' => $tok['access_token']]), []);
$page = null;
foreach (($acc['data'] ?? []) as $p) if ((string)($p['id'] ?? '') === $pageId) { $page = $p; break; }
if (!$page || empty($page['access_token'])) { zt_log('fb_no_page', ['by' => $u['name'] ?? '']); $back('That Facebook account isn\'t an admin of the Trading Republic Page (or didn\'t allow the Page during sign-in). Sign in again and tick the Trading Republic Page.'); }
if (isset($page['tasks']) && is_array($page['tasks']) && !array_intersect(['CREATE_CONTENT', 'MANAGE'], $page['tasks'])) $back('That Facebook account can\'t create posts on the Trading Republic Page.');

session_regenerate_id(true);
zt_fb_store($pageId, (string)($page['name'] ?? 'Trading Republic'), (string)$page['access_token'], 3 * 3600);
zt_log('fb_connect', ['by' => $u['name'] ?? '']);
zt_redirect('./?fb=connected');
