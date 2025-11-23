import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Package, Truck, Calendar, Users, TrendingUp } from 'lucide-react'

export function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
  })

  if (isLoading) {
    return <div className="text-center py-12">Cargando estadísticas...</div>
  }

  const statCards = [
    {
      title: 'Total de Viajes',
      value: stats?.total_trips || 0,
      icon: Truck,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Viajes Activos',
      value: stats?.active_trips || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Total Reservas',
      value: stats?.total_reservations || 0,
      icon: Calendar,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      title: 'Reservas Pendientes',
      value: stats?.pending_reservations || 0,
      icon: Calendar,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      title: 'Reservas Confirmadas',
      value: stats?.confirmed_reservations || 0,
      icon: Calendar,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Total Usuarios',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      title: 'Total Espacios',
      value: stats?.total_spaces || 0,
      icon: Package,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
    },
    {
      title: 'Espacios Disponibles',
      value: stats?.available_spaces || 0,
      icon: Package,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Tasa de Ocupación',
      value: `${stats?.occupancy_rate || 0}%`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Estadísticas del Sistema</h2>
        <p className="text-gray-600 mt-1">Vista general de la plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
