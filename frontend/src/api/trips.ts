import api from "./client";
import { Trip } from "../types/trip";
import { TripSpacesResponse } from "../types/space";

export const fetchTrips = async (): Promise<Trip[]> => {
  const { data } = await api.get<Trip[]>("/trips");
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
