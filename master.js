const events = require("events");
const Discord = require("discord.js");

const plugin = require("lib/plugin");



function unexpectedError(err) {
	console.log("Unexpected error in discord_bridge")
	console.log("----------------------------------")
	console.log(err);
}

class MasterPlugin extends plugin.BaseMasterPlugin {
	async init() {
		this.client = new Discord.Client();
		this.client.on("message", (message) => { this.discordMessage(message).catch(unexpectedError) });

		console.log("Discord Bridge | Logging in to Discord");
		await this.client.login(this.master.config.get("discord_bridge.bot_token"));
		await events.once(this.client, "ready");
		console.log("Discord Bridge | Logged in");

		this.channel = await this.client.channels.fetch(this.master.config.get("discord_bridge.channel_id"));
	}

	async onShutdown() {
		this.client.destroy();
	}

	async discordMessage(message) {
		if (message.author.bot) {
			return;
		}

		if (message.channel.id !== this.master.config.get("discord_bridge.channel_id")) {
			return;
		}

		let content = `[Discord] ${message.member.displayName}: ${message.cleanContent}`;
		for (let slaveConnection of this.master.slaveConnections.values()) {
			this.info.messages.discordChat.send(slaveConnection, { content });
		}
	}

	async instanceChatEventHandler(message) {
		let { instance_name, content } = message.data;
		await this.channel.send(`[${instance_name}] ${content}`, { disableMentions: "all" });
	}
}

module.exports = {
	MasterPlugin,
}
