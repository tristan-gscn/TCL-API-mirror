/**
 * @fileoverview Express routes for traffic alert endpoints.
 * Defines the REST-ful API routes for accessing traffic data.
 * @module routes/trafficRoutes
 */

import { Router } from 'express';
import { getAllAlerts, getStatus } from '../controllers/trafficController';

const router = Router();

/**
 * @route GET /traffic/alerts
 * @description Retrieves all cached traffic alerts
 * @returns {ApiResponse<TrafficAlertRaw[]>} JSON response with traffic alerts
 */
router.get('/alerts', getAllAlerts);

/**
 * @route GET /traffic/status
 * @description Retrieves the status of cached data (count and last update time)
 * @returns {ApiResponse<{count: number, lastUpdated: string}>} JSON response with status info
 */
router.get('/status', getStatus);

export default router;
