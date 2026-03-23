'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Trash2 } from 'lucide-react'

interface ModelUploadProps {
  projectId: string
  currentModelUrl: string | null
  onUploadSuccess: (url: string) => void
  onDelete: () => void
}

export default function ModelUpload({
  projectId,
  currentModelUrl,
  onUploadSuccess,
  onDelete,
}: ModelUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Format invalide. Exportez votre projet depuis editor.pascal.app au format JSON.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 10 Mo)')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const text = await file.text()
      const json = JSON.parse(text)

      if (!json.nodes && !json.rootNodeIds) {
        setError('Ce fichier ne semble pas être un projet Pascal Editor valide.')
        setUploading(false)
        return
      }

      const filename = `${projectId}/model_${Date.now()}.json`
      const { error: uploadError } = await supabase.storage
        .from('models')
        .upload(filename, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('models')
        .getPublicUrl(filename)

      await supabase
        .from('projects')
        .update({ model_url: publicUrl })
        .eq('id', projectId)

      onUploadSuccess(publicUrl)
    } catch (err) {
      setError("Erreur lors de l'upload. Réessayez.")
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer la maquette 3D ?')) return

    await supabase
      .from('projects')
      .update({ model_url: null })
      .eq('id', projectId)

    onDelete()
  }

  return (
    <div className="space-y-4">
      {!currentModelUrl ? (
        <div>
          <label
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
          >
            <div className="text-center">
              <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">
                Glissez votre fichier Pascal (.json)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Exportez depuis{' '}
                <span className="text-orange-500 underline">
                  editor.pascal.app
                </span>
              </p>
            </div>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              disabled={uploading}
            />
          </label>
          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}
          {uploading && (
            <p className="text-sm text-gray-500 mt-2">Upload en cours...</p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-sm">&#10003;</span>
            <span className="text-sm text-green-700">
              Maquette 3D chargée
            </span>
          </div>
          <div className="flex gap-3">
            <label className="text-xs text-orange-500 cursor-pointer hover:underline">
              Remplacer
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
            </label>
            <button
              onClick={handleDelete}
              className="text-xs text-red-500 hover:underline flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
