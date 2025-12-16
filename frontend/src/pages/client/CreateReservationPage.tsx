import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useCreateReservation } from "../../hooks/useReservations";
import ReservationForm, { ReservationFormData } from "../../components/reservations/ReservationForm";
import { toast } from "sonner";
import { Trip } from "../../types/trip";
import { Space } from "../../types/space";
import { HoldSpacesResponse } from "../../types/reservation";

interface LocationState {
    hold: HoldSpacesResponse;
    trip: Trip;
    selectedSpaces: Space[];
}

const CreateReservationPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const createReservation = useCreateReservation();

    const state = location.state as LocationState;

    if (!state?.hold || !state?.trip) {
        return <Navigate to="/trips" replace />;
    }

    const { trip, selectedSpaces } = state;

    const handleSubmit = async (data: ReservationFormData) => {
        try {
            // Transform items with correct labeling fields
            const items = data.items.map(item => {
                // Calculate total weight if missing
                const totalWeight = (item.box_count || 0) * (item.weight_per_unit || 0);

                return {
                    product_name: item.product_name,
                    box_count: item.box_count,
                    total_weight: totalWeight,
                    weight_unit: item.weight_unit,
                    packaging_type: item.packaging_type,
                    services: item.services,
                    space_id: item.space_id,
                    // Per-item labeling fields (as expected by backend)
                    labeling_required: item.needs_labeling || false,
                    label_quantity: item.labeling_quantity || undefined,
                    label_dimensions: item.labeling_dimensions || undefined,
                    label_file_id: item.labeling_file_id || undefined,
                };
            });

            await createReservation.mutateAsync({
                trip_id: trip.id,
                space_ids: selectedSpaces.map(s => s.id),
                items: items,

                request_pickup: data.request_pickup,
                pickup_details: data.request_pickup ? data.pickup_details : undefined,

                is_international: data.is_international,
                use_own_bond: data.use_own_bond,
                bond_file_id: data.bond_file_id,

                requires_invoice: data.requires_invoice,
                billing_company_name: data.billing_company_name,
                billing_rfc: data.billing_rfc,
                cfdi_use: data.cfdi_use,
                billing_contact_methods: data.billing_contact_methods,
                invoice_data_id: data.invoice_data_id,

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                payment_method: data.payment_method as any,
            });

            toast.success("Reservación creada exitosamente");
            localStorage.removeItem(`reservation_draft_${trip.id}`);
            navigate("/reservations"); // Or dashboard
        } catch (error: any) {
            const message = error?.response?.data?.detail || "Error al crear la reservación";
            toast.error(message);
            console.error(error);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <button
                onClick={() => navigate(`/trips/${trip.id}`)}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-2"
            >
                ← Volver al viaje
            </button>
            <div className="bg-white dark:!bg-keikichi-forest-800 rounded-lg border dark:border-keikichi-forest-600 p-6 shadow-sm transition-colors">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Confirmar Reservación</h1>

                <div className="bg-slate-50 dark:!bg-keikichi-forest-900 rounded-md p-4 mb-6 space-y-2 transition-colors">
                    <h3 className="font-semibold text-slate-800 dark:text-keikichi-lime-100">Resumen del Viaje</h3>
                    <p className="text-sm text-slate-600 dark:text-keikichi-lime-300">{trip.origin} → {trip.destination}</p>
                    <p className="text-sm text-slate-600 dark:text-keikichi-lime-300">
                        Espacios: {selectedSpaces.map(s => s.space_number).join(", ")}
                    </p>
                    <p className="text-sm font-medium text-blue-600 dark:text-keikichi-yellow">
                        Total a pagar: ${(selectedSpaces.length * trip.price_per_space).toFixed(2)}
                    </p>
                </div>

                <ReservationForm
                    onSubmit={handleSubmit}
                    isSubmitting={createReservation.isPending}
                    trip={trip}
                    selectedSpaces={selectedSpaces}
                />
            </div>
        </div >
    );
};

export default CreateReservationPage;
