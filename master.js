"use strict";
const events = require("events");
const Discord = require("discord.js");

const plugin = require("@clusterio/lib/plugin");


class MasterPlugin extends plugin.BaseMasterPlugin {
	async init() {
		this.master.config.on("fieldChanged", (group, field, prev) => {
			if (group.name === "discord_bridge") {
				if (field === "bot_token") {
					this.connect().catch(err => { this.logger.error(`Unexpected error:\n${err.stack}`); });
				} else if (field === "channel_id") {
					this.fetchChannel().catch(err => { this.logger.error(`Unexpected error:\n${err.stack}`); });
				}
			}
		});

		this.client = null;
		await this.connect();
	}

	async connect() {
		if (this.client) {
			this.client.destroy();
			this.client = null;
		}
		this.channel = null;

		let token = this.master.config.get("discord_bridge.bot_token");
		if (!token) {
			this.logger.warn("Bot token not configured, bridge is offline");
			return;
		}

		this.client = new Discord.Client();
		this.client.on("message", (message) => {
			this.discordMessage(message).catch(err => { this.logger.error(`Unexpected error:\n${err.stack}`); });
		});

		this.logger.info("Logging in to Discord");
		try {
			await this.client.login(this.master.config.get("discord_bridge.bot_token"));
		} catch (err) {
			this.logger.error(`Error logging in to Discord, bridge is offline:\n${err.stack}`);
			this.client.destroy();
			this.client = null;
			return;
		}
		this.logger.info("Successfully logged in");
		await this.fetchChannel();
	}

	async fetchChannel() {
		this.channel = null;
		if (!this.client) {
			return;
		}

		let id = this.master.config.get("discord_bridge.channel_id");
		if (!id) {
			this.logger.warn("Channel ID not configured, bridge is offline");
			return
		}

		try {
			this.channel = await this.client.channels.fetch(id);
		} catch (err) {
			if (err.code !== 10003) { // Unknown channel
				throw err;
			}
		}
		if (this.channel === null) {
			this.logger.error(`Channel ID ${id} was not found`);
		}
	}

	async onShutdown() {
		if (this.client) {
			this.client.destroy();
		}
	}

	async discordMessage(message) {
		if (message.author.bot) {
			return;
		}

		if (!this.channel || message.channel.id !== this.channel.id) {
			return;
		}

		let content = `[Discord] ${message.member.displayName}: ${message.cleanContent}`;
		this.broadcastEventToSlaves(this.info.messages.discordChat, { content });
	}

	async onInstanceStatusChanged(instance, prev) {
		if (!this.channel || !this.master.config.get("discord_bridge.notify_instance_starts")) {
			return;
		}

		let instanceName = instance.config.get("instance.name");

		if (instance.status === "running" && prev === "starting") {
			await this.channel.send(`[${instanceName}] started`);
		}

		if (instance.status === "stopped" && prev === "starting") {
			await this.channel.send(`[${instanceName}] failed to start`);
		}

		if (instance.status === "stopped" && prev === "running") {
			await this.channel.send(`[${instanceName}] abruptly stopped`);
		}

		if (instance.status === "stopped" && prev === "stopping") {
			await this.channel.send(`[${instanceName}] stopped`);
		}
	}

	onSlaveConnectionEvent(slaveConnection, event) {
		if (!this.channel || !this.master.config.get("discord_bridge.notify_slave_connections")) {
			return;
		}

		let slaveName = this.master.slaves.get(slaveConnection.id).name;
		if (event === "connect") {
			this.channel.send(`${slaveName} connected`).catch(
				err => { this.logger.error(`Unexpected error:\n${err.stack}`); }
			);
		} else if (event === "close") {
			this.channel.send(`${slaveName} disconnected`).catch(
				err => { this.logger.error(`Unexpected error:\n${err.stack}`); }
			);
		}
	}

	async instanceActionEventHandler(message) {
		if (!this.channel) {
			return;
		}

		// Known action types at the time of writing:
		// WARNING COMMAND SHOUT CHAT COLOR JOIN LEAVE KICK BAN UNBANNED PROMOTE DEMOTE
		let { instance_name, action, content } = message.data;
		if (
			["JOIN", "LEAVE"].includes(action) && this.master.config.get("discord_bridge.bridge_player_joins")
			|| action === "CHAT" && this.master.config.get("discord_bridge.bridge_player_chat")
			|| action === "SHOUT" && this.master.config.get("discord_bridge.bridge_player_shouts")
			|| (
				["KICK", "BAN", "UNBANNED"].includes(action)
				&& this.master.config.get("discord_bridge.bridge_player_kicks_and_bans")
			)
			|| action === "COMMAND" && this.master.config.get("discord_bridge.bridge_player_commands")
			|| (
				["PROMOTE", "DEMOTE"].includes(action)
				&& this.master.config.get("discord_bridge.bridge_player_promotions")
			)
		) {
			await this.channel.send(`[${instance_name}] ${content}`, { disableMentions: "all" });
		}
	}
}

module.exports = {
	MasterPlugin,
};
