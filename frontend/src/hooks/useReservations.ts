import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createHold,
    createReservation,
    getReservations,
    getReservationById,
} from "../api/reservations";
import {
    HoldSpacesRequest,
    ReservationCreateData,
    ReservationStatus,
    PaymentStatus,
} from "../types/reservation";

export const useCreateHold = () => {
    return useMutation({
        mutationFn: (data: HoldSpacesRequest) => createHold(data),
    });
};

export const useCreateReservation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ReservationCreateData) => createReservation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reservations"] });
        },
    });
};

export const useReservations = (
    page: number = 1,
    filters?: {
        trip_id?: string;
        client_id?: string;
        status?: ReservationStatus;
        payment_status?: PaymentStatus;
    }
) => {
    return useQuery({
        queryKey: ["reservations", page, filters],
        queryFn: () => getReservations(page, 20, filters),
    });
};

export const useReservation = (id: string) => {
    return useQuery({
        queryKey: ["reservation", id],
        queryFn: () => getReservationById(id),
        enabled: !!id,
    });
};
