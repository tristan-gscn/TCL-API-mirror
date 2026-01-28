/**
 * @fileoverview Service for fetching and caching TCL traffic alert data.
 * Handles communication with the GrandLyon API and data storage.
 * @module services/tclService
 */

import axios, { AxiosError } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { CachedTrafficData, GrandLyonApiResponse, TrafficAlertRaw } from '../models/trafficAlert';

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

/**
 * Creates Basic Auth header from email and password
 * @returns Base64 encoded credentials string
 */
const getAuthHeader = (): string => {
    const credentials = `${config.api.email}:${config.api.password}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
};

/**
 * Fetches traffic alert data from the GrandLyon API
 * @returns Promise resolving to array of traffic alerts
 * @throws Error if the API request fails
 */
export const fetchTrafficAlerts = async (): Promise<TrafficAlertRaw[]> => {
    logger.info('Fetching traffic alerts from GrandLyon API...');

    try {
        const response = await axios.get<GrandLyonApiResponse>(config.api.baseUrl, {
            headers: {
                Authorization: getAuthHeader(),
                'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 seconds timeout
        });

        const alerts = response.data.values || [];
        logger.info(`Successfully fetched ${alerts.length} traffic alerts`);
        return alerts;
    } catch (error) {
        const axiosError = error as AxiosError;
        const errorMessage = axiosError.response
            ? `API responded with status ${axiosError.response.status}`
            : axiosError.message;

        logger.error(`Failed to fetch traffic alerts: ${errorMessage}`, error as Error);
        throw new Error(`Failed to fetch traffic alerts: ${errorMessage}`);
    }
};

/**
 * Updates the cached data with fresh data from the API
 * @returns Promise resolving to the updated cached data
 */
export const updateCachedData = async (): Promise<CachedTrafficData> => {
    try {
        const alerts = await fetchTrafficAlerts();
        const now = new Date();
        cachedData = {
            alerts,
            lastUpdated: now,
            count: alerts.length,
        };
        logger.info(`Cache updated with ${alerts.length} alerts at ${now.toISOString()}`);
        return cachedData;
    } catch (error) {
        logger.error('Failed to update cached data', error as Error);
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
        logger.info('Cache is empty, fetching initial data...');
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
    logger.info('Starting scheduled data refresh...');

    // Fetch immediately if cache is empty
    if (cachedData.alerts.length === 0 || cachedData.lastUpdated === null) {
        try {
            await updateCachedData();
        } catch (error) {
            logger.error('Initial data fetch failed, will retry on next interval', error as Error);
        }
    }

    // Set up hourly refresh
    refreshInterval = setInterval(async () => {
        try {
            await updateCachedData();
        } catch (error) {
            logger.error('Scheduled data refresh failed', error as Error);
        }
    }, config.api.refreshInterval);

    logger.info(`Scheduled refresh set for every ${config.api.refreshInterval / 1000 / 60} minutes`);
};

/**
 * Stops the scheduled data refresh
 */
export const stopScheduledRefresh = (): void => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        logger.info('Scheduled refresh stopped');
    }
};

/**
 * Forces a manual refresh of the cached data
 * @returns Promise resolving to the updated cached data
 */
export const forceRefresh = async (): Promise<CachedTrafficData> => {
    logger.info('Forcing manual data refresh...');
    return updateCachedData();
};

export default {
    fetchTrafficAlerts,
    getCachedData,
    getCachedDataSync,
    startScheduledRefresh,
    stopScheduledRefresh,
    forceRefresh,
};
