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
		"discord_bridge.notify_instance_starts": {
			title: "Notify Instance Starts",
			description: "Notify of instance starts and stops to the Discord channel.",
			type: "boolean",
			initialValue: true,
		},
		"discord_bridge.notify_host_connections": {
			title: "Notify Host Connections",
			description: "Notify of host connecting and disconnecting to the Discord channel.",
			type: "boolean",
			initialValue: true,
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
