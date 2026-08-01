import { apiClient } from './client';

export interface GeocodeResult {
  results: Array<{ formatted_address: string }>;
  status: string;
}

/**
 * Reverse geocode via the backend proxy - the Google Maps API key stays
 * server-side and is never shipped to the client.
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<GeocodeResult> => {
  const res = await apiClient.get('/api/maps/geocode/json', {
    params: { latlng: `${lat},${lng}` },
  });
  return res.data;
};
