import { Space } from "../../types/space";

interface Props {
  spaces: Space[];
  isLoading?: boolean;
}

const statusColors: Record<Space["status"], string> = {
  available: "bg-green-100 border-green-500",
  reserved: "bg-red-100 border-red-500",
  blocked: "bg-gray-200 border-gray-500",
  on_hold: "bg-yellow-100 border-yellow-500",
  internal: "bg-purple-100 border-purple-500",
};

const SpaceMap = ({ spaces, isLoading }: Props) => {
  if (isLoading) {
    return <p className="text-sm text-slate-500">Cargando mapa...</p>;
  }
  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
      {spaces.map((space) => (
        <div
          key={space.id}
          className={`border rounded-md p-3 text-center text-sm font-semibold ${statusColors[space.status]} ${space.is_mine ? "ring-2 ring-yellow-400" : ""}`}
        >
          {space.space_number}
        </div>
      ))}
    </div>
  );
};

export default SpaceMap;
