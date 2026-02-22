/**
 * @fileoverview WebSocket service for pushing traffic alert updates to clients.
 * @module services/trafficSocketService
 */

import http from 'http';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { TrafficAlertRaw } from '../models/trafficAlert.js';
import { logger } from '../utils/logger.js';
import { getAlertKey, getLineKey } from '../utils/trafficAlertKey.js';

const MAX_FAVORITES = 50;
const HEARTBEAT_INTERVAL_MS = 30_000;

type AliveWebSocket = WebSocket & { isAlive: boolean };

const socketSubscriptions = new Map<WebSocket, Set<string>>();
const socketsByLine = new Map<string, Set<WebSocket>>();

let wss: WebSocketServer | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

const sendJson = (ws: WebSocket, payload: unknown): void => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
    }
};

const removeSocketFromLine = (ws: WebSocket, line: string): void => {
    const sockets = socketsByLine.get(line);
    if (!sockets) {
        return;
    }
    sockets.delete(ws);
    if (sockets.size === 0) {
        socketsByLine.delete(line);
    }
};

const clearSubscriptions = (ws: WebSocket): void => {
    const current = socketSubscriptions.get(ws);
    if (!current) {
        return;
    }
    for (const line of current) {
        removeSocketFromLine(ws, line);
    }
    socketSubscriptions.delete(ws);
};

const replaceSubscriptions = (ws: WebSocket, lines: string[]): void => {
    clearSubscriptions(ws);
    const next = new Set(lines);
    socketSubscriptions.set(ws, next);
    for (const line of next) {
        const sockets = socketsByLine.get(line);
        if (sockets) {
            sockets.add(ws);
        } else {
            socketsByLine.set(line, new Set([ws]));
        }
    }
};

const normalizeLines = (value: unknown): { lines: string[]; truncated: boolean } => {
    if (!Array.isArray(value)) {
        return { lines: [], truncated: false };
    }

    const normalized: string[] = [];
    const seen = new Set<string>();

    for (const item of value) {
        const line =
            typeof item === 'string'
                ? item.trim()
                : typeof item === 'number'
                  ? String(item)
                  : '';
        if (!line || seen.has(line)) {
            continue;
        }
        seen.add(line);
        normalized.push(line);
        if (normalized.length >= MAX_FAVORITES) {
            break;
        }
    }

    const truncated = normalized.length >= MAX_FAVORITES && value.length > MAX_FAVORITES;
    return { lines: normalized, truncated };
};

const handleMessage = (ws: WebSocket, raw: RawData): void => {
    let payload: unknown;
    try {
        payload = JSON.parse(raw.toString());
    } catch {
        sendJson(ws, { type: 'error', error: 'invalid_json' });
        return;
    }

    if (!payload || typeof payload !== 'object' || !('type' in payload)) {
        sendJson(ws, { type: 'error', error: 'invalid_message' });
        return;
    }

    const { type } = payload as { type: unknown };
    if (type === 'subscribe') {
        const rawLines = (payload as { lines?: unknown }).lines;
        if (!Array.isArray(rawLines)) {
            sendJson(ws, { type: 'error', error: 'invalid_lines' });
            return;
        }

        const { lines, truncated } = normalizeLines(rawLines);
        replaceSubscriptions(ws, lines);
        sendJson(ws, {
            type: 'subscribed',
            lines,
            maxFavorites: MAX_FAVORITES,
            truncated,
        });
        return;
    }

    if (type === 'ping') {
        sendJson(ws, { type: 'pong' });
        return;
    }

    sendJson(ws, { type: 'error', error: 'unknown_type' });
};

const startHeartbeat = (): void => {
    if (!wss || heartbeatInterval) {
        return;
    }

    heartbeatInterval = setInterval(() => {
        if (!wss) {
            return;
        }

        for (const client of wss.clients) {
            const socket = client as AliveWebSocket;
            if (!socket.isAlive) {
                clearSubscriptions(socket);
                socket.terminate();
                continue;
            }
            socket.isAlive = false;
            socket.ping();
        }
    }, HEARTBEAT_INTERVAL_MS);
};

export const initTrafficSocketServer = (server: http.Server): void => {
    if (wss) {
        return;
    }

    wss = new WebSocketServer({ server, path: '/traffic/alerts/ws' });
    wss.on('connection', (socket: WebSocket) => {
        const ws = socket as AliveWebSocket;
        ws.isAlive = true;
        sendJson(ws, { type: 'welcome', maxFavorites: MAX_FAVORITES });

        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', (data) => handleMessage(ws, data));
        ws.on('close', () => clearSubscriptions(ws));
        ws.on('error', () => clearSubscriptions(ws));
    });

    startHeartbeat();
    logger.info('🔌 WebSocket traffic alerts enabled at /traffic/alerts/ws');
};

export const stopTrafficSocketServer = (): void => {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    if (wss) {
        wss.close();
        wss = null;
    }
    socketSubscriptions.clear();
    socketsByLine.clear();
};

export const notifyNewTrafficAlerts = (alerts: TrafficAlertRaw[]): void => {
    if (!wss || alerts.length === 0) {
        return;
    }

    const timestamp = new Date().toISOString();

    for (const alert of alerts) {
        const lineKey = getLineKey(alert);
        if (!lineKey) {
            continue;
        }

        const sockets = socketsByLine.get(lineKey);
        if (!sockets || sockets.size === 0) {
            continue;
        }

        const payload = {
            type: 'alert',
            line: lineKey,
            key: getAlertKey(alert),
            timestamp,
            alert,
        };

        const message = JSON.stringify(payload);
        for (const socket of sockets) {
            if (socket.readyState !== WebSocket.OPEN) {
                continue;
            }
            try {
                socket.send(message);
            } catch {
                // Ignore send failures, cleanup will happen on close/error
            }
        }
    }
};
