<?php
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') zt_redirect('./');
zt_check_csrf();
require __DIR__ . '/lib/net.php';
zt_fb_forget();
$_SESSION = [];
if (ini_get('session.use_cookies')) { $p = session_get_cookie_params(); setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => $p['path'], 'secure' => $p['secure'], 'httponly' => true, 'samesite' => 'Lax']); }
session_destroy();
zt_redirect('./?m=out');
