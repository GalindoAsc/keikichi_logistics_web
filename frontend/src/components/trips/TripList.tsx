import TripCard from "./TripCard";
import { useTrips } from "../../hooks/useTrips";
import LoadingSpinner from "../shared/LoadingSpinner";

const TripList = () => {
  const { data, isLoading } = useTrips();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data?.length) {
    return <p className="text-center text-slate-500">No hay viajes disponibles.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
};

export default TripList;
