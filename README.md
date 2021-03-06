Clusterio Discord Bridge
========================

Bridges chat between a Discord channel and instances.

Installation
------------

Run the following commands in the folder Clusterio is installed to:

    npm install @hornwitser/discord_bridge
    npx clusteriomaster plugin add @hornwitser/discord_bridge

Substitute clusteriomaster with clusterioslave or clusterioctl if this a dedicate slave or ctl installation respectively.

Once installed you need to set the `discord_bridge.bot_token` and `discord_bridge.channel_id` in the master config to make the bridge operational.
