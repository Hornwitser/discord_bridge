"use strict";
let link = require("@clusterio/lib/link");
let plugin = require("@clusterio/lib/plugin");
let config = require("@clusterio/lib/config");


class MasterConfigGroup extends config.PluginConfigGroup { }
MasterConfigGroup.groupName = "discord_bridge";
MasterConfigGroup.defaultAccess = ["master", "control"];
MasterConfigGroup.define({
	name: "bot_token",
	title: "Bot Token",
	description: "Bot token to log into discord with.",
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
MasterConfigGroup.finalize();

module.exports = {
	name: "discord_bridge",
	title: "Discord Bridge",
	description: "Bridges chat between instances and Discord.",
	instanceEntrypoint: "instance",
	masterEntrypoint: "master",
	MasterConfigGroup,

	messages: {
		instanceChat: new link.Event({
			type: "discord_bridge:instance_chat",
			links: ["instance-slave", "slave-master"],
			forwardTo: "master",
			eventProperties: {
				"instance_name": { type: "string" },
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
