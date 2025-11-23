import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SpaceMap } from './SpaceMap'
import { useCreateReservation } from '@/hooks/useReservations'
import { toast } from 'sonner'
import { Calendar, MapPin, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Trip, Space } from '@/types'

interface TripDetailProps {
  trip: Trip
  spaces: Space[]
}

export function TripDetail({ trip, spaces }: TripDetailProps) {
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([])
  const navigate = useNavigate()
  const createReservation = useCreateReservation()

  const handleSpaceToggle = (spaceId: string) => {
    setSelectedSpaces((prev) =>
      prev.includes(spaceId)
        ? prev.filter((id) => id !== spaceId)
        : [...prev, spaceId]
    )
  }

  const handleReserve = async () => {
    if (selectedSpaces.length === 0) {
      toast.error('Selecciona al menos un espacio')
      return
    }

    try {
      await createReservation.mutateAsync({
        trip_id: trip.id,
        space_ids: selectedSpaces,
      })
      toast.success('Reserva creada exitosamente')
      navigate('/my-reservations')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al crear la reserva')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {trip.origin} → {trip.destination}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-5 w-5" />
              <span>
                {formatDate(trip.departure_date)}
                {trip.departure_time && ` - ${trip.departure_time}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-5 w-5" />
              <span>Estado: {trip.status}</span>
            </div>
          </div>

          {trip.notes_client && (
            <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-md">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Notas para clientes:</p>
                <p className="text-sm text-blue-700 mt-1">{trip.notes_client}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Selecciona tus espacios</CardTitle>
        </CardHeader>
        <CardContent>
          <SpaceMap
            spaces={spaces}
            selectedSpaces={selectedSpaces}
            onSpaceToggle={handleSpaceToggle}
            disabled={createReservation.isPending}
          />

          <div className="mt-6 flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/trips')}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReserve}
              disabled={selectedSpaces.length === 0 || createReservation.isPending}
            >
              {createReservation.isPending ? 'Reservando...' : 'Confirmar Reserva'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
