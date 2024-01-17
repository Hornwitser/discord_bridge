"use strict";
const { libConfig, libLink } = require("@clusterio/lib");


class ControllerConfigGroup extends libConfig.PluginConfigGroup { }
ControllerConfigGroup.groupName = "discord_bridge";
ControllerConfigGroup.defaultAccess = ["controller", "control"];
ControllerConfigGroup.define({
	name: "bot_token",
	title: "Bot Token",
	description: "Bot token to log into Discord with.",
	type: "string",
	optional: true,
});
ControllerConfigGroup.define({
	name: "channel_id",
	title: "Channel ID",
	description: "Channel ID to bridge chat to.",
	type: "string",
	optional: true,
});
ControllerConfigGroup.define({
	name: "bridge_player_shouts",
	title: "Bridge Player Shouts",
	description: "Bridge shouts made with /shout to the Discord channel.",
	type: "boolean",
	initial_value: true,
});
ControllerConfigGroup.define({
	name: "bridge_player_chat",
	title: "Bridge Player Chat",
	description: "Bridge player chat to the Discord channel.",
	type: "boolean",
	initial_value: true,
});
ControllerConfigGroup.define({
	name: "bridge_player_commands",
	title: "Bridge Player Commands",
	description: "Bridge /command lua commands players execute to the Discord channel.",
	type: "boolean",
	initial_value: false,
});
ControllerConfigGroup.define({
	name: "bridge_player_joins",
	title: "Bridge Player Joins",
	description: "Bridge join and leave notifications to the Discord channel.",
	type: "boolean",
	initial_value: true,
});
ControllerConfigGroup.define({
	name: "bridge_player_kicks_and_bans",
	title: "Bridge Player Kicks and Bans",
	description: "Bridge kick and ban messages to the Discord channel.",
	type: "boolean",
	initial_value: true,
});
ControllerConfigGroup.define({
	name: "bridge_player_promotions",
	title: "Bridge Player Promotions",
	description: "Bridge admin promotion messages to the Discord channel.",
	type: "boolean",
	initial_value: false,
});
ControllerConfigGroup.define({
	name: "notify_instance_starts",
	title: "Notify Instance Starts",
	description: "Notify of instance starts and stops to the Discord channel.",
	type: "boolean",
	initial_value: true,
});
ControllerConfigGroup.define({
	name: "notify_host_connections",
	title: "Notify Host Connections",
	description: "Notify of host connecting and disconnecting to the Discord channel.",
	type: "boolean",
	initial_value: true,
});
ControllerConfigGroup.finalize();

module.exports = {
	name: "discord_bridge",
	title: "Discord Bridge",
	description: "Bridges chat between instances and Discord.",
	instanceEntrypoint: "instance",
	controllerEntrypoint: "controller",
	ControllerConfigGroup,

	messages: {
		instanceAction: new libLink.Event({
			type: "discord_bridge:instance_action",
			links: ["instance-host", "host-controller"],
			forwardTo: "controller",
			eventProperties: {
				"instance_name": { type: "string" },
				"action": { type: "string" },
				"content": { type: "string" },
			},
		}),
		discordChat: new libLink.Event({
			type: "discord_bridge:discord_chat",
			links: ["controller-host", "host-instance"],
			broadcastTo: "instance",
			eventProperties: {
				"content": { type: "string" },
			},
		}),
	},
};
