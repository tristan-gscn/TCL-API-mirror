/**
 * @fileoverview TypeScript interfaces for TCL traffic alert data.
 * Defines the structure of data returned by the GrandLyon API.
 * @module models/trafficAlert
 */

/**
 * Represents a single traffic alert from the TCL network
 */
export interface TrafficAlert {
    /** Unique identifier for the alert */
    id: string;
    /** Title of the alert */
    title: string;
    /** Detailed description of the alert */
    description: string;
    /** Type of transport affected (metro, bus, tram, etc.) */
    type: string;
    /** Lines affected by the alert */
    lines: string[];
    /** Start date of the disruption */
    startDate: string;
    /** End date of the disruption */
    endDate: string;
    /** Severity level of the alert */
    severity: string;
    /** Additional properties from the API */
    [key: string]: unknown;
}

/**
 * Represents the raw response from the GrandLyon API
 */
export interface GrandLyonApiResponse {
    /** Array of traffic alert values */
    values: TrafficAlertRaw[];
    /** Number of results returned */
    nb_results: number;
    /** Starting index */
    start: number;
    /** Any additional metadata */
    [key: string]: unknown;
}

/**
 * Raw traffic alert data as returned by the API
 */
export interface TrafficAlertRaw {
    /** Raw fields from API - structure may vary */
    [key: string]: unknown;
}

/**
 * Cached data structure with metadata
 */
export interface CachedTrafficData {
    /** Array of traffic alerts */
    alerts: TrafficAlertRaw[];
    /** Timestamp of last update */
    lastUpdated: Date | null;
    /** Total number of alerts */
    count: number;
}

/**
 * API response wrapper for client responses
 */
export interface ApiResponse<T> {
    /** Indicates if the request was successful */
    success: boolean;
    /** Response data */
    data: T | null;
    /** Error message if unsuccessful */
    error?: string | undefined;
    /** Timestamp of the response */
    timestamp: string;
    /** Timestamp of last data update */
    lastUpdated: string | null;
}
