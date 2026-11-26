<?php
/* Copy this file to  <home>/zft-tools/config.php  (ONE LEVEL ABOVE public_html, never inside it)
   and fill in the values. Also create  <home>/zft-tools/data/  and  <home>/zft-tools/sessions/  (permissions 700). */
return [
    'base_url' => 'https://zeefreaks.io/posters',

    // Discord application (Discord Developer Portal > your app > OAuth2)
    // Redirect to add there: https://zeefreaks.io/posters/auth-discord.php
    'discord_client_id' => '',
    'discord_client_secret' => '',   // secret: only here, never in Git or chat

    'guild_id' => 'CHANGE_ME',          // Trading Republic by ZFT
    'allowed_role_ids' => ['CHANGE_ME'],  // "Guild Leaders" role (read from its role icon 8 Nov; confirm with Copy Role ID)
    'admin_discord_ids' => [],                      // George's Discord user ID: can manage invites and always gets in
    'admin_emails' => [],                           // George's email: same, for email sign-in

    // Email sign-in links are sent from this mailbox (any Hostinger mailbox works, e.g. noreply@your-domain;
    // then set mail_from and smtp_user to that address)
    'mail_from' => 'CHANGE_ME',
    'mail_from_name' => 'Trading Republic tools',
    'smtp_host' => 'smtp.hostinger.com',
    'smtp_port' => 465,
    'smtp_user' => 'CHANGE_ME',
    'smtp_pass' => '',               // secret: the mailbox password

    // Posting to Discord ("Confirm and post"): one webhook per channel the tool may post in.
    // Discord: channel > Edit Channel > Integrations > Webhooks > New Webhook (name it "TR Poster Maker") > Copy Webhook URL.
    // The URL is a secret: only here. Posts show as "<Guild Leader> via TR Poster Maker".
    'discord_webhooks' => [
        'upcoming-events' => '',
    ],
    'discord_allow_everyone' => false,   // true = "@everyone" in a caption really pings everyone
    // Discord events with the poster as cover: the TR Tools app's bot token (Developer Portal > TR Tools > Bot > Reset Token).
    // Invite the bot with "Create Events" + "Manage Events" only. Secret: only here.
    'discord_bot_token' => '',

    // Posting to the Trading Republic Facebook Page (admins only). developers.facebook.com > My Apps > Create App
    // (type Business), add "Facebook Login for Business", valid OAuth redirect: https://zeefreaks.io/posters/fb-login.php
    'fb_app_id' => '',
    'fb_app_secret' => '',           // secret
    'fb_page_id' => '',              // the TR Page's ID (Page > About > Page transparency, or Meta Business Suite > Settings)

    'session_hours' => 24,           // sign in again after this; a removed Guild Leader loses access within a day
    'link_minutes' => 15,
];
