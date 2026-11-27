<?php
/* "Confirm and post" to the Trading Republic Facebook Page (admins who connected Facebook in this session).
   Images go to /{page}/photos, videos to /{page}/videos. Published right away; logged. The Group can't be posted to by apps. */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/net.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') zt_json_fail(405, 'Method not allowed.', 'method');
$u = zt_user();
if (!$u) zt_json_fail(401, 'You were signed out. Nothing was posted. Reload and sign in again.', 'signed_out');
if (!zt_csrf_ok($_POST['csrf'] ?? null)) zt_json_fail(400, 'This page expired. Nothing was posted. Reload it and try again.', 'csrf');
if (!zt_is_admin($u)) zt_json_fail(403, 'Only admins can post to the TR Page.', 'admins_only');
$fb = $_SESSION['fb'] ?? null; $pageToken = zt_fb_token();
if (!$fb || $pageToken === null) { zt_fb_forget(); zt_json_fail(401, 'Your Facebook connection ended. Nothing was posted. Use "Sign in with Facebook" again.', 'fb_signed_out'); }
$caption = trim((string)($_POST['caption'] ?? ''));
if (mb_strlen($caption) > 5000) zt_json_fail(400, 'The caption is too long.', 'caption');
if (!zt_rate('post-fb:' . zt_user_key($u), 10, 3600)) zt_json_fail(429, 'That\'s 10 Page posts this hour. Nothing was posted. Try again later.', 'slow');

$op = zt_op_id();
[$tmp, $mime, $fname] = zt_upload_file(100 * 1048576);
if ($mime === 'image/gif') zt_json_fail(415, 'Facebook shows GIFs as still images. Attach the PNG or the video.', 'gif');
$hash = hash('sha256', zt_user_key($u) . '|fb|' . hash_file('sha256', $tmp) . '|' . $caption);
$prev = zt_op_reserve($op, $hash, ['to' => 'fb', 'where' => 'the TR Page', 'by' => (string)($u['name'] ?? ''), 'owner' => zt_user_key($u)]);
if ($prev) zt_op_repeat($prev, 'the TR Page');
$cfg = zt_config();
$graph = rtrim((string)($cfg['graph_api'] ?? 'https://graph.facebook.com/v21.0'), '/');
$video = str_starts_with($mime, 'video/');
$url = $graph . '/' . rawurlencode($fb['page_id']) . ($video ? '/videos' : '/photos');
$fields = ['access_token' => $pageToken, 'source' => new CURLFile($tmp, $mime, $fname), 'published' => 'true'];
$fields[$video ? 'description' : 'message'] = $caption;
[$code, $res] = zt_http('POST', $url, [], $fields);
if ($code !== 200 || (empty($res['id']) && empty($res['post_id']))) {
    zt_log('post_fb_fail', ['by' => $u['name'] ?? '', 'http' => $code, 'fb' => substr((string)($res['error']['message'] ?? ''), 0, 120)]);
    if ((int)($res['error']['code'] ?? 0) === 190) { zt_op_finish($op, 'failed'); zt_fb_forget(); zt_json_fail(401, 'Your Facebook connection expired. Nothing was posted. Sign in with Facebook again.', 'fb_signed_out'); }
    if ($code >= 400 && $code < 500) { zt_op_finish($op, 'failed'); zt_json_fail(502, 'Facebook didn\'t accept the post. Nothing was posted. Try again, or post it by hand.', 'facebook'); }
    zt_op_finish($op, 'unknown');
    zt_json_fail(504, 'We couldn\'t confirm whether Facebook posted it. Check the TR Page before trying again.', 'unknown');
}
$pid = (string)($res['post_id'] ?? $res['id']);
zt_op_finish($op, 'done', 'https://www.facebook.com/' . rawurlencode($pid));
zt_log('post_fb', ['by' => $u['name'] ?? '', 'kind' => $video ? 'video' : 'photo']);
echo json_encode(['ok' => true, 'url' => 'https://www.facebook.com/' . rawurlencode($pid)]);
