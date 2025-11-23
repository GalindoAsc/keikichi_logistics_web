import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { Home, Truck, Calendar, LayoutDashboard, Users, Package } from 'lucide-react'

export function Sidebar() {
  const { isAdmin } = useAuth()

  const clientLinks = [
    { to: '/', label: 'Inicio', icon: Home },
    { to: '/trips', label: 'Viajes Disponibles', icon: Truck },
    { to: '/my-reservations', label: 'Mis Reservas', icon: Calendar },
  ]

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/trips', label: 'Gestionar Viajes', icon: Truck },
    { to: '/admin/reservations', label: 'Reservas', icon: Calendar },
    { to: '/admin/users', label: 'Usuarios', icon: Users },
  ]

  const links = isAdmin ? adminLinks : clientLinks

  return (
    <aside className="w-64 border-r bg-gray-50 p-4">
      <nav className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              )
            }
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
