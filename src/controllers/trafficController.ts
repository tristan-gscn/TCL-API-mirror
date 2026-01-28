/**
 * @fileoverview Controller for handling traffic alert API requests.
 * Contains request handlers for traffic-related endpoints.
 * @module controllers/trafficController
 */

import { Request, Response } from 'express';
import { getCachedData, getCachedDataSync } from '../services/tclService';
import { ApiResponse, TrafficAlertRaw } from '../models/trafficAlert';
import { logger } from '../utils/logger';

/**
 * Builds a standardized API response
 * @param success - Whether the request was successful
 * @param data - The response data
 * @param lastUpdated - Timestamp of last data update
 * @param error - Optional error message
 * @returns Formatted API response object
 */
const buildResponse = <T>(
    success: boolean,
    data: T | null,
    lastUpdated: Date | null,
    error?: string
): ApiResponse<T> => {
    return {
        success,
        data,
        error,
        timestamp: new Date().toISOString(),
        lastUpdated: lastUpdated?.toISOString() || null,
    };
};

/**
 * Handles GET request for all traffic alerts
 * @param req - Express request object
 * @param res - Express response object
 */
export const getAllAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
        const cachedData = await getCachedData();
        const response = buildResponse<TrafficAlertRaw[]>(
            true,
            cachedData.alerts,
            cachedData.lastUpdated
        );
        res.json(response);
    } catch (error) {
        logger.error('Failed to get traffic alerts', error as Error);
        const response = buildResponse<null>(
            false,
            null,
            null,
            'Failed to retrieve traffic alerts'
        );
        res.status(500).json(response);
    }
};

/**
 * Handles GET request for traffic data status/metadata
 * @param req - Express request object
 * @param res - Express response object
 */
export const getStatus = (req: Request, res: Response): void => {
    const cachedData = getCachedDataSync();
    const response = buildResponse<{ count: number; lastUpdated: string | null }>(
        true,
        {
            count: cachedData.count,
            lastUpdated: cachedData.lastUpdated?.toISOString() || null,
        },
        cachedData.lastUpdated
    );
    res.json(response);
};
