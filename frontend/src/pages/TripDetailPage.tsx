import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { TripDetail } from '@/components/trips/TripDetail'
import { Button } from '@/components/ui/button'
import { useTrip, useTripSpaces } from '@/hooks/useTrips'
import { ArrowLeft } from 'lucide-react'

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: trip, isLoading: tripLoading } = useTrip(id!)
  const { data: spaces, isLoading: spacesLoading } = useTripSpaces(id!)

  if (tripLoading || spacesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Cargando...</p>
        </div>
      </Layout>
    )
  }

  if (!trip || !spaces) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Viaje no encontrado</p>
          <Button className="mt-4" onClick={() => navigate('/trips')}>
            Volver a Viajes
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/trips')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Viajes
        </Button>

        <TripDetail trip={trip} spaces={spaces} />
      </div>
    </Layout>
  )
}
