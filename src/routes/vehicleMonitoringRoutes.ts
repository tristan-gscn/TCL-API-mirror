/**
 * @fileoverview Express routes for vehicle monitoring endpoints.
 * Defines the REST-ful API routes for accessing vehicle monitoring data.
 * @module routes/vehicleMonitoringRoutes
 */

import { Router } from 'express';
import {
    getVehicleMonitoring,
    getVehicleMonitoringStatus,
} from '../controllers/vehicleMonitoringController.js';

const router = Router();

/**
 * @route GET /vehicle-monitoring/positions
 * @description Retrieves cached vehicle monitoring payload
 * @returns {ApiResponse<VehicleMonitoringApiResponse>} JSON response with vehicle data
 */
router.get('/positions', getVehicleMonitoring);

/**
 * @route GET /vehicle-monitoring/status
 * @description Retrieves the status of cached data (count and last update time)
 * @returns {ApiResponse<{count: number, lastUpdated: string}>} JSON response with status info
 */
router.get('/status', getVehicleMonitoringStatus);

export default router;
