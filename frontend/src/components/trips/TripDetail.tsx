import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTrip, useTripSpaces } from "../../hooks/useTrips";
import { useCreateHold } from "../../hooks/useReservations";
import { useSpaceSocket } from "../../hooks/useSpaceSocket";
import LoadingSpinner from "../shared/LoadingSpinner";
import SpaceMap from "../spaces/SpaceMap";
import { toast } from "sonner";
import { authStore } from "../../stores/authStore";

const TripDetail = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: trip, isLoading } = useTrip(id);
  const { data: spaces, isLoading: loadingSpaces, refetch: refetchSpaces } = useTripSpaces(id);
  const createHold = useCreateHold();

  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);

  // Real-time space updates via WebSocket
  const handleSpaceUpdate = useCallback((data: { space_id: string; status: string }) => {
    // Refetch spaces to get the latest state
    refetchSpaces();

    // If the updated space was selected and is no longer available, deselect it
    if (data.status !== 'available' && data.status !== 'on_hold') {
      setSelectedSpaces(prev => prev.filter(id => id !== data.space_id));
    }
  }, [refetchSpaces]);

  useSpaceSocket({
    tripId: id,
    onSpaceUpdate: handleSpaceUpdate,
    enabled: !!id
  });

  const handleSpaceSelect = (spaceId: string) => {
    setSelectedSpaces((prev) =>
      prev.includes(spaceId)
        ? prev.filter((id) => id !== spaceId)
        : [...prev, spaceId]
    );
  };


  const handleReserve = async () => {
    if (!trip || selectedSpaces.length === 0) return;

    // Check if any selected space already has a pending reservation
    const hasPendingReservation = selectedSpaces.some(id => {
      const space = spaces?.spaces.find(s => s.id === id);
      return space?.has_pending_reservation === true;
    });

    if (hasPendingReservation) {
      // User already has a reservation for these spaces - redirect to view it
      toast.info("Ya tienes una reservación pendiente. Redirigiendo...");
      navigate("/reservations");
      return;
    }

    // Check if we are resuming an existing hold (on_hold and is_mine but no reservation yet)
    const isResumingHold = selectedSpaces.every(id => {
      const space = spaces?.spaces.find(s => s.id === id);
      return space?.status === 'on_hold' && space?.is_mine && !space?.has_pending_reservation;
    });

    if (isResumingHold) {
      const selectedSpaceObjects = spaces?.spaces.filter(s => selectedSpaces.includes(s.id)) || [];
      // Use the earliest expiration found, or fallback
      const expiresAt = selectedSpaceObjects[0]?.hold_expires_at || new Date(Date.now() + 15 * 60000).toISOString();

      navigate("/reservations/create", {
        state: {
          hold: {
            message: "Resuming hold",
            trip_id: trip.id,
            space_ids: selectedSpaces,
            spaces_count: selectedSpaces.length,
            hold_expires_at: expiresAt,
            expires_in_minutes: 15
          },
          trip: trip,
          selectedSpaces: selectedSpaceObjects
        }
      });
      return;
    }

    try {
      const result = await createHold.mutateAsync({
        trip_id: trip.id,
        space_ids: selectedSpaces,
      });

      toast.success("Espacios bloqueados temporalmente");

      // Navigate to creation page with hold data
      navigate("/reservations/create", {
        state: {
          hold: result,
          trip: trip,
          selectedSpaces: spaces?.spaces.filter(s => selectedSpaces.includes(s.id))
        }
      });
    } catch (error) {
      toast.error("Error al reservar espacios. Intenta nuevamente.");
      console.error(error);
    }
  };

  const { user } = authStore();

  const handleBack = () => {
    if (user?.role === 'superadmin' || user?.role === 'manager') {
      navigate("/admin/trips");
    } else {
      navigate("/trips");
    }
  };

  if (isLoading || !trip) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  const subtotal = selectedSpaces.length * trip.price_per_space;

  // Check if resuming hold or viewing existing reservation
  const isResumingHold = selectedSpaces.length > 0 && selectedSpaces.every(id => {
    const space = spaces?.spaces.find(s => s.id === id);
    return space?.status === 'on_hold' && space?.is_mine && !space?.has_pending_reservation;
  });

  const hasExistingReservation = selectedSpaces.some(id => {
    const space = spaces?.spaces.find(s => s.id === id);
    return space?.has_pending_reservation === true;
  });

  return (
    <div className="space-y-4">
      <button
        onClick={handleBack}
        className="text-slate-600 hover:text-slate-900 flex items-center gap-2 mb-4"
      >
        ← Volver
      </button>
      <div className="bg-white dark:bg-keikichi-forest-800 rounded-lg border dark:border-keikichi-forest-600 p-4 shadow-sm space-y-2">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
          {trip.origin} → {trip.destination}
        </h2>
        <p className="text-sm text-slate-600 dark:text-keikichi-lime-300">Salida: {trip.departure_date} {trip.departure_time}</p>
        <p className="text-sm text-slate-600 dark:text-keikichi-lime-300">
          Precio por espacio: <span className="font-semibold">${trip.price_per_space} <span className="text-xs text-slate-500 dark:text-keikichi-lime-400">{trip.currency || 'USD'}</span></span>
        </p>
        {trip.notes_public && <p className="text-sm text-slate-600 dark:text-keikichi-lime-300">Notas: {trip.notes_public}</p>}
      </div>

      <div className="bg-white dark:bg-keikichi-forest-800 rounded-lg border dark:border-keikichi-forest-600 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Mapa de espacios</h3>
          {spaces && (
            <p className="text-sm text-slate-600 dark:text-keikichi-lime-300">
              Disponible: {spaces.summary.available} / {spaces.total_spaces}
            </p>
          )}
        </div>

        <SpaceMap
          spaces={spaces?.spaces ?? []}
          isLoading={loadingSpaces}
          selectedSpaces={selectedSpaces}
          onSpaceSelect={handleSpaceSelect}
        />

        {selectedSpaces.length > 0 && (
          <div className="mt-4 pt-4 border-t dark:border-keikichi-forest-700 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Seleccionados: {selectedSpaces.length}
              </p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                Total: ${subtotal.toFixed(2)} <span className="text-sm text-blue-400 dark:text-blue-300 font-normal">{trip.currency || 'USD'}</span>
              </p>
            </div>
            <button
              onClick={handleReserve}
              disabled={createHold.isPending}
              className={`text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 transition-colors ${hasExistingReservation ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {createHold.isPending
                ? "Procesando..."
                : hasExistingReservation
                  ? "Ver Reservación"
                  : isResumingHold
                    ? "Continuar"
                    : "Reservar"
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetail;
