import api from "./client";
import { Trip } from "../types/trip";
import { TripSpacesResponse } from "../types/space";

export const fetchTrips = async (futureOnly: boolean = false): Promise<Trip[]> => {
  const { data } = await api.get<Trip[]>("/trips/", { params: { future_only: futureOnly } });
  return data;
};

export const fetchTrip = async (id: string): Promise<Trip> => {
  const { data } = await api.get<Trip>(`/trips/${id}`);
  return data;
};

export const fetchTripSpaces = async (id: string): Promise<TripSpacesResponse> => {
  const { data } = await api.get<TripSpacesResponse>(`/spaces/trip/${id}`);
  return data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createTrip = async (data: any): Promise<Trip> => {
  const { data: response } = await api.post<Trip>("/trips/", data);
  return response;
};

export const deleteTrip = async (id: string): Promise<void> => {
  await api.delete(`/trips/${id}`);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateTrip = async (id: string, data: any): Promise<Trip> => {
  const { data: response } = await api.patch<Trip>(`/trips/${id}`, data);
  return response;
};

/**
 * Download trip manifest PDF (for driver/warehouse)
 */
export const downloadManifest = async (tripId: string, tripInfo?: { origin?: string; destination?: string; date?: string }): Promise<void> => {
  try {
    const response = await api.get(`/trips/${tripId}/manifest`, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });

    if (!response.data || response.data.size === 0) {
      throw new Error('Empty response received');
    }

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);

    // Open in new tab
    const newWindow = window.open(blobUrl, '_blank');

    if (!newWindow) {
      // Fallback to download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `manifiesto_${tripInfo?.origin || 'viaje'}_${tripInfo?.destination || ''}_${tripId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch (error) {
    console.error('Download manifest error:', error);
    throw error;
  }
};
