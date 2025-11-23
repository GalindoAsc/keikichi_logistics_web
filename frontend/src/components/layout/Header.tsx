import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b bg-white">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-primary">Keikichi Logistics</h1>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                <div className="text-sm">
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
