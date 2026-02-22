/**
 * @fileoverview Service for fetching and caching TCL traffic alert data.
 * Handles communication with the GrandLyon API and data storage.
 * @module services/tclService
 */

import axios, { AxiosError } from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { CachedTrafficData, GrandLyonApiResponse, TrafficAlertRaw } from '../models/trafficAlert.js';
import { getAlertKey, getLineKey } from '../utils/trafficAlertKey.js';
import { notifyNewTrafficAlerts } from './trafficSocketService.js';

/**
 * Cached traffic data storage
 * Stores the latest data fetched from the API
 */
let cachedData: CachedTrafficData = {
    alerts: [],
    lastUpdated: null,
    count: 0,
};

/**
 * Interval reference for the scheduled data refresh
 */
let refreshInterval: NodeJS.Timeout | null = null;
let fakeAlertCounter = 0;

/**
 * Creates Basic Auth header from email and password
 * @returns Base64 encoded credentials string
 */
const getAuthHeader = (): string => {
    const credentials = `${config.traffic.email}:${config.traffic.password}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
};

/**
 * Removes duplicate alerts from the array
 * Uses key fields (message, titre, ligne_cli, cause, type) to identify duplicates
 * Ignores technical fields like 'n', 'debut', 'fin' which may vary for the same alert
 * @param alerts - Array of traffic alerts (may contain duplicates)
 * @returns Array of unique traffic alerts
 */
const deduplicateAlerts = (alerts: TrafficAlertRaw[]): TrafficAlertRaw[] => {
    const seen = new Set<string>();
    const uniqueAlerts: TrafficAlertRaw[] = [];

    for (const alert of alerts) {
        // Create a stable key based on fields that matter to users
        const key = getAlertKey(alert);
        
        if (!seen.has(key)) {
            seen.add(key);
            uniqueAlerts.push(alert);
        }
    }

    return uniqueAlerts;
};

const applyFakeTrafficAlert = (alerts: TrafficAlertRaw[]): TrafficAlertRaw[] => {
    if (process.env.TRAFFIC_FAKE_ALERT !== '1') {
        return alerts;
    }

    const line = (process.env.TRAFFIC_FAKE_LINE || 'A').trim() || 'A';
    fakeAlertCounter += 1;

    const fakeAlert: TrafficAlertRaw = {
        titre: 'Test alert (fake)',
        message: `Fake traffic alert #${fakeAlertCounter}`,
        ligne_cli: line,
        cause: 'test',
        type: 'test',
        mode: 'test',
        debut: new Date().toISOString(),
    };

    logger.warn(`⚠️  Injecting fake traffic alert for line ${line}`);
    return [...alerts, fakeAlert];
};

/**
 * Indexes alerts by line to speed up diffing between refreshes
 * @param alerts - Array of traffic alerts
 * @returns Map of line -> Set of alert keys
 */
const indexAlertsByLine = (alerts: TrafficAlertRaw[]): Map<string, Set<string>> => {
    const index = new Map<string, Set<string>>();

    for (const alert of alerts) {
        const lineKey = getLineKey(alert);
        if (!lineKey) {
            continue;
        }

        const alertKey = getAlertKey(alert);
        const existing = index.get(lineKey);
        if (existing) {
            existing.add(alertKey);
        } else {
            index.set(lineKey, new Set([alertKey]));
        }
    }

    return index;
};

/**
 * Detects new alerts compared to the previous index
 * @param alerts - Latest alerts
 * @param previousIndex - Map of line -> Set of alert keys from previous refresh
 * @returns Array of alerts that are new for their line
 */
const detectNewAlerts = (
    alerts: TrafficAlertRaw[],
    previousIndex: Map<string, Set<string>>
): TrafficAlertRaw[] => {
    const newAlerts: TrafficAlertRaw[] = [];

    for (const alert of alerts) {
        const lineKey = getLineKey(alert);
        if (!lineKey) {
            continue;
        }

        const alertKey = getAlertKey(alert);
        const previousKeys = previousIndex.get(lineKey);
        if (!previousKeys || !previousKeys.has(alertKey)) {
            newAlerts.push(alert);
        }
    }

    return newAlerts;
};

/**
 * Fetches traffic alert data from the GrandLyon API
 * @returns Promise resolving to array of traffic alerts
 * @throws Error if the API request fails
 */
export const fetchTrafficAlerts = async (): Promise<TrafficAlertRaw[]> => {
    logger.debug('🌐 Fetching traffic alerts from GrandLyon API...');

    try {
        const [mainResult, juniorResult] = await Promise.allSettled([
            axios.get<GrandLyonApiResponse>(config.traffic.baseUrl, {
                headers: {
                    Authorization: getAuthHeader(),
                    'Content-Type': 'application/json',
                },
                timeout: 30000, // 30 seconds timeout
            }),
            axios.get<GrandLyonApiResponse>(config.traffic.juniorDirectBaseUrl, {
                headers: {
                    Authorization: getAuthHeader(),
                    'Content-Type': 'application/json',
                },
                timeout: 30000, // 30 seconds timeout
            }),
        ]);

        if (mainResult.status === 'rejected') {
            throw mainResult.reason;
        }

        const mainAlerts = mainResult.value.data.values || [];
        const juniorAlerts =
            juniorResult.status === 'fulfilled' ? juniorResult.value.data.values || [] : [];

        if (juniorResult.status === 'rejected') {
            logger.warn('⚠️  Failed to fetch Junior Direct traffic alerts, serving main data only');
        }

        const allAlerts = [...mainAlerts, ...juniorAlerts];
        const alerts = applyFakeTrafficAlert(deduplicateAlerts(allAlerts));
        
        const duplicatesRemoved = allAlerts.length - alerts.length;
        if (duplicatesRemoved > 0) {
            logger.info(`🔄 Removed ${duplicatesRemoved} duplicate alert(s)`);
        }
        
        logger.info(
            `✅ Successfully fetched ${alerts.length} unique traffic alerts (${juniorAlerts.length} Junior Direct, ${duplicatesRemoved} duplicates removed)`
        );
        return alerts;
    } catch (error) {
        const axiosError = error as AxiosError;
        const errorMessage = axiosError.response
            ? `API responded with status ${axiosError.response.status}`
            : axiosError.message;

        logger.error(`❌ Failed to fetch traffic alerts: ${errorMessage}`, error as Error);
        throw new Error(`Failed to fetch traffic alerts: ${errorMessage}`);
    }
};

/**
 * Updates the cached data with fresh data from the API
 * @returns Promise resolving to the updated cached data
 */
export const updateCachedData = async (): Promise<CachedTrafficData> => {
    try {
        const previousAlerts = cachedData.alerts;
        const hadPrevious = previousAlerts.length > 0;
        const previousIndex = hadPrevious ? indexAlertsByLine(previousAlerts) : null;

        const alerts = await fetchTrafficAlerts();
        const now = new Date();
        cachedData = {
            alerts,
            lastUpdated: now,
            count: alerts.length,
        };
        logger.debug(`🔄 Cache updated with ${alerts.length} alerts at ${now.toLocaleString('en-US')}`);

        if (hadPrevious && previousIndex) {
            const newAlerts = detectNewAlerts(alerts, previousIndex);
            if (newAlerts.length > 0) {
                try {
                    notifyNewTrafficAlerts(newAlerts);
                } catch (error) {
                    logger.warn('⚠️  Failed to notify traffic alert subscribers');
                    logger.debug(`Notification error details: ${(error as Error).message}`);
                }
            }
        }

        return cachedData;
    } catch (error) {
        logger.error('❌ Failed to update cached data', error as Error);
        throw error;
    }
};

/**
 * Gets the current cached traffic data
 * If cache is empty, fetches fresh data first
 * @returns Promise resolving to the cached traffic data
 */
export const getCachedData = async (): Promise<CachedTrafficData> => {
    if (cachedData.alerts.length === 0 || cachedData.lastUpdated === null) {
        logger.info('💾 Cache is empty, fetching initial data...');
        await updateCachedData();
    }
    return cachedData;
};

/**
 * Gets the cached data without triggering a fetch
 * @returns The current cached data (may be empty)
 */
export const getCachedDataSync = (): CachedTrafficData => {
    return cachedData;
};

/**
 * Starts the scheduled data refresh interval
 * Fetches data immediately if cache is empty, then refreshes hourly
 */
export const startScheduledRefresh = async (): Promise<void> => {
    logger.info('⏰ Starting scheduled data refresh...');

    // Fetch immediately if cache is empty
    if (cachedData.alerts.length === 0 || cachedData.lastUpdated === null) {
        try {
            await updateCachedData();
        } catch (error) {
            logger.warn('⚠️  Initial data fetch failed, will retry on next interval');
            logger.debug(`Initial fetch error details: ${(error as Error).message}`);
        }
    }

    // Set up hourly refresh
    refreshInterval = setInterval(async () => {
        try {
            await updateCachedData();
        } catch (error) {
            logger.error('❌ Scheduled data refresh failed', error as Error);
        }
    }, config.traffic.refreshInterval);

    logger.success(
        `⏱️  Scheduled refresh set for every ${config.traffic.refreshInterval / 1000 / 60} minutes`
    );
};

/**
 * Stops the scheduled data refresh
 */
export const stopScheduledRefresh = (): void => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        logger.info('⏹️  Scheduled refresh stopped');
    }
};
