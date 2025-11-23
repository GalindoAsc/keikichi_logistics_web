import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ReservationList } from '@/components/reservations/ReservationList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useMyReservations, useCancelReservation, useUploadReceipt, useBankDetails } from '@/hooks/useReservations'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'

export function MyReservationsPage() {
  const { data: reservations, isLoading } = useMyReservations()
  const cancelReservation = useCancelReservation()
  const uploadReceipt = useUploadReceipt()
  const { refetch: fetchBankDetails } = useBankDetails('')
  const [showUpload, setShowUpload] = useState<string | null>(null)
  const [showBankDetails, setShowBankDetails] = useState<string | null>(null)
  const [bankDetails, setBankDetails] = useState<any>(null)

  const handleUploadReceipt = (reservationId: string) => {
    setShowUpload(reservationId)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, reservationId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await uploadReceipt.mutateAsync({ reservationId, file })
      toast.success('Comprobante subido exitosamente')
      setShowUpload(null)
    } catch (error) {
      toast.error('Error al subir el comprobante')
    }
  }

  const handleViewBankDetails = async (reservationId: string) => {
    try {
      const details = await fetchBankDetails()
      setBankDetails(details.data)
      setShowBankDetails(reservationId)
    } catch (error) {
      toast.error('Error al obtener los datos bancarios')
    }
  }

  const handleCopyBankDetails = () => {
    if (!bankDetails) return

    const text = `
Banco: ${bankDetails.bank_name}
Titular: ${bankDetails.account_holder}
Número de Cuenta: ${bankDetails.account_number}
Código de Routing: ${bankDetails.routing_number}
    `.trim()

    navigator.clipboard.writeText(text)
    toast.success('Datos bancarios copiados al portapapeles')
  }

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) return

    try {
      await cancelReservation.mutateAsync(reservationId)
      toast.success('Reserva cancelada exitosamente')
    } catch (error) {
      toast.error('Error al cancelar la reserva')
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Mis Reservas</h1>
          <p className="text-gray-600 mt-2">
            Gestiona tus reservas activas y pasadas
          </p>
        </div>

        {showBankDetails && bankDetails && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Datos Bancarios para Pago</CardTitle>
                <Button size="sm" variant="outline" onClick={handleCopyBankDetails}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Banco:</span> {bankDetails.bank_name}
              </div>
              <div>
                <span className="font-medium">Titular:</span> {bankDetails.account_holder}
              </div>
              <div>
                <span className="font-medium">Número de Cuenta:</span> {bankDetails.account_number}
              </div>
              <div>
                <span className="font-medium">Código de Routing:</span> {bankDetails.routing_number}
              </div>
            </CardContent>
          </Card>
        )}

        {showUpload && (
          <Card>
            <CardHeader>
              <CardTitle>Subir Comprobante de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="receipt">Selecciona el archivo (JPG, PNG o PDF)</Label>
                  <Input
                    id="receipt"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileChange(e, showUpload)}
                  />
                </div>
                <Button variant="outline" onClick={() => setShowUpload(null)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <ReservationList
          reservations={reservations || []}
          onUploadReceipt={handleUploadReceipt}
          onViewBankDetails={handleViewBankDetails}
          onCancel={handleCancelReservation}
        />
      </div>
    </Layout>
  )
}
