import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';

const PORT = 3001;

const app = express();
app.use(cors());
app.use(express.json());

const rooms = new Map();
const docs = new Map();

function getDoc(roomName) {
	if (!docs.has(roomName)) {
		docs.set(roomName, new Y.Doc());
	}
	return docs.get(roomName);
}

app.get('/api/status', (req, res) => {
	res.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		rooms: Array.from(rooms.keys()),
		totalUsers: Array.from(rooms.values()).reduce((sum, room) => sum + room.users, 0),
	});
});

app.get('/api/rooms/:roomId', (req, res) => {
	const { roomId } = req.params;
	const room = rooms.get(roomId);

	if (!room) {
		return res.json({
			roomId,
			exists: false,
			users: 0,
		});
	}

	res.json({
		roomId,
		exists: true,
		users: room.users,
		modules: room.modules || [],
	});
});

app.get('/api/modules', (req, res) => {
	res.json([
		{ id: 'dice-roller', name: 'Dice Roller', version: '1.0.0' },
		{ id: 'chat', name: 'Chat', version: '1.0.0' },
		{ id: 'grid-snap', name: 'Grid Snap', version: '1.0.0' },
	]);
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

const roomClients = new Map();

wss.on('connection', (ws, req) => {
	const roomName = req.url?.slice(1) || 'default';
	const doc = getDoc(roomName);

	console.log(`ws client connected to room: ${roomName}`);

	if (!rooms.has(roomName)) {
		rooms.set(roomName, { users: 0, modules: [], createdAt: new Date() });
	}
	rooms.get(roomName).users++;

	if (!roomClients.has(roomName)) {
		roomClients.set(roomName, new Set());
	}
	roomClients.get(roomName).add(ws);

	const stateUpdate = Y.encodeStateAsUpdate(doc);
	ws.send(stateUpdate);

	ws.on('message', (message) => {
		try {
			const update = new Uint8Array(message);
			Y.applyUpdate(doc, update);

			const clients = roomClients.get(roomName);
			if (clients) {
				clients.forEach((client) => {
					if (client !== ws && client.readyState === 1) {
						client.send(message);
					}
				});
			}
		} catch (error) {
			console.error(`Error processing message in room ${roomName}:`, error);
		}
	});

	ws.on('close', () => {
		console.log(`ws client disconnected from room: ${roomName}`);

		roomClients.get(roomName)?.delete(ws);

		const room = rooms.get(roomName);
		if (room) {
			room.users--;
			if (room.users <= 0) {
				setTimeout(
					() => {
						if (rooms.get(roomName)?.users === 0) {
							rooms.delete(roomName);
							docs.delete(roomName);
							roomClients.delete(roomName);
							console.log(`empty room ${roomName} deleted`);
						}
					},
					5 * 60 * 1000,
				);
			}
		}
	});

	ws.on('error', (error) => {
		console.error(`Error in room ${roomName}:`, error);
	});
});

server.listen(PORT, () => {
	console.log(`
		!HTTP API: http://localhost:${PORT} !
		!WebSocket: ws://localhost:${PORT} !
		`);
});
