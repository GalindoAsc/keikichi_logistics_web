import TripCard from "./TripCard";
import { useTrips } from "../../hooks/useTrips";
import LoadingSpinner from "../shared/LoadingSpinner";
import { useTranslation } from "react-i18next";

const TripList = () => {
  const { data, isLoading } = useTrips(true);
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data?.length) {
    return <p className="text-center text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('trips.noTrips')}</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-1">
      {data.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
};

export default TripList;
