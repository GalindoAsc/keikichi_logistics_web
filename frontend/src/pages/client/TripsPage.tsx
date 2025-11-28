import TripList from "../../components/trips/TripList";

const TripsPage = () => (
  <div className="space-y-4">
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Viajes disponibles</h1>
      <p className="text-sm text-slate-600">Explora los viajes y elige tus espacios.</p>
    </div>
    <TripList />
  </div>
);

export default TripsPage;
