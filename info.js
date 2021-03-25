"use strict";
let link = require("@clusterio/lib/link");
let config = require("@clusterio/lib/config");


class MasterConfigGroup extends config.PluginConfigGroup { }
MasterConfigGroup.groupName = "discord_bridge";
MasterConfigGroup.defaultAccess = ["master", "control"];
MasterConfigGroup.define({
	name: "bot_token",
	title: "Bot Token",
	description: "Bot token to log into Discord with.",
	type: "string",
	optional: true,
});
MasterConfigGroup.define({
	name: "channel_id",
	title: "Channel ID",
	description: "Channel ID to bridge chat to.",
	type: "string",
	optional: true,
});
MasterConfigGroup.define({
	name: "bridge_player_shouts",
	title: "Bridge Player Shouts",
	description: "Bridge shouts made with /shout to the Discord channel.",
	type: "boolean",
	initial_value: true,
});
MasterConfigGroup.define({
	name: "bridge_player_chat",
	title: "Bridge Player Chat",
	description: "Bridge player chat to the Discord channel.",
	type: "boolean",
	initial_value: true,
});
MasterConfigGroup.define({
	name: "bridge_player_commands",
	title: "Bridge Player Commands",
	description: "Bridge /command lua commands players execute to the Discord channel.",
	type: "boolean",
	initial_value: false,
});
MasterConfigGroup.define({
	name: "bridge_player_joins",
	title: "Bridge Player Joins",
	description: "Bridge join and leave notifications to the Discord channel.",
	type: "boolean",
	initial_value: true,
});
MasterConfigGroup.define({
	name: "bridge_player_kicks_and_bans",
	title: "Bridge Player Kicks and Bans",
	description: "Bridge kick and ban messages to the Discord channel.",
	type: "boolean",
	initial_value: true,
});
MasterConfigGroup.define({
	name: "bridge_player_promotions",
	title: "Bridge Player Promotions",
	description: "Bridge admin promotion messages to the Discord channel.",
	type: "boolean",
	initial_value: false,
});
MasterConfigGroup.finalize();

module.exports = {
	name: "discord_bridge",
	title: "Discord Bridge",
	description: "Bridges chat between instances and Discord.",
	instanceEntrypoint: "instance",
	masterEntrypoint: "master",
	MasterConfigGroup,

	messages: {
		instanceAction: new link.Event({
			type: "discord_bridge:instance_action",
			links: ["instance-slave", "slave-master"],
			forwardTo: "master",
			eventProperties: {
				"instance_name": { type: "string" },
				"action": { type: "string" },
				"content": { type: "string" },
			},
		}),
		discordChat: new link.Event({
			type: "discord_bridge:discord_chat",
			links: ["master-slave", "slave-instance"],
			broadcastTo: "instance",
			eventProperties: {
				"content": { type: "string" },
			},
		}),
	},
};
