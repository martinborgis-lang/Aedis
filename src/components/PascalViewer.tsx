'use client'

interface PascalViewerProps {
  height?: string
}

export default function PascalViewer({ height = '600px' }: PascalViewerProps) {
  return (
    <div
      style={{ height, width: '100%' }}
      className="rounded-lg overflow-hidden border border-gray-200"
    >
      <iframe
        src="https://editor.pascal.app"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Éditeur 3D Pascal"
        allow="accelerometer; gyroscope"
      />
    </div>
  )
}