import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Lock, CheckCircle2 } from 'lucide-react'
import type { Space, SpaceStatus } from '@/types'

interface SpaceMapProps {
  spaces: Space[]
  selectedSpaces: string[]
  onSpaceToggle: (spaceId: string) => void
  disabled?: boolean
}

export function SpaceMap({ spaces, selectedSpaces, onSpaceToggle, disabled }: SpaceMapProps) {
  const getSpaceColor = (status: SpaceStatus, isSelected: boolean) => {
    if (isSelected) return 'bg-blue-500 text-white border-blue-600'
    if (status === 'Available') return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 cursor-pointer'
    if (status === 'Reserved') return 'bg-gray-300 text-gray-600 border-gray-400 cursor-not-allowed'
    return 'bg-red-100 text-red-800 border-red-300 cursor-not-allowed'
  }

  const handleSpaceClick = (space: Space) => {
    if (disabled || space.status !== 'Available') return
    onSpaceToggle(space.id)
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 border border-gray-400 rounded" />
          <span>Reservado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded" />
          <span>Seleccionado</span>
        </div>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {spaces.map((space) => {
          const isSelected = selectedSpaces.includes(space.id)
          const isAvailable = space.status === 'Available'

          return (
            <button
              key={space.id}
              onClick={() => handleSpaceClick(space)}
              disabled={!isAvailable || disabled}
              className={cn(
                'relative aspect-square rounded-md border-2 flex items-center justify-center font-semibold text-sm transition-all',
                getSpaceColor(space.status, isSelected)
              )}
              title={`Espacio ${space.space_number} - ${space.status}`}
            >
              <span>{space.space_number}</span>
              {!isAvailable && (
                <Lock className="absolute top-1 right-1 h-3 w-3" />
              )}
              {isSelected && (
                <CheckCircle2 className="absolute top-1 right-1 h-3 w-3" />
              )}
            </button>
          )
        })}
      </div>

      {selectedSpaces.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <p className="font-medium text-blue-900">
            Espacios seleccionados: {selectedSpaces.length}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Números: {spaces
              .filter(s => selectedSpaces.includes(s.id))
              .map(s => s.space_number)
              .sort((a, b) => a - b)
              .join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}
