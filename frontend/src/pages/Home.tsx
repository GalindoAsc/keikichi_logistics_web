import { Link } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { Truck, Calendar, Package, BarChart3 } from 'lucide-react'

export function Home() {
  const { user, isAdmin } = useAuth()

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user?.full_name}
          </h1>
          <p className="text-gray-600 mt-2">
            Sistema de gestión logística de Keikichi
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isAdmin ? (
            <>
              <Link to="/admin">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <BarChart3 className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Dashboard</CardTitle>
                    <CardDescription>
                      Ver estadísticas y métricas del sistema
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/admin/trips">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Truck className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Gestionar Viajes</CardTitle>
                    <CardDescription>
                      Crear y administrar viajes y espacios
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/admin/reservations">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Calendar className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Reservas</CardTitle>
                    <CardDescription>
                      Ver y gestionar todas las reservas
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </>
          ) : (
            <>
              <Link to="/trips">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Truck className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Viajes Disponibles</CardTitle>
                    <CardDescription>
                      Explora y reserva espacios en nuestros viajes
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/my-reservations">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Calendar className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Mis Reservas</CardTitle>
                    <CardDescription>
                      Gestiona tus reservas activas
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <Package className="h-10 w-10 text-blue-600 mb-2" />
                  <CardTitle className="text-blue-900">¿Cómo funciona?</CardTitle>
                  <CardContent className="p-0 mt-2">
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Selecciona un viaje disponible</li>
                      <li>Elige los espacios que necesitas</li>
                      <li>Realiza tu reserva</li>
                      <li>Sube el comprobante de pago</li>
                    </ol>
                  </CardContent>
                </CardHeader>
              </Card>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
