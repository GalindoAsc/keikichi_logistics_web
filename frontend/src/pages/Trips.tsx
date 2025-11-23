import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { TripList } from '@/components/trips/TripList'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useTrips } from '@/hooks/useTrips'
import { Search } from 'lucide-react'

export function TripsPage() {
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    departure_date: '',
  })

  const { data: trips, isLoading } = useTrips(filters)

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setFilters({
      origin: '',
      destination: '',
      departure_date: '',
    })
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Viajes Disponibles</h1>
          <p className="text-gray-600 mt-2">
            Encuentra y reserva espacios en nuestros viajes
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Filtrar Viajes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="origin">Origen</Label>
              <Input
                id="origin"
                placeholder="Ciudad de origen"
                value={filters.origin}
                onChange={(e) => handleFilterChange('origin', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="destination">Destino</Label>
              <Input
                id="destination"
                placeholder="Ciudad de destino"
                value={filters.destination}
                onChange={(e) => handleFilterChange('destination', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="departure_date">Fecha de Salida</Label>
              <Input
                id="departure_date"
                type="date"
                value={filters.departure_date}
                onChange={(e) => handleFilterChange('departure_date', e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </div>

        <TripList trips={trips || []} loading={isLoading} />
      </div>
    </Layout>
  )
}
