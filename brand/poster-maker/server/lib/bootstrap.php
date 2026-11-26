<?php
/* ZFT tools gate: config, sessions, storage, helpers.
   Secrets and data live OUTSIDE public_html, in ../zft-tools/ (one level above the web root). */
declare(strict_types=1);

const ZT_VERSION = '1.0';

function zt_private_dir(): string {
    $env = getenv('ZT_PRIVATE_DIR');
    if ($env) return rtrim($env, '/\\');
    return rtrim(dirname($_SERVER['DOCUMENT_ROOT'] ?? __DIR__ . '/../../..'), '/\\') . '/zft-tools';
}

function zt_config(): array {
    static $cfg = null;
    if ($cfg !== null) return $cfg;
    $file = zt_private_dir() . '/config.php';
    if (!is_file($file)) {
        http_response_code(503);
        exit('The poster tool is not set up yet: config.php is missing in the private zft-tools folder.');
    }
    $cfg = require $file;
    $cfg += [
        'base_url' => 'https://zeefreaks.io/posters',
        'discord_client_id' => '', 'discord_client_secret' => '',
        'guild_id' => 'CHANGE_ME', 'allowed_role_ids' => [],
        'admin_discord_ids' => [], 'admin_emails' => [],
        'mail_from' => 'CHANGE_ME', 'mail_from_name' => 'Trading Republic tools',
        'session_hours' => 24, 'link_minutes' => 15,
        'discord_api' => 'https://discord.com/api/v10',
        'discord_webhooks' => [], 'discord_allow_everyone' => false, 'discord_bot_token' => '',
        'fb_app_id' => '', 'fb_app_secret' => '', 'fb_page_id' => '',
        'graph_api' => 'https://graph.facebook.com/v21.0', 'fb_dialog' => 'https://www.facebook.com/v21.0/dialog/oauth',
    ];
    return $cfg;
}

function zt_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    session_name('zt_sess');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/posters/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Lax']);
    $dir = zt_private_dir() . '/sessions';
    if (is_dir($dir) && is_writable($dir)) session_save_path($dir);
    session_start();
}

function zt_headers(): void {
    header('X-Frame-Options: DENY');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');
    header('Cache-Control: no-store');
    header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob: https://cdn.discordapp.com; connect-src 'self'; media-src 'self' blob:; form-action 'self' https://discord.com; frame-ancestors 'none'; base-uri 'none'");
}

/* ---------- JSON storage with file locks ---------- */
function zt_store_path(string $name): string {
    $dir = zt_private_dir() . '/data';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    return $dir . '/' . preg_replace('/[^a-z0-9_-]/', '', $name) . '.json';
}
/* One lock file per store; the data file itself is only ever replaced whole (temp file + rename),
   so a crash or full disk can't leave half-written JSON. A file that doesn't parse is kept aside, never treated as empty. */
function zt_lock(string $p, int $mode) {
    $lh = fopen($p . '.lock', 'c'); if (!$lh) throw new RuntimeException('storage unavailable');
    if (!flock($lh, $mode)) { fclose($lh); throw new RuntimeException('storage busy'); }
    @chmod($p . '.lock', 0600);
    return $lh;
}
function zt_decode_store(string $p): array {
    if (!is_file($p)) return [];
    $raw = file_get_contents($p);
    if ($raw === false) throw new RuntimeException('storage unreadable');
    if (trim($raw) === '') return [];
    $d = json_decode($raw, true);
    if (!is_array($d)) { @copy($p, $p . '.corrupt-' . gmdate('Ymd-His')); throw new RuntimeException('storage corrupt: ' . basename($p)); }
    return $d;
}
function zt_read(string $name): array {
    $p = zt_store_path($name);
    try { $lh = zt_lock($p, LOCK_SH); } catch (Throwable $e) { return []; }
    try { return zt_decode_store($p); } catch (Throwable $e) { return []; }
    finally { flock($lh, LOCK_UN); fclose($lh); }
}
/* read-modify-write under an exclusive lock; throws (and changes nothing) if the store can't be read or written */
function zt_update(string $name, callable $fn) {
    $p = zt_store_path($name);
    $lh = zt_lock($p, LOCK_EX);
    try {
        $d = zt_decode_store($p);
        $result = $fn($d);
        $json = json_encode($d, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $tmp = $p . '.tmp-' . bin2hex(random_bytes(4));
        $fh = fopen($tmp, 'x'); if (!$fh) throw new RuntimeException('storage unwritable');
        $ok = fwrite($fh, $json) === strlen($json) && fflush($fh);
        if ($ok && function_exists('fsync')) $ok = fsync($fh);
        fclose($fh);
        @chmod($tmp, 0600);
        if (!$ok || !rename($tmp, $p)) { @unlink($tmp); throw new RuntimeException('storage write failed'); }
        return $result;
    } finally { flock($lh, LOCK_UN); fclose($lh); }
}

/* ---------- helpers ---------- */
function zt_h($s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function zt_norm_email(string $e): string { return strtolower(trim($e)); }
function zt_ip(): string { return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'; }
function zt_now(): int { return time(); }

function zt_csrf(): string {
    zt_session();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
    return $_SESSION['csrf'];
}
function zt_check_csrf(): void {
    zt_session();
    $t = $_POST['csrf'] ?? '';
    if (!is_string($t) || empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $t)) { http_response_code(400); exit('This form expired. Go back, reload the page and try again.'); }
}

function zt_log(string $event, array $data = []): void {
    try {
        zt_update('log', function (array &$d) use ($event, $data) {
            $d[] = ['at' => gmdate('c'), 'event' => $event, 'ip' => substr(hash('sha256', zt_ip()), 0, 12)] + $data;
            if (count($d) > 500) $d = array_slice($d, -500);
        });
    } catch (Throwable $e) {}
}

/* simple rate limit: max $n hits per $sec for a key */
function zt_rate(string $key, int $n, int $sec): bool {
    return zt_update('rate', function (array &$d) use ($key, $n, $sec) {
        $now = zt_now(); $k = hash('sha256', $key);
        foreach ($d as $kk => $hits) { $d[$kk] = array_values(array_filter($hits, fn($t) => $t > $now - 86400)); if (!$d[$kk]) unset($d[$kk]); }   // keep a day: the longest window in use
        $hits = array_values(array_filter($d[$k] ?? [], fn($t) => $t > $now - $sec));
        if (count($hits) >= $n) { $d[$k] = $hits; return false; }
        $hits[] = $now; $d[$k] = $hits; return true;
    });
}

/* ---------- who is signed in ---------- */
function zt_user(): ?array {
    zt_session();
    $u = $_SESSION['user'] ?? null;
    if (!$u) return null;
    $cfg = zt_config();
    if (($u['exp'] ?? 0) < zt_now()) { $_SESSION = []; return null; }
    if ($u['via'] === 'email') {
        // invite must still be active
        $inv = zt_read('invites');
        $e = $u['email'] ?? '';
        if (!isset($inv[$e]) || !empty($inv[$e]['revoked'])) { if (!zt_is_admin_email($e)) { $_SESSION = []; return null; } }
    }
    return $u;
}
function zt_is_admin_email(string $e): bool { return in_array(zt_norm_email($e), array_map('zt_norm_email', zt_config()['admin_emails']), true); }
function zt_is_admin(array $u): bool {
    $cfg = zt_config();
    if ($u['via'] === 'discord') return in_array((string)$u['id'], array_map('strval', $cfg['admin_discord_ids']), true);
    return zt_is_admin_email($u['email'] ?? '');
}
function zt_sign_in(array $user): void {
    zt_session();
    session_regenerate_id(true);
    $user['exp'] = zt_now() + 3600 * (int)zt_config()['session_hours'];
    $_SESSION['user'] = $user;
    unset($_SESSION['oauth_state']);
}
/* Discord roles that may sign in: the ones in config.php plus the ones George adds on the admin page. id => label */
function zt_allowed_roles(): array {
    $out = [];
    foreach (zt_config()['allowed_role_ids'] as $id) $out[(string)$id] = ['label' => 'Guild Leaders', 'fixed' => true];
    foreach (zt_read('roles') as $id => $r) if (empty($r['removed']) && !isset($out[(string)$id])) $out[(string)$id] = ['label' => $r['label'] ?? '', 'fixed' => false];
    return $out;
}
function zt_user_key(array $u): string { return $u['via'] === 'discord' ? 'd:' . $u['id'] : 'e:' . hash('sha256', zt_norm_email($u['email'] ?? '')); }
function zt_tour_done(array $u): bool { return isset(zt_read('tour')[zt_user_key($u)]); }
function zt_hidden_templates(): array {
    return array_values(array_filter(zt_read('templates')['hidden'] ?? [], 'is_string'));
}
function zt_redirect(string $path): void { header('Location: ' . $path, true, 302); exit; }
