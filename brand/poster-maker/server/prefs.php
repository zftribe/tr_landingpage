<?php
/* Team-wide template list: admins hide or restore templates for everyone. JSON in, JSON out. */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$u = zt_user();
if (!$u) { http_response_code(401); exit('{"error":"signed_out"}'); }

if ($_SERVER['REQUEST_METHOD'] === 'GET') { echo json_encode(['hidden' => zt_hidden_templates()]); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit('{"error":"method"}'); }

$in = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($in) || !is_string($in['csrf'] ?? null) || empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $in['csrf'])) { http_response_code(400); exit('{"error":"csrf"}'); }

// any signed-in user: remember that they finished or skipped the first-time tour
if (($in['act'] ?? '') === 'tour_done') {
    $key = zt_user_key($u);
    zt_update('tour', function (array &$d) use ($key) { $d[$key] = gmdate('c'); });
    exit('{"ok":true}');
}
// any signed-in user: ask for a new on-brand photo for a show (George/Claude/Codex pick these up from the Access page)
if (($in['act'] ?? '') === 'photo_request') {
    $tpl = (string)($in['tpl'] ?? ''); $note = trim(mb_substr((string)($in['note'] ?? ''), 0, 300));
    if (!preg_match('/^[a-z0-9-]{2,40}$/', $tpl)) { http_response_code(400); exit('{"error":"bad_request"}'); }
    if (!zt_rate('photoreq:' . zt_user_key($u), 10, 86400)) { http_response_code(429); exit('{"error":"slow"}'); }
    zt_update('photo_requests', function (array &$d) use ($tpl, $note, $u) { $d[] = ['at' => gmdate('c'), 'by' => (string)($u['name'] ?? $u['email'] ?? ''), 'tpl' => $tpl, 'note' => $note, 'done' => false]; if (count($d) > 200) $d = array_slice($d, -200); });
    zt_log('photo_request', ['template' => $tpl, 'by' => $u['name'] ?? '']);
    exit('{"ok":true}');
}
if (!zt_is_admin($u)) { http_response_code(403); exit('{"error":"admins_only"}'); }
$id = (string)($in['id'] ?? '');
$act = (string)($in['act'] ?? '');
if (!preg_match('/^[a-z0-9-]{2,40}$/', $id) || !in_array($act, ['hide', 'restore'], true)) { http_response_code(400); exit('{"error":"bad_request"}'); }

zt_update('templates', function (array &$d) use ($id, $act, $u) {
    $h = array_values(array_filter($d['hidden'] ?? [], fn($x) => $x !== $id));
    if ($act === 'hide') $h[] = $id;
    $d['hidden'] = $h; $d['by'] = $u['name'] ?? ''; $d['at'] = gmdate('c');
});
zt_log('template_' . $act, ['template' => $id, 'by' => $u['name'] ?? '']);
echo json_encode(['ok' => true, 'hidden' => zt_hidden_templates()]);
