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

	onControllerConnectionEvent(event) {
		if (event === "connect") {
			for (let [action, content] of this.messageQueue) {
				this.sendChat(action, content);
			}
			this.messageQueue = [];
		}
	}

	async discordChatEventHandler(message) {
		let text = libLuaTools.escapeString(message.data.content);
		await this.instance.server.sendRcon(`/sc game.print('${text}')`, true);
	}

	sendChat(action, content) {
		this.info.messages.instanceAction.send(this.instance, {
			instance_name: this.instance.name,
			action,
			content,
		});
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
