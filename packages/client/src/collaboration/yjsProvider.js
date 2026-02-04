import * as Y from 'yjs';

export const doc = new Y.Doc();
export const elementsMap = doc.getMap('elements');

let ws = null;
let isConnected = false;
let updateHandler = null;

export function connectToRoom(roomName, serverUrl = import.meta.env.VITE_WS_SERVER || 'ws://localhost:3001') {
	if (ws) {
		ws.close();
	}

	if (updateHandler) {
		doc.off('update', updateHandler);
	}

	ws = new WebSocket(`${serverUrl}/${roomName}`);
	ws.binaryType = 'arraybuffer';

	ws.onopen = () => {
		console.log(`WS ${roomName} Connected`);
		isConnected = true;
	};

	ws.onmessage = (event) => {
		try {
			const update = new Uint8Array(event.data);
			if (update.length > 0) {
				Y.applyUpdate(doc, update, 'remote');
			}
		} catch (error) {
			console.error(`WS ${roomName} Error processing message: ${error}`);
		}
	};

	ws.onclose = () => {
		console.log(`WS ${roomName} Disconnected`);
		isConnected = false;
	};

	ws.onerror = (error) => {
		console.error(`WS ${roomName} Error: ${error}`);
	};

	const updateHandler = (update, origin) => {
		if (origin !== 'remote' && ws && ws.readyState === WebSocket.OPEN) {
			ws.send(update);
		}
	};

	doc.on('update', updateHandler);

	return ws;
}

export function disconnect() {
	if (updateHandler) {
		doc.off('update', updateHandler);
		updateHandler = null;
	}
	if (ws) {
		ws.close();
		ws = null;
	}
}

export function isConnectedToRoom() {
	return isConnected;
}
