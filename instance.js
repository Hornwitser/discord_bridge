"use strict";
const libPlugin = require("@clusterio/lib/plugin");
const libLuaTools = require("@clusterio/lib/lua_tools");


/**
 * Removes gps and train tags from messags
 */
function removeTags(content) {
	return content.replace(/(\[gps=-?\d+,-?\d+\]|\[train=\d+\])/g, "");
}

class InstancePlugin extends libPlugin.BaseInstancePlugin {
	async init() {
		this.messageQueue = [];
	}

	onMasterConnectionEvent(event) {
		if (event === "connect") {
			for (let message of this.messageQueue) {
				this.sendChat(message);
			}
			this.messageQueue = [];
		}
	}

	async discordChatEventHandler(message) {
		let text = libLuaTools.escapeString(message.data.content);
		await this.instance.server.sendRcon(`/sc game.print('${text}')`, true);
	}

	sendChat(message) {
		this.info.messages.instanceChat.send(this.instance, {
			instance_name: this.instance.name,
			content: message,
		});
	}

	async onOutput(output) {
		if (output.type === "action" && output.action === "CHAT") {
			if (this.slave.connector.connected) {
				this.sendChat(output.message);
			} else {
				this.messageQueue.push(output.message);
			}
		}
	}
}

module.exports = {
	InstancePlugin,
};
