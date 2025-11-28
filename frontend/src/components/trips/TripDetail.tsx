import { useParams } from "react-router-dom";
import { useTrip, useTripSpaces } from "../../hooks/useTrips";
import LoadingSpinner from "../shared/LoadingSpinner";
import SpaceMap from "../spaces/SpaceMap";

const TripDetail = () => {
  const { id = "" } = useParams();
  const { data: trip, isLoading } = useTrip(id);
  const { data: spaces, isLoading: loadingSpaces } = useTripSpaces(id);

  if (isLoading || !trip) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-4 shadow-sm space-y-2">
        <h2 className="text-xl font-semibold text-slate-800">
          {trip.origin} → {trip.destination}
        </h2>
        <p className="text-sm text-slate-600">Salida: {trip.departure_date} {trip.departure_time}</p>
        <p className="text-sm text-slate-600">Precio por espacio: ${trip.price_per_space}</p>
        {trip.notes_public && <p className="text-sm text-slate-600">Notas: {trip.notes_public}</p>}
      </div>

      <div className="bg-white rounded-lg border p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Mapa de espacios</h3>
          {spaces && (
            <p className="text-sm text-slate-600">
              Disponible: {spaces.summary.available} / {spaces.total_spaces}
            </p>
          )}
        </div>
        <SpaceMap spaces={spaces?.spaces ?? []} isLoading={loadingSpaces} />
      </div>
    </div>
  );
};

export default TripDetail;
