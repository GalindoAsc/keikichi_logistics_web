import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useCreateTrip } from '@/hooks/useTrips'
import { toast } from 'sonner'
import type { CreateTripData } from '@/types'

interface TripFormProps {
  onSuccess?: () => void
}

export function TripForm({ onSuccess }: TripFormProps) {
  const [formData, setFormData] = useState<CreateTripData>({
    origin: '',
    destination: '',
    departure_date: '',
    departure_time: '',
    total_spaces: 0,
    notes_admin: '',
    notes_client: '',
  })

  const createTrip = useCreateTrip()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createTrip.mutateAsync(formData)
      toast.success('Viaje creado exitosamente')
      setFormData({
        origin: '',
        destination: '',
        departure_date: '',
        departure_time: '',
        total_spaces: 0,
        notes_admin: '',
        notes_client: '',
      })
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al crear el viaje')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nuevo Viaje</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="origin">Origen *</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="destination">Destino *</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="departure_date">Fecha de Salida *</Label>
              <Input
                id="departure_date"
                type="date"
                value={formData.departure_date}
                onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="departure_time">Hora de Salida</Label>
              <Input
                id="departure_time"
                type="time"
                value={formData.departure_time}
                onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="total_spaces">Total de Espacios *</Label>
              <Input
                id="total_spaces"
                type="number"
                min="1"
                value={formData.total_spaces || ''}
                onChange={(e) => setFormData({ ...formData, total_spaces: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes_client">Notas para Clientes</Label>
            <textarea
              id="notes_client"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.notes_client}
              onChange={(e) => setFormData({ ...formData, notes_client: e.target.value })}
              placeholder="Información visible para los clientes"
            />
          </div>

          <div>
            <Label htmlFor="notes_admin">Notas Internas (Admin)</Label>
            <textarea
              id="notes_admin"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.notes_admin}
              onChange={(e) => setFormData({ ...formData, notes_admin: e.target.value })}
              placeholder="Notas internas solo visibles para administradores"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={createTrip.isPending}>
              {createTrip.isPending ? 'Creando...' : 'Crear Viaje'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
