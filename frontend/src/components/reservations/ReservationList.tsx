import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Package, Upload, CreditCard } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Reservation } from '@/types'

interface ReservationListProps {
  reservations: Reservation[]
  onUploadReceipt?: (reservationId: string) => void
  onViewBankDetails?: (reservationId: string) => void
  onCancel?: (reservationId: string) => void
}

export function ReservationList({
  reservations,
  onUploadReceipt,
  onViewBankDetails,
  onCancel,
}: ReservationListProps) {
  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Confirmed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg">No tienes reservas aún</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reservations.map((reservation) => (
        <Card key={reservation.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Reserva #{reservation.id.slice(0, 8)}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  {formatDate(reservation.created_at)}
                </p>
              </div>
              <Badge className={statusColors[reservation.status]}>
                {reservation.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Espacios reservados:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {reservation.spaces.map((space) => (
                  <span
                    key={space.id}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium"
                  >
                    #{space.space_number}
                  </span>
                ))}
              </div>
            </div>

            {reservation.payment_receipt_url && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Upload className="h-4 w-4" />
                <span>Comprobante de pago subido</span>
              </div>
            )}

            {reservation.status === 'Pending' && (
              <div className="flex gap-2 flex-wrap">
                {onViewBankDetails && !reservation.bank_details_shown && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewBankDetails(reservation.id)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Ver Datos Bancarios
                  </Button>
                )}

                {onUploadReceipt && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUploadReceipt(reservation.id)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {reservation.payment_receipt_url ? 'Cambiar' : 'Subir'} Comprobante
                  </Button>
                )}

                {onCancel && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onCancel(reservation.id)}
                  >
                    Cancelar Reserva
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
