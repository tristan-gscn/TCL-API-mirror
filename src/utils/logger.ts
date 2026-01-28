/**
 * @fileoverview Logger utility for the application.
 * Provides consistent logging functionality across the application.
 * @module utils/logger
 */

/**
 * Log levels enumeration
 */
enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG',
}

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
        console.log(formatMessage(LogLevel.INFO, message));
    },

    /**
     * Logs a warning message
     * @param message - The message to log
     */
    warn: (message: string): void => {
        console.warn(formatMessage(LogLevel.WARN, message));
    },

    /**
     * Logs an error message
     * @param message - The message to log
     * @param error - Optional error object for additional context
     */
    error: (message: string, error?: Error): void => {
        console.error(formatMessage(LogLevel.ERROR, message));
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
            console.debug(formatMessage(LogLevel.DEBUG, message));
        }
    },
};

export default logger;
