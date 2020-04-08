const plugin = require("lib/plugin");
const luaTools = require("lib/luaTools");


/**
 * Removes gps and train tags from messags
 */
function removeTags(content) {
	return content.replace(/(\[gps=-?\d+,-?\d+\]|\[train=\d+\])/g, "");
}

class InstancePlugin extends plugin.BaseInstancePlugin {
	async discordChatEventHandler(message) {
		await this.instance.server.sendRcon(`/sc game.print('${luaTools.escapeString(message.data.content)}')`, true);
	}

	async onOutput(output) {
		if (output.type === "action" && output.action === "CHAT") {
			this.info.messages.instanceChat.send(this.instance, {
				instance_name: this.instance.name,
				content: output.message,
			});
		}
	}
}

module.exports = {
	InstancePlugin,
}
