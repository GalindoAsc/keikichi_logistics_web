import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Package } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { TripListItem } from '@/types'

interface TripCardProps {
  trip: TripListItem
}

export function TripCard({ trip }: TripCardProps) {
  const statusColors = {
    Scheduled: 'bg-blue-100 text-blue-800',
    InTransit: 'bg-yellow-100 text-yellow-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{trip.origin} → {trip.destination}</CardTitle>
            <CardDescription className="mt-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(trip.departure_date)}
              {trip.departure_time && ` - ${trip.departure_time}`}
            </CardDescription>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[trip.status]}`}>
            {trip.status}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              {trip.available_spaces} de {trip.total_spaces} espacios disponibles
            </span>
          </div>
        </div>

        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{
                width: `${((trip.total_spaces - trip.available_spaces) / trip.total_spaces) * 100}%`
              }}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Link to={`/trips/${trip.id}`} className="w-full">
          <Button className="w-full" disabled={trip.available_spaces === 0}>
            {trip.available_spaces === 0 ? 'Sin espacios' : 'Ver Detalles'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
