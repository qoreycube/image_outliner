'use client'

import { useState } from 'react'
import ImageUploader from '@/components/ImageUploader'
import ProcessingOptions from '@/components/ProcessingOptions'
import AdvancedSettings from '@/components/AdvancedSettings'
import PreviewPanel from '@/components/PreviewPanel'

// Use the same interface as PreviewPanel
interface ProcessingResult {
  success: boolean
  originalImage: string
  outlineImage: string
  message: string
  filename: string
  processedAt: string
  settings?: {
    algorithm: string
    intensity: string
    invertColors: boolean
  }
  metadata?: {
    originalWidth: number
    originalHeight: number
  }
}

export default function Home() {
  const [isLoading] = useState(false)
  const [error] = useState<string | null>(null)
  const [processedResult, setProcessedResult] = useState<ProcessingResult | null>(null)
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  
  // Processing options state
  const [algorithm, setAlgorithm] = useState('edge-detection')
  const [intensity, setIntensity] = useState('medium')
  const [invertColors, setInvertColors] = useState(false)
  const [customParams, setCustomParams] = useState<Record<string, string | number | boolean>>({})

  // Reset custom parameters when algorithm changes
  const handleAlgorithmChange = (newAlgorithm: string) => {
    setAlgorithm(newAlgorithm)
    setCustomParams({}) // Reset custom parameters when switching algorithms
  }

  const handleSettingsReset = (settings: {
    algorithm: string
    intensity: string
    invertColors: boolean
    customParams: Record<string, string | number | boolean>
  }) => {
    setAlgorithm(settings.algorithm)
    setIntensity(settings.intensity)
    setInvertColors(settings.invertColors)
    setCustomParams(settings.customParams)
  }

  const handleFileSelect = (file: File | null) => {
    if (file) {
      setSelectedFile(file)
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)
    } else {
      setSelectedFile(null)
      if (preview) {
        URL.revokeObjectURL(preview)
        setPreview(null)
      }
    }
  }

  const downloadImage = (imageData: string, filename: string) => {
    const link = document.createElement('a')
    link.href = imageData
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Image to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {' '}Outline
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform your photos into beautiful line art with advanced edge detection algorithms. 
            Upload an image and watch it become a stunning outline perfect for coloring books, art projects, or digital design.
          </p>
        </header>

        {/* Upload and Processing Section */}
        <section className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Upload Your Image
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Drag and drop or click to select an image (PNG, JPG, up to 10MB)
              </p>
            </div>
            
            <ImageUploader 
              onFileSelect={handleFileSelect}
              isLoading={isLoading}
              selectedFile={selectedFile}
              preview={preview}
            />
            
            <ProcessingOptions
              algorithm={algorithm}
              intensity={intensity}
              invertColors={invertColors}
              onAlgorithmChange={handleAlgorithmChange}
              onIntensityChange={setIntensity}
              onInvertColorsChange={setInvertColors}
              disabled={isLoading}
            />
            
            <AdvancedSettings
              algorithm={algorithm}
              customParams={customParams}
              onParametersChange={setCustomParams}
              disabled={isLoading}
            />
            
            <PreviewPanel
              selectedFile={selectedFile}
              algorithm={algorithm}
              intensity={intensity}
              invertColors={invertColors}
              customParams={customParams}
              onPreviewUpdate={setProcessedResult}
              onSettingsReset={handleSettingsReset}
            />
            
            {selectedFile && processedResult && (
              <div className="mt-6">
                <button
                  onClick={() => downloadImage(processedResult.outlineImage, processedResult.filename)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download Result</span>
                  </div>
                </button>
              </div>
            )}
            
            {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
