'use client'

import dynamic from 'next/dynamic'

const PascalViewerInner = dynamic(
  () => import('./PascalViewerInner'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-400">
          Chargement de la maquette 3D...
        </div>
      </div>
    )
  }
)

interface PascalViewerProps {
  sceneData: Record<string, unknown> | null
  height?: string
}

export default function PascalViewer({
  sceneData,
  height = '500px',
}: PascalViewerProps) {
  if (!sceneData) return (
    <div
      className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg"
      style={{ height }}
    >
      <p className="text-sm text-gray-400">
        Aucune maquette 3D
      </p>
    </div>
  )

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border border-gray-200">
      <PascalViewerInner sceneData={sceneData} />
    </div>
  )
}
