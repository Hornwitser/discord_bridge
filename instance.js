"use strict";
const lib = require("@clusterio/lib");
const { BaseInstancePlugin } = require("@clusterio/host");

const { InstanceActionEvent, DiscordChatEvent } = require("./info.js");


/**
 * Removes gps and train tags from messags
 */
function removeTags(content) {
	return content.replace(/(\[gps=-?\d+,-?\d+\]|\[train=\d+\])/g, "");
}

class InstancePlugin extends BaseInstancePlugin {
	async init() {
		this.messageQueue = [];
		this.instance.handle(DiscordChatEvent, this.handleDiscordChatEvent.bind(this));
	}

	onControllerConnectionEvent(event) {
		if (event === "connect") {
			for (let [action, content] of this.messageQueue) {
				this.sendChat(action, content);
			}
			this.messageQueue = [];
		}
	}

	async handleDiscordChatEvent(event) {
		let text = lib.escapeString(event.content);
		await this.instance.server.sendRcon(`/sc game.print('${text}')`, true);
	}

	sendChat(action, content) {
		this.instance.sendTo("controller",
			new InstanceActionEvent(this.instance.name, action, content)
		);
	}

	async onOutput(output) {
		if (output.type !== "action") {
			return;
		}

		if (this.host.connector.connected) {
			this.sendChat(output.action, output.message);
		} else {
			this.messageQueue.push([output.action, output.message]);
		}
	}
}

module.exports = {
	InstancePlugin,
};
