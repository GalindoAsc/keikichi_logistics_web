import { Space } from "../../types/space";
import { Package, Lock, Clock, Ban, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  spaces: Space[];
  isLoading?: boolean;
  selectedSpaces?: string[];
  onSpaceSelect?: (spaceId: string) => void;
  totalSpaces?: number;
  isSelectionEnabled?: boolean;
}

const SpaceMap = ({ spaces, isLoading, selectedSpaces = [], onSpaceSelect, isSelectionEnabled = false }: Props) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-slate-400">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Cargando mapa de carga...</p>
      </div>
    );
  }

  const handleSpaceClick = (space: Space) => {
    const isClickable = isSelectionEnabled ||
      space.status === "available" ||
      (space.status === "on_hold" && space.is_mine) ||
      (space.status === "reserved" && space.is_mine);

    if (isClickable && onSpaceSelect) {
      onSpaceSelect(space.id);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Truck Cab Indicator */}
      <div className="w-full max-w-[280px] bg-gradient-to-b from-slate-700 to-slate-800 rounded-t-3xl p-4 mb-2 text-center shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Thermo</div>
          <div className="w-16 h-1 bg-slate-600 mx-auto rounded-full"></div>
        </div>
      </div>

      {/* Trailer Body */}
      <div className="w-full max-w-[280px] bg-slate-100 border-x-4 border-slate-300 p-4 min-h-[400px] shadow-inner relative">
        {/* Floor Pattern Background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10">
          {spaces.map((space) => {
            const isSelected = selectedSpaces.includes(space.id);
            const isMine = space.is_mine;

            // Determine styles based on status
            let baseStyles = "bg-white border-slate-200 text-slate-500 hover:border-blue-400 hover:shadow-md";
            let icon = <Package className="w-5 h-5 opacity-30" />;

            if (space.status === 'reserved') {
              baseStyles = "bg-rose-50 border-rose-200 text-rose-700 cursor-not-allowed";
              icon = <Lock className="w-5 h-5" />;
            } else if (space.status === 'blocked') {
              baseStyles = "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed";
              icon = <Ban className="w-5 h-5" />;
            } else if (space.status === 'internal') {
              baseStyles = "bg-slate-800 border-slate-900 text-slate-400 cursor-not-allowed";
              icon = <Ban className="w-5 h-5" />;
            } else if (space.status === 'on_hold') {
              if (isMine) {
                baseStyles = "bg-amber-50 border-amber-300 text-amber-700 cursor-pointer ring-2 ring-amber-200 ring-offset-2";
                icon = <Clock className="w-5 h-5 animate-pulse" />;
              } else {
                baseStyles = "bg-amber-50/50 border-amber-200 text-amber-400 cursor-not-allowed opacity-75";
                icon = <Clock className="w-5 h-5" />;
              }
            }

            // Selection Override
            if (isSelected) {
              baseStyles = "bg-blue-600 border-blue-700 text-white shadow-lg scale-105 ring-4 ring-blue-100 z-20";
              icon = <CheckCircle2 className="w-5 h-5 text-white" />;
            }

            // Clickability check for cursor
            const isClickable = isSelectionEnabled ||
              space.status === "available" ||
              (space.status === "on_hold" && space.is_mine) ||
              (space.status === "reserved" && space.is_mine);

            return (
              <div
                key={space.id}
                onClick={() => handleSpaceClick(space)}
                className={cn(
                  "relative group flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ease-out h-24",
                  baseStyles,
                  !isClickable && !isSelected && "opacity-80 grayscale-[0.2]",
                  isClickable && !isSelected && "cursor-pointer active:scale-95"
                )}
              >
                <span className="text-2xl font-bold tracking-tight mb-1">{space.space_number}</span>
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide opacity-90">
                  {icon}
                </div>
                {/* Tooltip-ish label on hover */}
                {/* <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30">
                  {statusLabel}
                </div> */}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trailer Doors */}
      <div className="w-full max-w-[280px] bg-slate-800 rounded-b-md p-3 mt-1 shadow-xl flex flex-col items-center px-8 border-t border-slate-700">
        <div className="flex justify-between items-center w-full mb-1">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
          <div className="flex gap-1">
            <div className="w-8 h-1.5 bg-slate-600 rounded-full"></div>
            <div className="w-8 h-1.5 bg-slate-600 rounded-full"></div>
          </div>
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Puertas</div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-slate-600 max-w-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-white border border-slate-300"></div> Disponible
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-600"></div> Seleccionado
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-rose-50 border border-rose-200"></div> Ocupado
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-50 border border-amber-300"></div> En espera
        </div>
      </div>
    </div>
  );
};

export default SpaceMap;
