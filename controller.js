"use strict";
const Discord = require("discord.js");
const { BaseControllerPlugin } = require("@clusterio/controller");

const { InstanceActionEvent, DiscordChatEvent } = require("./info.js");


class ControllerPlugin extends BaseControllerPlugin {
	async init() {
		this.controller.config.on("fieldChanged", (field, curr, prev) => {
			if (field === "discord_bridge.bot_token") {
				this.connect().catch(err => { this.logger.error(`Unexpected error:\n${err.stack}`); });
			} else if (field === "discord_bridge.channel_id") {
				this.fetchChannel().catch(err => { this.logger.error(`Unexpected error:\n${err.stack}`); });
			}
		});

		this.controller.handle(InstanceActionEvent, this.handleInstanceAction.bind(this));
		this.client = null;
		await this.connect();
	}

	async connect() {
		if (this.client) {
			this.client.destroy();
			this.client = null;
		}
		this.channel = null;

		let token = this.controller.config.get("discord_bridge.bot_token");
		if (!token) {
			this.logger.warn("Bot token not configured, bridge is offline");
			return;
		}

		this.client = new Discord.Client({
			intents: [
				Discord.GatewayIntentBits.Guilds,
				Discord.GatewayIntentBits.GuildMessages,
				Discord.GatewayIntentBits.MessageContent,
			],
		});
		this.client.on("messageCreate", (message) => {
			this.discordMessage(message).catch(err => { this.logger.error(`Unexpected error:\n${err.stack}`); });
		});

		this.logger.info("Logging in to Discord");
		try {
			await this.client.login(this.controller.config.get("discord_bridge.bot_token"));
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

		let id = this.controller.config.get("discord_bridge.channel_id");
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
			this.client = null;
			this.channel = null;
		}
	}

	/**
	 * @param message {Discord.Message}
	 */
	async discordMessage(message) {
		if (message.author.bot) {
			return;
		}

		if (!this.channel || message.channel.id !== this.channel.id) {
			return;
		}

		const template = this.controller.config.get("discord_bridge.discord_template");
		const content = template.replace(/(__display_name__|__username__|__content__)/g, (sub) => ({
			"__display_name__": message.member.displayName,
			"__username__": message.member.user.tag,
			"__content__": message.cleanContent,
		}[sub]));
		this.controller.sendTo("allInstances", new DiscordChatEvent(content));
	}

	formatMessage(template, hostName, instanceName, content) {
		return template.replace(/(__host_name__|__instance_name__|__content__)/g, (sub) => ({
			"__host_name__": hostName,
			"__instance_name__": instanceName,
			"__content__": content,
		}[sub]));
	}

	getHostName(hostId) {
		return this.controller.hosts.get(hostId)?.name ?? "";
	}

	async onInstanceStatusChanged(instance, prev) {
		if (!this.channel || !this.controller.config.get("discord_bridge.notify_instance_status")) {
			return;
		}

		let instanceName = instance.config.get("instance.name");
		const hostName = this.getHostName(instance.config.get("instance.assigned_host"));

		const template =
			this.controller.config.get("discord_bridge.instance_status_templates")[`${prev}:${instance.status}`]
			?? this.controller.config.get("discord_bridge.instance_status_templates")[instance.status]
		;

		if (!template) {
			return;
		}

		await this.channel.send(this.formatMessage(template, hostName, instanceName, ""));
	}

	onHostConnectionEvent(hostConnection, event) {
		if (!this.channel || !this.controller.config.get("discord_bridge.notify_host_connections")) {
			return;
		}

		let hostName = this.controller.hosts.get(hostConnection.id).name;
		const template = this.controller.config.get("discord_bridge.host_templates")[event];
		if (!template) {
			return;
		}
		const message = this.formatMessage(template, hostName, "", "");
		this.channel.send(message).catch(
			err => { this.logger.error(`Unexpected error:\n${err.stack}`); }
		);
	}

	async handleInstanceAction(request, src) {
		if (!this.channel) {
			return;
		}

		// Known action types at the time of writing:
		// WARNING COMMAND SHOUT CHAT COLOR JOIN LEAVE KICK BAN UNBANNED PROMOTE DEMOTE
		let { instanceName, action, content } = request;
		if (
			["JOIN", "LEAVE"].includes(action) && this.controller.config.get("discord_bridge.bridge_player_joins")
			|| action === "CHAT" && this.controller.config.get("discord_bridge.bridge_player_chat")
			|| action === "SHOUT" && this.controller.config.get("discord_bridge.bridge_player_shouts")
			|| (
				["KICK", "BAN", "UNBANNED"].includes(action)
				&& this.controller.config.get("discord_bridge.bridge_player_kicks_and_bans")
			)
			|| action === "COMMAND" && this.controller.config.get("discord_bridge.bridge_player_commands")
			|| (
				["PROMOTE", "DEMOTE"].includes(action)
				&& this.controller.config.get("discord_bridge.bridge_player_promotions")
			)
		) {
			const template = this.controller.config.get("discord_bridge.player_templates")[action];
			if (!template) {
				return;
			}
			const instance = this.controller.instances.get(src.id);
			const hostName = this.getHostName(instance.config.get("instance.assigned_host"));
			const message = this.formatMessage(template, hostName, instanceName, content);
			await this.channel.send(message, { allowedMentions: { parse: [] }});
		}
	}
}

module.exports = {
	ControllerPlugin,
};
