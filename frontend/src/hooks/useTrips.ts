import { useQuery } from "@tanstack/react-query";
import { fetchTrip, fetchTripSpaces, fetchTrips } from "../api/trips";
import { Trip } from "../types/trip";
import { TripSpacesResponse } from "../types/space";

export const useTrips = (futureOnly: boolean = false) => useQuery<Trip[]>({ queryKey: ["trips", futureOnly], queryFn: () => fetchTrips(futureOnly) });

export const useTrip = (id: string) =>
  useQuery<Trip>({ queryKey: ["trip", id], queryFn: () => fetchTrip(id), enabled: !!id });

export const useTripSpaces = (id: string) =>
  useQuery<TripSpacesResponse>({ queryKey: ["trip-spaces", id], queryFn: () => fetchTripSpaces(id), enabled: !!id });

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTrip, deleteTrip, updateTrip } from "../api/trips";

export const useCreateTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: any) => createTrip(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
};

export const useDeleteTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTrip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
};

export const useUpdateTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTrip(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trip", id] });
    },
  });
};
