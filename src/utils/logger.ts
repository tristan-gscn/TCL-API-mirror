/**
 * @fileoverview Logger utility for the application.
 * Provides consistent logging functionality across the application.
 * @module utils/logger
 */

/**
 * Log levels constants
 */
const LOG_LEVELS = {
    INFO: 'INFO',
    WARN: 'WARN', 
    ERROR: 'ERROR',
    DEBUG: 'DEBUG',
} as const;

type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

/**
 * Formats a log message with timestamp and level
 * @param level - The log level
 * @param message - The message to log
 * @returns Formatted log string
 */
const formatMessage = (level: LogLevel, message: string): string => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
};

/**
 * Logger utility object with methods for different log levels
 */
export const logger = {
    /**
     * Logs an informational message
     * @param message - The message to log
     */
    info: (message: string): void => {
        console.log(formatMessage(LOG_LEVELS.INFO, message));
    },

    /**
     * Logs a warning message
     * @param message - The message to log
     */
    warn: (message: string): void => {
        console.warn(formatMessage(LOG_LEVELS.WARN, message));
    },

    /**
     * Logs an error message
     * @param message - The message to log
     * @param error - Optional error object for additional context
     */
    error: (message: string, error?: Error): void => {
        console.error(formatMessage(LOG_LEVELS.ERROR, message));
        if (error) {
            console.error(error.stack || error.message);
        }
    },

    /**
     * Logs a debug message (only in development)
     * @param message - The message to log
     */
    debug: (message: string): void => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(formatMessage(LOG_LEVELS.DEBUG, message));
        }
    },
};

export default logger;
