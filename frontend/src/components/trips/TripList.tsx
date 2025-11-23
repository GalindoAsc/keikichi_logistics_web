import { TripCard } from './TripCard'
import type { TripListItem } from '@/types'

interface TripListProps {
  trips: TripListItem[]
  loading?: boolean
}

export function TripList({ trips, loading }: TripListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No se encontraron viajes</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  )
}
