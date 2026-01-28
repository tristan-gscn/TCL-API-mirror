/**
 * @fileoverview Express application configuration and middleware setup.
 * @module app
 */

import express, { Request, Response } from 'express';
import trafficRoutes from './routes/trafficRoutes.js';

const app = express();

// Middleware
app.use(express.json());

/**
 * Health check endpoint
 * @route GET /health
 */
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

/**
 * API routes
 * All traffic-related endpoints are prefixed with /traffic
 */
app.use('/traffic', trafficRoutes);

/**
 * 404 handler for undefined routes
 */
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        timestamp: new Date().toISOString(),
    });
});

export default app;
