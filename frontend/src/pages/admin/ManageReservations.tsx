import { Layout } from '@/components/layout/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAllReservations, useUpdateReservation } from '@/hooks/useReservations'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { ReservationStatus } from '@/types'

export function ManageReservations() {
  const { data: reservations, isLoading } = useAllReservations()
  const updateReservation = useUpdateReservation()

  const handleUpdateStatus = async (id: string, status: ReservationStatus) => {
    try {
      await updateReservation.mutateAsync({ id, status })
      toast.success('Estado actualizado exitosamente')
    } catch (error) {
      toast.error('Error al actualizar el estado')
    }
  }

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Confirmed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Cargando reservas...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestionar Reservas</h1>
          <p className="text-gray-600 mt-2">
            Administra todas las reservas del sistema
          </p>
        </div>

        {reservations && reservations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No hay reservas registradas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations?.map((reservation) => (
              <Card key={reservation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Reserva #{reservation.id.slice(0, 8)}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Cliente ID: {reservation.client_id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Creada: {formatDate(reservation.created_at)}
                      </p>
                    </div>
                    <Badge className={statusColors[reservation.status]}>
                      {reservation.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Espacios:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {reservation.spaces.map((space) => (
                        <span
                          key={space.id}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                        >
                          #{space.space_number}
                        </span>
                      ))}
                    </div>
                  </div>

                  {reservation.payment_receipt_url && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Comprobante:</p>
                      <a
                        href={reservation.payment_receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Ver comprobante
                      </a>
                    </div>
                  )}

                  {reservation.status === 'Pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(reservation.id, ReservationStatus.CONFIRMED)}
                        disabled={updateReservation.isPending}
                      >
                        Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateStatus(reservation.id, ReservationStatus.CANCELLED)}
                        disabled={updateReservation.isPending}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
