import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/components/admin/Dashboard'

export function AdminDashboard() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600 mt-2">
            Vista general del sistema de logística
          </p>
        </div>

        <Dashboard />
      </div>
    </Layout>
  )
}
