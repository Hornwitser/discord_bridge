"use strict";
const lib = require("@clusterio/lib");

class InstanceActionEvent {
	static type = "event";
	static src = "instance";
	static dst = "controller";
	static plugin = "discord_bridge";

	constructor(instanceName, action, content) {
		this.instanceName = instanceName;
		this.action = action;
		this.content = content;
	}

	static jsonSchema = {
		type: "object",
		required: ["instanceName", "action", "content"],
		properties: {
			"instanceName": { type: "string" },
			"action": { type: "string" },
			"content": { type: "string" },
		},
	};

	static fromJSON(json) {
		return new this(json.instanceName, json.action, json.content);
	}
}

class DiscordChatEvent {
	static type = "event";
	static src = "controller";
	static dst = "instance";
	static plugin = "discord_bridge";

	constructor(content) {
		this.content = content;
	}

	static jsonSchema = {
		type: "object",
		required: ["content"],
		properties: {
			"content": { type: "string" },
		},
	};

	static fromJSON(json) {
		return new this(json.content);
	}
}

const plugin = {
	name: "discord_bridge",
	title: "Discord Bridge",
	description: "Bridges chat between instances and Discord.",
	instanceEntrypoint: "instance",
	controllerEntrypoint: "controller",
	controllerConfigFields: {
		"discord_bridge.bot_token": {
			title: "Bot Token",
			description: "Bot token to log into Discord with.",
			type: "string",
			optional: true,
		},
		"discord_bridge.channel_id": {
			title: "Channel ID",
			description: "Channel ID to bridge chat to.",
			type: "string",
			optional: true,
		},
		"discord_bridge.discord_template": {
			title: "Discord template",
			description:
				"Template to use for sending chat messages from Discord in game. In the template the string " +
				"__display_name__ is replaced with the display name of the user sending the message, " +
				"__username__ is replaced with the username and __content__ with the message content.",
			type: "string",
			initialValue: "[Discord] __display_name__: __content__",
		},
		"discord_bridge.bridge_player_shouts": {
			title: "Bridge Player Shouts",
			description: "Bridge shouts made with /shout to the Discord channel.",
			type: "boolean",
			initialValue: true,
		},
		"discord_bridge.bridge_player_chat": {
			title: "Bridge Player Chat",
			description: "Bridge player chat to the Discord channel.",
			type: "boolean",
			initialValue: true,
		},
		"discord_bridge.bridge_player_commands": {
			title: "Bridge Player Commands",
			description: "Bridge /command lua commands players execute to the Discord channel.",
			type: "boolean",
			initialValue: false,
		},
		"discord_bridge.bridge_player_joins": {
			title: "Bridge Player Joins",
			description: "Bridge join and leave notifications to the Discord channel.",
			type: "boolean",
			initialValue: true,
		},
		"discord_bridge.bridge_player_kicks_and_bans": {
			title: "Bridge Player Kicks and Bans",
			description: "Bridge kick and ban messages to the Discord channel.",
			type: "boolean",
			initialValue: true,
		},
		"discord_bridge.bridge_player_promotions": {
			title: "Bridge Player Promotions",
			description: "Bridge admin promotion messages to the Discord channel.",
			type: "boolean",
			initialValue: false,
		},
		"discord_bridge.player_templates": {
			title: "Player templates",
			description:
				"Template to use for sending bridged player action messages from Factorio. In the template the " +
				"string __instance_name__ is replaced with the name of the instance the message originated from " +
				"and __content__ is replaced with the content of the message. The available actions that can be " +
				"bridged are COMMAND SHOUT CHAT JOIN LEAVE KICK BAN UNBANNED PROMOTE DEMOTE.",
			type: "object",
			initialValue: {
				"COMMAND": "[__instance_name__] __content__",
				"SHOUT": "[__instance_name__] __content__",
				"CHAT": "[__instance_name__] __content__",
				"JOIN": "[__instance_name__] __content__",
				"LEAVE": "[__instance_name__] __content__",
				"KICK": "[__instance_name__] __content__",
				"BAN": "[__instance_name__] __content__",
				"UNBANNED": "[__instance_name__] __content__",
				"PROMOTE": "[__instance_name__] __content__",
				"DEMOTE": "[__instance_name__] __content__",
			},
		},
		"discord_bridge.notify_instance_status": {
			title: "Notify Instance Status",
			description: "Notify of instance status changes to the Discord channel.",
			type: "boolean",
			initialValue: true,
		},
		"discord_bridge.instance_status_templates": {
			title: "Instance Status Templates",
			description:
				"Template to use for sending notifications about instance status changes. In the template the " +
				"string __instance_name__ and __host_name__ are replaced with the instance and host the change " +
				"occured on. Templates specify previous:current status and the possible instance statuses are " +
				"undefined unknown stopped starting running stopping creating_save exporting_data deleted",
			type: "object",
			initialValue: {
				"starting:running": "[__instance_name__] started",
				"starting:stopped": "[__instance_name__] failed to start",
				"running:stopped": "[__instance_name__] abruptly stopped",
				"stopping:stopped": "[__instance_name__] stopped",
				"undefined:unassigned": "[__instance_name__] was created",
				"deleted": "[__instance_name__] was deleted",
			},
		},
		"discord_bridge.notify_host_connections": {
			title: "Notify Host Connections",
			description: "Notify of host connecting and disconnecting to the Discord channel.",
			type: "boolean",
			initialValue: true,
		},
		"discord_bridge.host_templates": {
			title: "Host templates",
			description:
				"Template to use for sending notifications about host connection events. In the template the " +
				"string __host_name__ is replaced with the name of the host the connection event occured from. " +
				"The possible events that can happen are connect drop resume close.",
			type: "object",
			initialValue: {
				"connect": "[__host_name__] connected",
				"drop": "",
				"resume": "",
				"close": "[__host_name__] disconnected",
			},
		},
	},

	messages: [
		InstanceActionEvent,
		DiscordChatEvent,
	],
};

module.exports = {
	plugin,
	InstanceActionEvent,
	DiscordChatEvent,
};
