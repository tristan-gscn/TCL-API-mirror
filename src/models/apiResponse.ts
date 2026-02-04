/**
 * @fileoverview Generic API response wrapper for client responses.
 * @module models/apiResponse
 */

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
