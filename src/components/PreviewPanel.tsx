'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Define the result type locally since we don't have a shared interface
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

// Simple debounce implementation
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null
  
  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T & { cancel: () => void }
  
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }
  
  return debounced
}

interface PreviewPanelProps {
  selectedFile: File | null
  algorithm: string
  intensity: string
  invertColors: boolean
  customParams: Record<string, string | number | boolean>
  onPreviewUpdate?: (result: ProcessingResult) => void
  onSettingsReset: (settings: {
    algorithm: string
    intensity: string
    invertColors: boolean
    customParams: Record<string, string | number | boolean>
  }) => void
}

export default function PreviewPanel({
  selectedFile,
  algorithm,
  intensity,
  invertColors,
  customParams,
  onPreviewUpdate,
  onSettingsReset
}: PreviewPanelProps) {
  const [previewResult, setPreviewResult] = useState<ProcessingResult | null>(null)
  const [originalPreview, setOriginalPreview] = useState<ProcessingResult | null>(null)
  const [baselineSettings, setBaselineSettings] = useState<{
    algorithm: string
    intensity: string
    invertColors: boolean
    customParams: Record<string, string | number | boolean>
  } | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [hasChangedFromOriginal, setHasChangedFromOriginal] = useState(false)
  const [initialAlgorithm, setInitialAlgorithm] = useState<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)

  // Helper function to open image in new window
  const openImageInNewWindow = (imageUrl: string, title: string) => {
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              background: #f0f0f0; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh;
              font-family: system-ui, -apple-system, sans-serif;
            }
            img { 
              max-width: 100%; 
              max-height: 100vh; 
              object-fit: contain; 
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              border-radius: 8px;
              background: white;
            }
            .title {
              position: fixed;
              top: 20px;
              left: 20px;
              background: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 8px 12px;
              border-radius: 4px;
              font-size: 14px;
              z-index: 1000;
            }
          </style>
        </head>
        <body>
          <div class="title">${title}</div>
          <img src="${imageUrl}" alt="${title}" />
        </body>
        </html>
      `)
      newWindow.document.close()
    }
  }

  // Debounced function to update preview
  const debouncedPreviewUpdate = useCallback(
    debounce(async () => {
      if (!selectedFile) return

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller for this request
      const controller = new AbortController()
      abortControllerRef.current = controller

      setIsPreviewLoading(true)
      setPreviewError(null)

      try {
        const formData = new FormData()
        formData.append('image', selectedFile)
        formData.append('algorithm', algorithm)
        formData.append('intensity', intensity)
        formData.append('invertColors', invertColors.toString())
        
        // Add custom parameters if any are set
        if (Object.keys(customParams).length > 0) {
          formData.append('customParams', JSON.stringify(customParams))
        }

        const response = await fetch('/api/outliner', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to process image')
        }

        const data = await response.json()
        setPreviewResult(data)
        
        // Store the first preview as the original for comparison
        if (!originalPreview && Object.keys(customParams).length === 0 && !initialAlgorithm) {
          setOriginalPreview(data)
          setInitialAlgorithm(algorithm)
          setHasChangedFromOriginal(false)
          // Store the baseline settings
          setBaselineSettings({
            algorithm,
            intensity,
            invertColors,
            customParams: { ...customParams }
          })
        } else if (originalPreview) {
          // Check if we have meaningful changes from the original
          const hasCustomParams = Object.keys(customParams).length > 0
          const intensityChanged = data.settings?.intensity !== originalPreview.settings?.intensity
          const invertChanged = data.settings?.invertColors !== originalPreview.settings?.invertColors
          const algorithmChanged = algorithm !== initialAlgorithm
          setHasChangedFromOriginal(hasCustomParams || intensityChanged || invertChanged || algorithmChanged)
        }
        
        onPreviewUpdate?.(data)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was aborted, ignore
          return
        }
        setPreviewError(err instanceof Error ? err.message : 'Preview failed')
      } finally {
        setIsPreviewLoading(false)
      }
    }, 300), // 300ms delay to avoid too many API calls
    [selectedFile, algorithm, intensity, invertColors, customParams, onPreviewUpdate]
  )

  // Update preview when parameters change
  useEffect(() => {
    if (selectedFile) {
      debouncedPreviewUpdate()
    }

    // Cleanup function to cancel debounced calls
    return () => {
      debouncedPreviewUpdate.cancel()
    }
  }, [selectedFile, algorithm, intensity, invertColors, customParams, debouncedPreviewUpdate])

  // Reset original preview when file changes, but preserve on algorithm change
  useEffect(() => {
    if (selectedFile) {
      // Only reset everything when the file changes, not when algorithm changes
      setOriginalPreview(null)
      setPreviewResult(null)
      setBaselineSettings(null)
      setHasChangedFromOriginal(false)
      setShowComparison(false)
      setInitialAlgorithm('')
    }
  }, [selectedFile])

  // Handle algorithm changes separately - don't reset the original preview
  useEffect(() => {
    if (originalPreview && initialAlgorithm && algorithm !== initialAlgorithm) {
      setHasChangedFromOriginal(true)
    }
  }, [algorithm, originalPreview, initialAlgorithm])

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  if (!selectedFile) {
    return (
      <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Live Preview</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload an image to see live preview as you adjust settings
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Live Preview
          </h3>
          {hasChangedFromOriginal && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Modified
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {originalPreview && previewResult && (
            <>
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  showComparison
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {showComparison ? 'Hide Comparison' : 'Compare with Baseline'}
              </button>
              {baselineSettings && hasChangedFromOriginal && onSettingsReset && (
                <button
                  onClick={() => {
                    onSettingsReset(baselineSettings)
                  }}
                  className="px-3 py-1 text-xs font-medium rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
                  title="Reset all settings to baseline values"
                >
                  Reset to Baseline
                </button>
              )}
              {hasChangedFromOriginal && (
                <button
                  onClick={() => {
                    setOriginalPreview(previewResult)
                    setInitialAlgorithm(algorithm)
                    setHasChangedFromOriginal(false)
                    // Update baseline settings to current settings
                    setBaselineSettings({
                      algorithm,
                      intensity,
                      invertColors,
                      customParams: { ...customParams }
                    })
                    // Keep comparison mode active to show the result
                  }}
                  className="px-3 py-1 text-xs font-medium rounded-md bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                  title="Set current preview as new baseline for comparison"
                >
                  Set as New Baseline
                </button>
              )}
            </>
          )}
          {isPreviewLoading && (
            <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          )}
        </div>
      </div>

      {previewError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">
            Preview Error: {previewError}
          </p>
        </div>
      )}

      <div className={`grid gap-4 ${showComparison ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {/* Original Image */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Original</h4>
          <div 
            className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden aspect-square cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
            onClick={() => openImageInNewWindow(URL.createObjectURL(selectedFile), 'Original Image')}
            title="Click to view full size"
          >
            <img 
              src={URL.createObjectURL(selectedFile)}
              alt="Original"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
              <div className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View
              </div>
            </div>
          </div>
        </div>

        {/* Original Preview (when comparison is enabled) */}
        {showComparison && originalPreview && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Baseline ({originalPreview.settings?.algorithm.replace('-', ' ')})
            </h4>
            <div 
              className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden aspect-square cursor-pointer hover:ring-2 hover:ring-green-500 transition-all"
              onClick={() => openImageInNewWindow(originalPreview.outlineImage, `Baseline - ${originalPreview.settings?.algorithm.replace('-', ' ')}`)}
              title="Click to view full size"
            >
              <img 
                src={originalPreview.outlineImage}
                alt="Baseline Preview"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 right-2">
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                  Baseline
                </span>
              </div>
              <div className="absolute bottom-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                <div className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                  <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Preview - Always show when we have a preview result */}
        {previewResult && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {showComparison ? 'Current Preview' : `Preview (${algorithm.replace('-', ' ')})`}
            </h4>
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden aspect-square">
              {isPreviewLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-gray-500 mt-2">Processing...</p>
                  </div>
                </div>
              ) : previewResult?.outlineImage ? (
                <div 
                  className="w-full h-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all rounded-lg overflow-hidden"
                  onClick={() => openImageInNewWindow(previewResult.outlineImage, `${algorithm.replace('-', ' ')} - ${intensity}`)}
                  title="Click to view full size"
                >
                  <img 
                    src={previewResult.outlineImage}
                    alt="Current Preview"
                    className="w-full h-full object-contain"
                  />
                  {showComparison && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Current
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                      <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p className="text-sm">No preview available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading placeholder when no preview yet */}
        {!previewResult && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Preview ({algorithm.replace('-', ' ')})
            </h4>
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden aspect-square">
              {isPreviewLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-gray-500 mt-2">Processing...</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p className="text-sm">No preview available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Download Button - positioned below the images */}
      {previewResult?.outlineImage && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => {
              const link = document.createElement('a')
              link.href = previewResult.outlineImage
              link.download = previewResult.filename || 'outline-result.png'
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Result
          </button>
        </div>
      )}

      {previewResult && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div className="flex justify-between items-start">
            <div>
              <p>Algorithm: {previewResult.settings?.algorithm} ({previewResult.settings?.intensity})</p>
              <p>Size: {previewResult.metadata?.originalWidth}×{previewResult.metadata?.originalHeight}</p>
              {Object.keys(customParams).length > 0 && (
                <p>Custom parameters: {Object.entries(customParams).map(([key, value]) => `${key}=${value}`).join(', ')}</p>
              )}
            </div>
            {showComparison && originalPreview && (
              <div className="text-right">
                <p className="font-medium text-gray-600 dark:text-gray-300">Comparison Active</p>
                <p>Baseline: {originalPreview.settings?.algorithm} ({originalPreview.settings?.intensity})</p>
                <p>Current: {previewResult.settings?.algorithm} ({previewResult.settings?.intensity})</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
