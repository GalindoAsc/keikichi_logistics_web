import { useQuery } from "@tanstack/react-query";
import { fetchTrip, fetchTripSpaces, fetchTrips } from "../api/trips";
import { Trip } from "../types/trip";
import { TripSpacesResponse } from "../types/space";

export const useTrips = () => useQuery<Trip[]>({ queryKey: ["trips"], queryFn: fetchTrips });

export const useTrip = (id: string) =>
  useQuery<Trip>({ queryKey: ["trip", id], queryFn: () => fetchTrip(id), enabled: !!id });

export const useTripSpaces = (id: string) =>
  useQuery<TripSpacesResponse>({ queryKey: ["trip-spaces", id], queryFn: () => fetchTripSpaces(id), enabled: !!id });
