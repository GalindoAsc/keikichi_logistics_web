import { Link } from "react-router-dom";
import { Trip } from "../../types/trip";
import { MoreVertical, Edit, Trash, MapPin, Calendar, Users, ArrowRight } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { authStore } from "../../stores/authStore";
import { useDeleteTrip } from "../../hooks/useTrips";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

const TripCard = ({ trip }: { trip: Trip }) => {
  const { user } = authStore();
  const deleteTrip = useDeleteTrip();
  const canEdit = user?.role === "superadmin" || user?.role === "manager";
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'es' ? es : enUS;

  const handleDelete = async () => {
    if (confirm(t('trips.confirmDelete'))) {
      try {
        await deleteTrip.mutateAsync(trip.id);
        toast.success(t('trips.deleteSuccess'));
      } catch (error) {
        toast.error(t('trips.deleteError'));
        console.error(error);
      }
    }
  };

  const statusColors = {
    active: "bg-keikichi-lime-100 text-keikichi-lime-700 border-keikichi-lime-200 dark:bg-keikichi-lime-900/30 dark:text-keikichi-lime-400 dark:border-keikichi-lime-700",
    completed: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700",
    scheduled: "bg-keikichi-yellow-100 text-keikichi-yellow-700 border-keikichi-yellow-300 dark:bg-keikichi-yellow-900/30 dark:text-keikichi-yellow-400 dark:border-keikichi-yellow-700",
  };

  const statusLabels = {
    active: t('trips.status.active'),
    completed: t('trips.status.completed'),
    cancelled: t('trips.status.cancelled'),
    scheduled: t('trips.status.scheduled'),
  };

  return (
    <div className="group bg-white/70 dark:bg-keikichi-forest-800/70 backdrop-blur-sm border border-keikichi-lime-100/50 dark:border-keikichi-forest-600 shadow-sm rounded-3xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ring-1 ring-keikichi-lime-500/10 dark:ring-keikichi-lime-500/20">
      {/* Top Banner (Status) */}
      <div className="flex items-center justify-between mb-5">
        <span className={`text-[11px] font-bold px-3 py-1 rounded-full border tracking-wide ${statusColors[trip.status as keyof typeof statusColors] || "bg-zinc-100 dark:bg-slate-800 text-zinc-500 dark:text-slate-400"}`}>
          {statusLabels[trip.status as keyof typeof statusLabels]?.toUpperCase() || trip.status.toUpperCase()}
        </span>

        {canEdit && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="p-2 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 rounded-full outline-none transition-colors">
                <MoreVertical className="w-4 h-4 text-keikichi-forest-400 dark:text-keikichi-lime-400" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content className="min-w-[160px] bg-white dark:bg-keikichi-forest-900 rounded-2xl shadow-xl border border-keikichi-lime-100 dark:border-keikichi-forest-700 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                <DropdownMenu.Item asChild>
                  <Link
                    to={`/admin/trips/${trip.id}/edit`}
                    className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-200 flex items-center gap-2 px-3 py-2 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-800 rounded-xl cursor-pointer outline-none transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    {t('common.edit')}
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="text-sm font-medium text-rose-600 dark:text-rose-400 flex items-center gap-2 px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl cursor-pointer outline-none transition-colors"
                  onClick={handleDelete}
                >
                  <Trash className="w-4 h-4" />
                  {t('common.delete')}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>

      {/* Main Route Info */}
      <div className="space-y-5 mb-7">
        <div className="flex items-start gap-4">
          <div className="mt-1 p-2.5 bg-keikichi-lime-100 dark:bg-keikichi-lime-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <MapPin className="w-5 h-5 text-keikichi-lime-600 dark:text-keikichi-lime-400" />
          </div>
          <div>
            <h3 className="text-2xl font-heading font-bold text-keikichi-forest-800 dark:text-white leading-tight group-hover:text-keikichi-lime-600 dark:group-hover:text-keikichi-lime-400 transition-colors">
              {trip.destination}
            </h3>
            <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300 font-medium flex items-center gap-1 mt-1">
              {t('trips.from')} {trip.origin}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-keikichi-lime-50/80 dark:bg-keikichi-forest-700/50 rounded-2xl p-3 flex items-center gap-3 border border-keikichi-lime-100/50 dark:border-keikichi-forest-600">
            <div className="p-1.5 bg-white dark:bg-keikichi-forest-600 rounded-full shadow-sm">
              <Calendar className="w-4 h-4 text-keikichi-forest-400 dark:text-keikichi-lime-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-keikichi-forest-400 dark:text-keikichi-lime-400 tracking-wider">{t('trips.departure')}</span>
              <span className="text-sm font-semibold text-keikichi-forest-700 dark:text-keikichi-lime-200 font-numeric">
                {trip.departure_date ? format(parseISO(trip.departure_date), "d MMM", { locale: dateLocale }) : 'TBD'}
              </span>
            </div>
          </div>

          <div className="bg-keikichi-lime-50/80 dark:bg-keikichi-forest-700/50 rounded-2xl p-3 flex items-center gap-3 border border-keikichi-lime-100/50 dark:border-keikichi-forest-600">
            <div className="p-1.5 bg-white dark:bg-keikichi-forest-600 rounded-full shadow-sm">
              <Users className="w-4 h-4 text-keikichi-forest-400 dark:text-keikichi-lime-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-keikichi-forest-400 dark:text-keikichi-lime-400 tracking-wider">{t('trips.spaces')}</span>
              <span className="text-sm font-semibold text-keikichi-forest-700 dark:text-keikichi-lime-200 font-numeric">
                {trip.available_spaces ?? trip.total_spaces} <span className="text-keikichi-forest-400 dark:text-keikichi-lime-400 font-normal">/ {trip.total_spaces}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <Link
        to={`/trips/${trip.id}`}
        className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-keikichi-forest-700 border border-keikichi-lime-200 dark:border-keikichi-forest-600 text-keikichi-forest-700 dark:text-keikichi-lime-200 font-semibold rounded-2xl hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-600 hover:border-keikichi-lime-300 dark:hover:border-keikichi-lime-600 transition-all group-hover:border-keikichi-lime-400 dark:group-hover:border-keikichi-lime-500 group-hover:bg-keikichi-lime-50 dark:group-hover:bg-keikichi-lime-900/20 group-hover:text-keikichi-lime-600 dark:group-hover:text-keikichi-lime-400 group-hover:shadow-sm"
      >
        {t('trips.viewAvailability')}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default TripCard;
