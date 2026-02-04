/**
 * @fileoverview Server entry point.
 * Initializes the Express server and starts scheduled data refresh.
 * @module server
 */

import app from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { startScheduledRefresh, stopScheduledRefresh } from './services/tclService.js';
import {
    startVehicleMonitoringRefresh,
    stopVehicleMonitoringRefresh,
} from './services/vehicleMonitoringService.js';

const PORT = config.server.port;

/**
 * Starts the server and initializes scheduled tasks
 */
const startServer = async (): Promise<void> => {
    try {
        // Start the scheduled data refresh (fetches immediately if cache is empty)
        await startScheduledRefresh();
        await startVehicleMonitoringRefresh();

        // Start the Express server
        app.listen(PORT, () => {
            logger.success(`Server started on http://localhost:${PORT}`);
            logger.info('Available endpoints:');
            logger.info('  🩺 GET  /health - Health check');
            logger.info('  🚨 GET  /traffic/alerts - Get all traffic alerts');
            logger.info('  📊 GET  /traffic/status - Get cache status');
            logger.info('  🚌 GET  /vehicle-monitoring/positions - Get vehicle positions');
            logger.info('  📈 GET  /vehicle-monitoring/status - Get vehicle cache status');
            logger.info(`Current log level: ${logger.getLogLevel()}`);
        });
    } catch (error) {
        logger.error('Failed to start server', error as Error);
        process.exit(1);
    }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = (): void => {
    logger.warn('Shutting down gracefully...');
    stopScheduledRefresh();
    stopVehicleMonitoringRefresh();
    logger.success('Server stopped cleanly');
    process.exit(0);
};

// Handle process termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
startServer().then(() => {});
