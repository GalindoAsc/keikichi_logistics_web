import { useState, useMemo } from "react";
import { Search, Filter, Globe } from "lucide-react";
import TripCard from "./TripCard";
import { useTrips } from "../../hooks/useTrips";
import LoadingSpinner from "../shared/LoadingSpinner";
import { useTranslation } from "react-i18next";

const TripList = () => {
  const { data, isLoading } = useTrips(true);
  const { t } = useTranslation();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [destinationFilter, setDestinationFilter] = useState<string>("all");
  const [internationalOnly, setInternationalOnly] = useState(false);

  // Get unique destinations for filter dropdown
  const destinations = useMemo(() => {
    if (!data) return [];
    const uniqueDestinations = [...new Set(data.map(trip => trip.destination))];
    return uniqueDestinations.sort();
  }, [data]);

  // Filter trips
  const filteredTrips = useMemo(() => {
    if (!data) return [];

    return data.filter(trip => {
      // Search filter (origin or destination)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          trip.origin.toLowerCase().includes(query) ||
          trip.destination.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Destination filter
      if (destinationFilter !== "all" && trip.destination !== destinationFilter) {
        return false;
      }

      // International filter
      if (internationalOnly && !trip.is_international) {
        return false;
      }

      return true;
    });
  }, [data, searchQuery, destinationFilter, internationalOnly]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('trips.searchPlaceholder', 'Buscar origen o destino...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-keikichi-lime-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Destination Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-keikichi-lime-500"
            >
              <option value="all">{t('trips.allDestinations', 'Todos los destinos')}</option>
              {destinations.map(dest => (
                <option key={dest} value={dest}>{dest}</option>
              ))}
            </select>
          </div>

          {/* International Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={internationalOnly}
              onChange={(e) => setInternationalOnly(e.target.checked)}
              className="w-4 h-4 text-keikichi-lime-500 rounded border-gray-300 focus:ring-keikichi-lime-500"
            />
            <Globe className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">{t('trips.international', 'Internacional')}</span>
          </label>
        </div>

        {/* Results count */}
        {data && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {filteredTrips.length} de {data.length} viajes
          </p>
        )}
      </div>

      {/* Trip Grid */}
      {filteredTrips.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-keikichi-lime-300">
            {searchQuery || destinationFilter !== "all" || internationalOnly
              ? t('trips.noMatchingTrips', 'No se encontraron viajes con esos filtros')
              : t('trips.noTrips')}
          </p>
          {(searchQuery || destinationFilter !== "all" || internationalOnly) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setDestinationFilter("all");
                setInternationalOnly(false);
              }}
              className="mt-2 text-sm text-keikichi-lime-600 hover:text-keikichi-lime-700 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-1">
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TripList;

