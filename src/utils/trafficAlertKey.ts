/**
 * @fileoverview Helpers to extract stable identifiers from traffic alerts.
 * @module utils/trafficAlertKey
 */

import { TrafficAlertRaw } from '../models/trafficAlert.js';

const normalizeField = (value: unknown): string | null => {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    return null;
};

export const getLineKey = (alert: TrafficAlertRaw): string | null => {
    const candidates: unknown[] = [
        alert.ligne_cli,
        alert.ligne,
        alert.ligne_id,
        alert.ligne_code,
        alert.line,
        alert.line_id,
        alert.line_code,
    ];

    for (const candidate of candidates) {
        const normalized = normalizeField(candidate);
        if (normalized) {
            return normalized;
        }
    }

    return null;
};

export const getAlertKey = (alert: TrafficAlertRaw): string => {
    const keyPayload = {
        message: normalizeField(alert.message),
        titre: normalizeField(alert.titre),
        line: getLineKey(alert),
        cause: normalizeField(alert.cause),
        type: normalizeField(alert.type),
        mode: normalizeField(alert.mode),
    };

    return JSON.stringify(keyPayload);
};
