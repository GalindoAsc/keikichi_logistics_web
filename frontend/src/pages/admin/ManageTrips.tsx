import { Layout } from '@/components/layout/Layout'
import { TripForm } from '@/components/admin/TripForm'
import { TripList } from '@/components/trips/TripList'
import { useTrips } from '@/hooks/useTrips'

export function ManageTrips() {
  const { data: trips, isLoading, refetch } = useTrips()

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestionar Viajes</h1>
          <p className="text-gray-600 mt-2">
            Crea y administra viajes y sus espacios
          </p>
        </div>

        <TripForm onSuccess={() => refetch()} />

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Viajes Existentes</h2>
          <TripList trips={trips || []} loading={isLoading} />
        </div>
      </div>
    </Layout>
  )
}
