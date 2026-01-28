/**
 * @fileoverview Configuration module for the TCL API Mirror application.
 * Loads and exports environment variables and API configuration.
 * @module config
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * API configuration interface
 */
export interface ApiConfig {
    /** Base URL for the GrandLyon TCL API */
    baseUrl: string;
    /** Email for Basic Auth */
    email: string;
    /** Password for Basic Auth */
    password: string;
    /** Refresh interval in milliseconds */
    refreshInterval: number;
}

/**
 * Server configuration interface
 */
export interface ServerConfig {
    /** Port number for the Express server */
    port: number;
}

/**
 * Application configuration object
 */
export const config = {
    api: {
        baseUrl: 'https://data.grandlyon.com/fr/datapusher/ws/rdata/tcl_sytral.tclalertetrafic_2/all.json?start=1&filename=alertes-trafic-reseau-transports-commun-lyonnais-v2',
        email: process.env.EMAIL || '',
        password: process.env.PASSWORD || '',
        refreshInterval: 60 * 60 * 1000, // 1 hour in milliseconds
    } as ApiConfig,
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
    } as ServerConfig,
};

export default config;
