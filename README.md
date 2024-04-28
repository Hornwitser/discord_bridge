Clusterio Discord Bridge
========================

Bridges chat between a Discord channel and instances.

Installation
------------

Run the following commands in the folder Clusterio is installed to:

    npm install @hornwitser/discord_bridge
    npx clusteriocontroller plugin add @hornwitser/discord_bridge

Substitute clusteriocontroller with clusteriohost or clusterioctl if this a dedicate host or ctl installation respectively.

Once installed you need to set the `discord_bridge.bot_token` and `discord_bridge.channel_id` in the controller config to make the bridge operational.

Note that the Message Content Intent is required to be enabled in Discords developer dashboard for the bot.
