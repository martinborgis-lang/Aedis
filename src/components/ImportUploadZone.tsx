'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ImportResponse } from '@/lib/import/types'

interface ImportUploadZoneProps {
  onSuccess?: (data: ImportResponse & { originalFilename: string }) => void
}

const LOADING_MESSAGES = [
  "Lecture du document...",
  "Extraction des lots et budgets...",
  "Analyse des délais...",
  "Génération du planning..."
]

export default function ImportUploadZone({ onSuccess }: ImportUploadZoneProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Seuls les fichiers PDF sont acceptés'
    }
    if (file.size > 20 * 1024 * 1024) {
      return 'Le fichier ne doit pas dépasser 20MB'
    }
    return null
  }

  const handleFile = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsUploading(true)
    setError(null)
    setCurrentMessageIndex(0)

    // Rotation des messages toutes les 5 secondes
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 5000)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/projects/import-dpgf', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'analyse du document')
      }

      clearInterval(messageInterval)

      if (onSuccess) {
        onSuccess(data)
      } else {
        // Redirection vers la page de preview avec les données
        sessionStorage.setItem('importData', JSON.stringify(data))
        router.push('/projects/import/preview')
      }
    } catch (err) {
      clearInterval(messageInterval)
      setError(err instanceof Error ? err.message : 'Une erreur inattendue s\'est produite')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (isUploading) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-lg font-medium text-gray-900">
              {LOADING_MESSAGES[currentMessageIndex]}
            </p>
            <p className="text-sm text-gray-500">
              Analyse par IA · ~20 secondes
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto h-16 w-16 text-gray-400">
              <svg fill="currentColor" viewBox="0 0 20 20" className="h-full w-full">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>

            <div>
              <p className="text-xl font-medium text-gray-900 mb-2">
                {isDragActive ? 'Relâchez pour analyser' : 'Glissez votre DPGF ici'}
              </p>
              <p className="text-gray-600 mb-4">
                Aedis analyse automatiquement vos lots, budgets et génère le planning
              </p>
              <p className="text-sm text-gray-500">
                Formats : PDF uniquement · 20MB max
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Analyse par IA · ~20 secondes
              </p>
            </div>

            <button
              type="button"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                handleClick()
              }}
            >
              Ou cliquez pour sélectionner
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">
            {error}
          </p>
        </div>
      )}
    </div>
  )
}