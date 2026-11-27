<?php
/* Outgoing HTTP for the tools gate: JSON calls and multipart file uploads (Discord webhooks, Facebook Graph). */
declare(strict_types=1);

function zt_http(string $method, string $url, array $headers, $body = null): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $headers, CURLOPT_TIMEOUT => 45, CURLOPT_USERAGENT => 'ZFT-Tools (zeefreaks.io, 1.1)']);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    $res = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    return [$code, is_string($res) ? (json_decode($res, true) ?: []) : []];
}

/* The one uploaded file from a "Confirm and post" request: checked type and size. Returns [path, mime, name] or exits with JSON. */
function zt_upload_file(int $maxBytes): array {
    $f = $_FILES['file'] ?? null;
    if ($f && in_array($f['error'] ?? 0, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) zt_json_fail(413, 'That file is bigger than the server accepts. Nothing was posted. Attach the PNG, or make a smaller GIF.');
    if (!$f || !is_array($f) || ($f['error'] ?? 1) !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) zt_json_fail(400, 'The poster file didn\'t arrive. Try again.');
    if ($f['size'] > $maxBytes) zt_json_fail(413, 'That file is too big (over ' . round($maxBytes / 1048576) . ' MB). Attach the PNG, or make a smaller GIF.');
    // sniff the real type from the first bytes (never trust the name or the browser's type)
    $head = (string)file_get_contents($f['tmp_name'], false, null, 0, 16);
    $mime = str_starts_with($head, "\x89PNG\r\n\x1a\n") ? 'image/png'
        : (str_starts_with($head, "\xFF\xD8\xFF") ? 'image/jpeg'
        : (str_starts_with($head, 'GIF87a') || str_starts_with($head, 'GIF89a') ? 'image/gif'
        : (str_starts_with($head, "\x1A\x45\xDF\xA3") ? 'video/webm'
        : (substr($head, 4, 4) === 'ftyp' ? 'video/mp4' : ''))));
    $ext = ['image/png' => 'png', 'image/jpeg' => 'jpg', 'image/gif' => 'gif', 'video/mp4' => 'mp4', 'video/webm' => 'webm'][$mime] ?? null;
    if (!$ext) zt_json_fail(415, 'Only PNG, JPG, GIF, MP4 or WebM posters can be posted.');
    if (str_starts_with($mime, 'image/')) {   // must be a whole, sensible image
        $info = @getimagesize($f['tmp_name']);
        if (!$info || ($info['mime'] ?? '') !== $mime || $info[0] < 200 || $info[1] < 200 || $info[0] > 4096 || $info[1] > 4096) zt_json_fail(415, 'That image looks damaged or the wrong size. Make it again and retry.');
    } else {                                  // a WebM document type, or an MP4 brand we know
        $box = (string)file_get_contents($f['tmp_name'], false, null, 0, 4096);
        $ok = $mime === 'video/webm' ? (strpos($box, "webm") !== false) : in_array(substr($head, 8, 4), ['isom', 'iso2', 'iso4', 'iso5', 'iso6', 'mp41', 'mp42', 'avc1', 'M4V ', 'dash'], true);
        if (!$ok) zt_json_fail(415, 'That video file isn\'t a normal MP4 or WebM. Make it again and retry.');
    }
    $base = preg_replace('/[^a-z0-9._-]/i', '', pathinfo((string)$f['name'], PATHINFO_FILENAME)) ?: 'tr-poster';
    return [$f['tmp_name'], $mime, substr($base, 0, 60) . '.' . $ext];
}

function zt_json_fail(int $code, string $message, string $error = 'failed'): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    exit(json_encode(['ok' => false, 'error' => $error, 'message' => $message]));
}

/* Facebook Page token: the server session (a file in the private folder) holds only the encrypted token;
   the 32-byte key lives only in an httponly cookie on the admin's browser (it is not the token and can't be read by page scripts).
   Neither half alone gives the token. Logout, disconnect and the 3-hour expiry drop both. */
const ZT_FB_COOKIE = 'zt_fbk';
function zt_fb_cookie(string $value, int $expires): void {
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    setcookie(ZT_FB_COOKIE, $value, ['expires' => $expires, 'path' => '/posters/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Lax']);
}
function zt_fb_store(string $pageId, string $pageName, string $token, int $ttl): void {
    $key = random_bytes(32); $iv = random_bytes(12); $tag = '';
    $ct = openssl_encrypt($token, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    if ($ct === false) throw new RuntimeException('encryption unavailable');
    $_SESSION['fb'] = ['page_id' => $pageId, 'page' => $pageName, 'ct' => base64_encode($iv . $tag . $ct), 'exp' => zt_now() + $ttl];
    zt_fb_cookie(rtrim(strtr(base64_encode($key), '+/', '-_'), '='), zt_now() + $ttl);
    zt_wipe($key);
}
function zt_wipe(string &$s): void { if (function_exists('sodium_memzero')) sodium_memzero($s); else $s = str_repeat("\0", strlen($s)); }
function zt_fb_connected(): bool { $fb = $_SESSION['fb'] ?? null; return $fb && ($fb['exp'] ?? 0) > zt_now() && !empty($fb['ct']) && !empty($_COOKIE[ZT_FB_COOKIE]); }
function zt_fb_token(): ?string {
    if (!zt_fb_connected()) return null;
    $key = base64_decode(strtr((string)$_COOKIE[ZT_FB_COOKIE], '-_', '+/'), true); $raw = base64_decode((string)$_SESSION['fb']['ct'], true);
    if ($key === false || strlen($key) !== 32 || $raw === false || strlen($raw) < 29) return null;
    $t = openssl_decrypt(substr($raw, 28), 'aes-256-gcm', $key, OPENSSL_RAW_DATA, substr($raw, 0, 12), substr($raw, 12, 16));
    return $t === false ? null : $t;
}
function zt_fb_forget(): void { unset($_SESSION['fb']); if (isset($_COOKIE[ZT_FB_COOKIE])) zt_fb_cookie('', time() - 3600); }

/* ---- posting operations: one record per "Confirm and post", so a retry or a second tab can't post twice ---- */
/* Returns the existing record for this op id or this exact content (same person, place, file and caption within 30 min), or null after reserving it. */
function zt_op_reserve(string $opId, string $hash, array $meta): ?array {
    return zt_update('posts', function (array &$d) use ($opId, $hash, $meta) {
        $now = zt_now();
        foreach ($d as $k => $r) if (($r['at'] ?? 0) < $now - 7 * 86400) unset($d[$k]);
        if (isset($d[$opId]) && ($d[$opId]['status'] ?? '') !== 'failed') return $d[$opId];   // a failed try may be retried with the same id
        foreach ($d as $r) if (($r['hash'] ?? '') === $hash && ($r['at'] ?? 0) > $now - 1800 && in_array($r['status'] ?? '', ['pending', 'done', 'unknown'], true)) return $r;
        $d[$opId] = $meta + ['hash' => $hash, 'status' => 'pending', 'at' => $now];
        return null;
    });
}
function zt_op_finish(string $opId, string $status, string $url = ''): void {
    zt_update('posts', function (array &$d) use ($opId, $status, $url) { if (isset($d[$opId])) { $d[$opId]['status'] = $status; $d[$opId]['url'] = $url; $d[$opId]['done_at'] = zt_now(); } });
}
/* the JSON answer for a repeat: done = same link back; pending/unknown = don't send again, go and check */
function zt_op_repeat(array $r, string $where): void {
    header('Content-Type: application/json; charset=utf-8');
    if (($r['status'] ?? '') === 'done') exit(json_encode(['ok' => true, 'repeat' => true, 'url' => $r['url'] ?? '']));
    http_response_code(409);
    exit(json_encode(['ok' => false, 'error' => 'in_flight', 'message' => 'This post was already sent' . (($r['status'] ?? '') === 'unknown' ? ', but we couldn\'t confirm it arrived' : ' and is still going through') . '. Check ' . $where . ' before posting again.']));
}
/* Ask for a fresh op id (client) per draft; validate it here */
function zt_op_id(): string {
    $id = (string)($_POST['op'] ?? '');
    if (!preg_match('/^[a-f0-9-]{16,40}$/', $id)) zt_json_fail(400, 'This page is out of date. Reload it and try again.', 'op');
    return $id;
}

/* Form POSTs from the app send csrf as a field (multipart) or in a JSON body. */
function zt_json_in(): array {
    $in = json_decode((string)file_get_contents('php://input'), true);
    return is_array($in) ? $in : [];
}
function zt_csrf_ok(?string $t): bool {
    zt_session();
    return is_string($t) && !empty($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $t);
}
