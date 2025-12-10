import TripList from "../../components/trips/TripList";
import { useTranslation } from "react-i18next";

const TripsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-keikichi-forest-800 dark:text-white">{t('trips.title')}</h1>
        <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('trips.subtitle')}</p>
      </div>
      <TripList />
    </div>
  );
};

export default TripsPage;
