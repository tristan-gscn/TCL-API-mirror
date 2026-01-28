/**
 * @fileoverview Server entry point.
 * Initializes the Express server and starts scheduled data refresh.
 * @module server
 */

import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { startScheduledRefresh, stopScheduledRefresh } from './services/tclService';

const PORT = config.server.port;

/**
 * Starts the server and initializes scheduled tasks
 */
const startServer = async (): Promise<void> => {
    try {
        // Start the scheduled data refresh (fetches immediately if cache is empty)
        await startScheduledRefresh();

        // Start the Express server
        app.listen(PORT, () => {
            logger.info(`Server is running on http://localhost:${PORT}`);
            logger.info('Available endpoints:');
            logger.info('  GET  /health - Health check');
            logger.info('  GET  /traffic/alerts - Get all traffic alerts');
            logger.info('  GET  /traffic/status - Get cache status');
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
    logger.info('Shutting down gracefully...');
    stopScheduledRefresh();
    process.exit(0);
};

// Handle process termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
startServer().then(() => {});
