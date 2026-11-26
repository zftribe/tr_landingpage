<?php
/* Discord helpers shared by scheduled posts (cron.php) and events (event.php). */
declare(strict_types=1);

/* channel name => webhook URL, only well-formed Discord webhooks (the base is overridable only for local tests) */
function zt_webhooks(): array {
    $cfg = zt_config();
    $prefix = (string)($cfg['discord_webhook_base'] ?? 'https://discord.com/api/webhooks/');
    return is_array($cfg['discord_webhooks'] ?? null) ? array_filter($cfg['discord_webhooks'], fn($v) => is_string($v) && str_starts_with($v, $prefix) && preg_match('#/\d+/[\w-]+$#', $v)) : [];
}
function zt_poster_name(string $name): string {
    return trim(mb_substr(preg_replace('/discord|clyde|[@#:`]/i', '', $name), 0, 50)) . ' via TR Poster Maker';
}
/* post a file + caption to one channel webhook; returns [http code, response, message url] */
function zt_webhook_post(string $channel, string $caption, string $path, string $mime, string $fname, string $byName): array {
    $cfg = zt_config(); $hooks = zt_webhooks();
    if (!isset($hooks[$channel])) return [0, [], ''];
    $payload = ['content' => $caption, 'username' => zt_poster_name($byName),
        'allowed_mentions' => ['parse' => !empty($cfg['discord_allow_everyone']) ? ['everyone'] : []],
        'attachments' => [['id' => 0, 'filename' => $fname]]];
    [$code, $res] = zt_http('POST', $hooks[$channel] . '?wait=true', [], [
        'payload_json' => json_encode($payload, JSON_UNESCAPED_UNICODE),
        'files[0]' => new CURLFile($path, $mime, $fname),
    ]);
    $url = !empty($res['id']) ? 'https://discord.com/channels/' . rawurlencode((string)$cfg['guild_id']) . '/' . rawurlencode((string)($res['channel_id'] ?? '')) . '/' . rawurlencode((string)$res['id']) : '';
    return [$code, $res, $url];
}
