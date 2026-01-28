/**
 * @fileoverview TypeScript interfaces for TCL traffic alert data.
 * Defines the structure of data returned by the GrandLyon API.
 * @module models/trafficAlert
 */
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
