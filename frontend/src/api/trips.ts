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
