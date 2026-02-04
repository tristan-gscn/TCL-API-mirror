/**
 * @fileoverview TypeScript interfaces for TCL vehicle monitoring data.
 * Defines the structure of data returned by the GrandLyon SIRI-lite API.
 * @module models/vehicleMonitoring
 */

/**
 * Vehicle monitoring delivery payload
 */
export interface VehicleMonitoringDelivery {
    /** Array of vehicle activities */
    VehicleActivity?: unknown[];
    /** Additional fields */
    [key: string]: unknown;
}

/**
 * SIRI-lite vehicle monitoring response shape (partial)
 */
export interface VehicleMonitoringApiResponse {
    Siri?: {
        ServiceDelivery?: {
            VehicleMonitoringDelivery?: VehicleMonitoringDelivery[];
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

/**
 * Cached data structure with metadata
 */
export interface CachedVehicleMonitoringData {
    /** Raw API payload */
    payload: VehicleMonitoringApiResponse | null;
    /** Timestamp of last update */
    lastUpdated: Date | null;
    /** Total number of vehicle activities */
    count: number;
}
