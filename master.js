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
			await events.once(this.client, "ready");
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

	async instanceChatEventHandler(message) {
		if (!this.channel) {
			return;
		}

		let { instance_name, content } = message.data;
		await this.channel.send(`[${instance_name}] ${content}`, { disableMentions: "all" });
	}
}

module.exports = {
	MasterPlugin,
};
