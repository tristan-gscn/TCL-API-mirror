/**
 * @fileoverview Logger utility for the application.
 * Provides consistent logging functionality across the application with colors and configurable log levels.
 * @module utils/logger
 */

/**
 * Log levels constants with numeric values for comparison
 */
const LOG_LEVELS = {
    ERROR: { name: 'ERROR', value: 0, color: '\x1b[31m', icon: '❌' }, // Red
    WARN: { name: 'WARN', value: 1, color: '\x1b[33m', icon: '⚠️ ' }, // Yellow
    INFO: { name: 'INFO', value: 2, color: '\x1b[36m', icon: 'ℹ️ ' }, // Cyan
    DEBUG: { name: 'DEBUG', value: 3, color: '\x1b[90m', icon: '🐛' }, // Gray
} as const;

const RESET_COLOR = '\x1b[0m';

type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Get current log level from environment variables
 * LOG_LEVEL can be: ERROR, WARN, INFO, DEBUG
 * Default is INFO to show important operations (server started, data fetched, etc.)
 */
const getCurrentLogLevel = (): number => {
    const envLogLevel = process.env.LOG_LEVEL?.toUpperCase() as LogLevel;
    if (envLogLevel && LOG_LEVELS[envLogLevel]) {
        return LOG_LEVELS[envLogLevel].value;
    }
    // Default level: show ERROR, WARN, and INFO messages
    return LOG_LEVELS.INFO.value;
};

/**
 * Check if a log level should be displayed
 * @param level - The log level to check
 * @returns True if the level should be displayed
 */
const shouldLog = (level: LogLevel): boolean => {
    return LOG_LEVELS[level].value <= getCurrentLogLevel();
};

/**
 * Formats a log message with timestamp, level, colors and icons
 * @param level - The log level
 * @param message - The message to log
 * @returns Formatted log string
 */
const formatMessage = (level: LogLevel, message: string): string => {
    const timestamp = new Date().toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    
    const levelConfig = LOG_LEVELS[level];
    const coloredLevel = `${levelConfig.color}${levelConfig.name}${RESET_COLOR}`;
    const timeColor = '\x1b[2m'; // Dim
    
    return `${timeColor}[${timestamp}]${RESET_COLOR} ${levelConfig.icon} ${coloredLevel} ${message}`;
};

/**
 * Logger utility object with methods for different log levels
 */
export const logger = {
    /**
     * Logs an error message (always visible)
     * @param message - The message to log
     * @param error - Optional error object for additional context
     */
    error: (message: string, error?: Error): void => {
        if (shouldLog('ERROR')) {
            console.error(formatMessage('ERROR', message));
            if (error) {
                console.error(`${LOG_LEVELS.ERROR.color}${error.stack || error.message}${RESET_COLOR}`);
            }
        }
    },

    /**
     * Logs a warning message (visible by default)
     * @param message - The message to log
     */
    warn: (message: string): void => {
        if (shouldLog('WARN')) {
            console.warn(formatMessage('WARN', message));
        }
    },

    /**
     * Logs an informational message (hidden by default in production)
     * Set LOG_LEVEL=INFO or LOG_LEVEL=DEBUG to show these logs
     * @param message - The message to log
     */
    info: (message: string): void => {
        if (shouldLog('INFO')) {
            console.log(formatMessage('INFO', message));
        }
    },

    /**
     * Logs a debug message (only visible with LOG_LEVEL=DEBUG)
     * @param message - The message to log
     */
    debug: (message: string): void => {
        if (shouldLog('DEBUG')) {
            console.debug(formatMessage('DEBUG', message));
        }
    },

    /**
     * Logs a success message (treated as INFO level)
     * @param message - The message to log
     */
    success: (message: string): void => {
        if (shouldLog('INFO')) {
            const successIcon = '✅';
            const successColor = '\x1b[32m'; // Green
            const timestamp = new Date().toLocaleString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
            const timeColor = '\x1b[2m'; // Dim
            
            console.log(`${timeColor}[${timestamp}]${RESET_COLOR} ${successIcon} ${successColor}SUCCESS${RESET_COLOR} ${message}`);
        }
    },

    /**
     * Get current log level for debugging
     * @returns Current log level name
     */
    getLogLevel: (): string => {
        const currentLevel = getCurrentLogLevel();
        return Object.entries(LOG_LEVELS).find(([, config]) => config.value === currentLevel)?.[0] || 'UNKNOWN';
    },
};
