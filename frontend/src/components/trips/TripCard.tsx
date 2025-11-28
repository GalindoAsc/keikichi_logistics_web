import { Link } from "react-router-dom";
import { Trip } from "../../types/trip";

const TripCard = ({ trip }: { trip: Trip }) => (
  <div className="bg-white border rounded-lg p-4 shadow-sm space-y-2">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-slate-800">
        {trip.origin} → {trip.destination}
      </h3>
      <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 uppercase">{trip.status}</span>
    </div>
    <p className="text-sm text-slate-600">Salida: {trip.departure_date}</p>
    <p className="text-sm text-slate-600">Espacios libres: {trip.available_spaces ?? trip.total_spaces}</p>
    <Link to={`/trips/${trip.id}`} className="text-indigo-600 text-sm font-medium">
      Ver detalle
    </Link>
  </div>
);

export default TripCard;
