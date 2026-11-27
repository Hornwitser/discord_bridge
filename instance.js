import { escapeString } from "@clusterio/lib";
import { InstanceActionEvent, DiscordChatEvent } from "./index.js";

/**
 * Removes GPS and train tags from messages.
 */
function removeTags(content) {
	return content.replace(/(\[gps=-?\d+,-?\d+\]|\[train=\d+\])/g, "");
}

export default async function({ instance, host, plugin }) {
	let messageQueue = [];

	function sendChat(action, content) {
		instance.sendTo("controller", new InstanceActionEvent(instance.name, action, removeTags(content)));
	}

	instance.handle(DiscordChatEvent, async (event) => {
		const text = escapeString(event.content);
		await instance.sendRcon(`/sc game.print('${text}')`, true, plugin.name);
	});

	instance.hooks.controllerConnectionEvent.attach(plugin.name, (event) => {
		if (event === "connect" || event === "resume") {
			for (const [action, content] of messageQueue) {
				sendChat(action, content);
			}
			messageQueue = [];
		}
	});

	instance.hooks.output.attach(plugin.name, (output) => {
		if (output.type !== "action") {
			return;
		}

		if (host.connector.connected) {
			sendChat(output.action, output.message);
		} else {
			messageQueue.push([output.action, output.message]);
		}
	});
}
