'use client'

import { useEffect } from 'react'
import { Viewer } from '@pascal-app/viewer'
import { useScene } from '@pascal-app/core'

interface Props {
  sceneData: Record<string, unknown>
}

export default function PascalViewerInner({ sceneData }: Props) {
  useEffect(() => {
    const scene = useScene.getState()
    scene.clearScene()

    const nodes = (sceneData.nodes ?? {}) as Parameters<typeof scene.setScene>[0]
    const rootNodeIds = (sceneData.rootNodeIds ?? []) as Parameters<typeof scene.setScene>[1]
    scene.setScene(nodes, rootNodeIds)
  }, [sceneData])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Viewer />
    </div>
  )
}
