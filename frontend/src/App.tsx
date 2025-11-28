import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-2xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🚚 Keikichi Logistics
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Plataforma de Gestión Logística
        </p>

        <div className="mb-8">
          <div className="inline-flex items-center gap-4 bg-gray-50 px-6 py-4 rounded-lg">
            <button
              onClick={() => setCount((count) => count - 1)}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              -
            </button>
            <span className="text-3xl font-mono font-bold text-gray-800 min-w-[60px]">
              {count}
            </span>
            <button
              onClick={() => setCount((count) => count + 1)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-4 text-left bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            ✅ Infraestructura Base Completa
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Monorepo configurado (backend, frontend, infra)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Docker Compose con hot reload</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Variables de entorno configuradas</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>React + TypeScript + Tailwind CSS</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>FastAPI + PostgreSQL</span>
            </li>
          </ul>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Próximo módulo:</strong> Base de Datos (Modelos SQLAlchemy + Migraciones)
            </p>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Frontend: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:5173</code></p>
          <p>Backend API: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:8000</code></p>
          <p>API Docs: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:8000/docs</code></p>
        </div>
      </div>
    </div>
  )
}

export default App
