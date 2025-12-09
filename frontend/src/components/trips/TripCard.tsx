import { Link } from "react-router-dom";
import { Trip } from "../../types/trip";
import { MoreVertical, Edit, Trash, MapPin, Calendar, Users, ArrowRight } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { authStore } from "../../stores/authStore";
import { useDeleteTrip } from "../../hooks/useTrips";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TripCard = ({ trip }: { trip: Trip }) => {
  const { user } = authStore();
  const deleteTrip = useDeleteTrip();
  const canEdit = user?.role === "superadmin" || user?.role === "manager";

  const handleDelete = async () => {
    if (confirm("¿Estás seguro de que deseas eliminar este viaje?")) {
      try {
        await deleteTrip.mutateAsync(trip.id);
        toast.success("Viaje eliminado correctamente");
      } catch (error) {
        toast.error("Error al eliminar el viaje");
        console.error(error);
      }
    }
  };

  const statusColors = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    completed: "bg-slate-100 text-slate-600 border-slate-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className="group bg-white/70 backdrop-blur-sm border border-white/50 shadow-sm rounded-3xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ring-1 ring-zinc-900/5">
      {/* Top Banner (Status) */}
      <div className="flex items-center justify-between mb-5">
        <span className={`text-[11px] font-bold px-3 py-1 rounded-full border tracking-wide ${statusColors[trip.status as keyof typeof statusColors] || "bg-zinc-100 text-zinc-500"}`}>
          {trip.status.toUpperCase()}
        </span>

        {canEdit && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="p-2 hover:bg-zinc-100 rounded-full outline-none transition-colors">
                <MoreVertical className="w-4 h-4 text-zinc-400" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content className="min-w-[160px] bg-white rounded-2xl shadow-xl border border-zinc-100 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                <DropdownMenu.Item asChild>
                  <Link
                    to={`/admin/trips/${trip.id}/edit`}
                    className="text-sm font-medium text-zinc-700 flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 rounded-xl cursor-pointer outline-none transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="text-sm font-medium text-rose-600 flex items-center gap-2 px-3 py-2 hover:bg-rose-50 rounded-xl cursor-pointer outline-none transition-colors"
                  onClick={handleDelete}
                >
                  <Trash className="w-4 h-4" />
                  Eliminar
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>

      {/* Main Route Info */}
      <div className="space-y-5 mb-7">
        <div className="flex items-start gap-4">
          <div className="mt-1 p-2.5 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-heading font-bold text-zinc-900 leading-tight group-hover:text-primary transition-colors">
              {trip.destination}
            </h3>
            <p className="text-sm text-zinc-500 font-medium flex items-center gap-1 mt-1">
              Desde {trip.origin}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-50/80 rounded-2xl p-3 flex items-center gap-3 border border-zinc-100/50">
            <div className="p-1.5 bg-white rounded-full shadow-sm">
              <Calendar className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Salida</span>
              <span className="text-sm font-semibold text-zinc-700 font-numeric">
                {trip.departure_date ? format(new Date(trip.departure_date), "d MMM", { locale: es }) : 'TBD'}
              </span>
            </div>
          </div>

          <div className="bg-zinc-50/80 rounded-2xl p-3 flex items-center gap-3 border border-zinc-100/50">
            <div className="p-1.5 bg-white rounded-full shadow-sm">
              <Users className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Espacios</span>
              <span className="text-sm font-semibold text-zinc-700 font-numeric">
                {trip.available_spaces ?? trip.total_spaces} <span className="text-zinc-400 font-normal">/ {trip.total_spaces}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <Link
        to={`/trips/${trip.id}`}
        className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-zinc-200 text-zinc-700 font-semibold rounded-2xl hover:bg-zinc-50 hover:border-zinc-300 transition-all group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary group-hover:shadow-sm"
      >
        Ver Disponibilidad
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default TripCard;
