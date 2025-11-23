import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { CreateReservationData, ReservationStatus } from '@/types'

export function useMyReservations() {
  return useQuery({
    queryKey: ['my-reservations'],
    queryFn: () => api.getMyReservations(),
  })
}

export function useAllReservations() {
  return useQuery({
    queryKey: ['all-reservations'],
    queryFn: () => api.getAllReservations(),
  })
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: ['reservation', id],
    queryFn: () => api.getReservation(id),
    enabled: !!id,
  })
}

export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateReservationData) => api.createReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

export function useUpdateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReservationStatus }) =>
      api.updateReservation(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['all-reservations'] })
    },
  })
}

export function useCancelReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.cancelReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
  })
}

export function useUploadReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reservationId, file }: { reservationId: string; file: File }) =>
      api.uploadReceipt(reservationId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
    },
  })
}

export function useBankDetails(reservationId: string) {
  return useQuery({
    queryKey: ['bank-details', reservationId],
    queryFn: () => api.getBankDetails(reservationId),
    enabled: false,
  })
}
