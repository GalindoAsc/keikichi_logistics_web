import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { CreateTripData } from '@/types'

export function useTrips(params?: {
  origin?: string
  destination?: string
  departure_date?: string
  status?: string
}) {
  return useQuery({
    queryKey: ['trips', params],
    queryFn: () => api.getTrips(params),
  })
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: ['trip', id],
    queryFn: () => api.getTrip(id),
    enabled: !!id,
  })
}

export function useCreateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTripData) => api.createTrip(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useUpdateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTripData> }) =>
      api.updateTrip(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteTrip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useTripSpaces(tripId: string) {
  return useQuery({
    queryKey: ['spaces', tripId],
    queryFn: () => api.getTripSpaces(tripId),
    enabled: !!tripId,
  })
}
