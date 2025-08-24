'use client'

import { useState, useEffect } from 'react'

interface AdvancedSettingsProps {
  algorithm: string
  customParams: Record<string, string | number>
  onParametersChange: (params: Record<string, string | number>) => void
  disabled?: boolean
}

interface SelectOption {
  value: string
  label: string
}

interface SliderConfig {
  key: string
  label: string
  type?: 'slider' | 'select' | 'text'
  min?: number
  max?: number
  step?: number
  options?: SelectOption[]
  defaultValue: number | string
  description: string
}

export default function AdvancedSettings({
  algorithm,
  customParams,
  onParametersChange,
  disabled = false
}: AdvancedSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [parameters, setParameters] = useState<Record<string, string | number>>(customParams || {})

  // Define sliders for each algorithm
  const getSliderConfigs = (): SliderConfig[] => {
    switch (algorithm) {
      case 'edge-detection':
        return [
          { key: 'preBlur', label: 'Pre-Blur', min: 0.3, max: 2, step: 0.1, defaultValue: 0.3, description: 'Initial blur for noise reduction' },
          { key: 'sharpen', label: 'Sharpen', min: 1, max: 10, step: 0.5, defaultValue: 4, description: 'Edge enhancement strength' },
          { key: 'threshold', label: 'Threshold', min: 5, max: 50, step: 2, defaultValue: 18, description: 'Primary edge detection threshold' },
          { key: 'edgeThreshold', label: 'Edge Threshold', min: 2, max: 25, step: 1, defaultValue: 9, description: 'Final edge threshold' },
          { key: 'morphology', label: 'Morphology', min: 1, max: 8, step: 1, defaultValue: 3, description: 'Line thickness and cleanup' }
        ]
      case 'portrait-optimized':
        return [
          { key: 'gamma', label: 'Gamma', min: 1.0, max: 3.0, step: 0.1, defaultValue: 1.6, description: 'Midtone enhancement for skin tones' },
          { key: 'contrast', label: 'Contrast', min: 1.0, max: 3.0, step: 0.1, defaultValue: 1.5, description: 'Contrast modulation strength' },
          { key: 'sharpen', label: 'Sharpen', min: 1, max: 10, step: 0.5, defaultValue: 4, description: 'Facial feature enhancement' },
          { key: 'threshold', label: 'Threshold', min: 10, max: 80, step: 5, defaultValue: 30, description: 'Edge detection sensitivity' },
          { key: 'edgeStrength', label: 'Edge Strength', min: 3, max: 15, step: 1, defaultValue: 8, description: 'Edge detection kernel strength' }
        ]
      case 'high-contrast':
        return [
          { key: 'gamma', label: 'Gamma', min: 1.0, max: 5.0, step: 0.1, defaultValue: 2.2, description: 'Gamma correction strength' },
          { key: 'sharpen', label: 'Sharpen', min: 0, max: 8, step: 0.5, defaultValue: 2, description: 'Edge sharpening' }
        ]
      case 'ai-edge-detection':
        return [
          { key: 'low_threshold', label: 'Low Threshold', min: 10, max: 90, step: 5, defaultValue: 50, description: 'Lower threshold for Canny edge detection' },
          { key: 'high_threshold', label: 'High Threshold', min: 100, max: 300, step: 10, defaultValue: 150, description: 'Upper threshold for Canny edge detection' },
          { key: 'blur_kernel', label: 'Blur Kernel', min: 1, max: 15, step: 2, defaultValue: 5, description: 'Gaussian blur kernel size (must be odd)' }
        ]
      case 'coloring-xdog':
        return [
          { key: 'resize_max', label: 'Resize Max', min: 256, max: 4096, step: 64, defaultValue: 1024, description: 'Max image dimension to resize for processing' },
          { key: 'bilateral_d', label: 'Bilateral Diameter', min: 1, max: 25, step: 1, defaultValue: 9, description: 'Diameter for bilateral filter (edge-preserving)' },
          { key: 'bilateral_sigma_color', label: 'Bilateral Sigma Color', min: 1, max: 200, step: 1, defaultValue: 75, description: 'Bilateral filter sigmaColor' },
          { key: 'bilateral_sigma_space', label: 'Bilateral Sigma Space', min: 1, max: 200, step: 1, defaultValue: 75, description: 'Bilateral filter sigmaSpace' },
          { key: 'k_clusters', label: 'Color Clusters', min: 2, max: 12, step: 1, defaultValue: 6, description: 'Number of color clusters for quantization' },
          { key: 'canny_low', label: 'Canny Low', min: 1, max: 200, step: 1, defaultValue: 50, description: 'Canny low threshold' },
          { key: 'canny_high', label: 'Canny High', min: 50, max: 500, step: 1, defaultValue: 150, description: 'Canny high threshold' },
          { key: 'line_thickness', label: 'Line Thickness', min: 1, max: 8, step: 1, defaultValue: 2, description: 'Thickness of output lines' },
          { key: 'min_area', label: 'Minimum Area', min: 50, max: 2000, step: 50, defaultValue: 300, description: 'Minimum contour area to draw' }
        ]
      case 'coloring-hf':
        return [
          { key: 'k', label: 'Color Clusters', min: 2, max: 12, step: 1, defaultValue: 6, description: 'Number of color clusters for quantization' },
          { key: 'line_thickness', label: 'Line Thickness', min: 1, max: 5, step: 1, defaultValue: 2, description: 'Thickness of output lines' },
          { key: 'min_area', label: 'Minimum Area', min: 100, max: 1000, step: 50, defaultValue: 300, description: 'Minimum contour area to draw' }
        ]
      case 'artistic':
        return [
          { key: 'blur', label: 'Blur', min: 0.3, max: 3, step: 0.1, defaultValue: 0.8, description: 'Artistic blur effect' }
        ]
      default:
        return []
    }
  }

  const sliderConfigs = getSliderConfigs()

  // Update local parameters when customParams prop changes (e.g., from reset to baseline)
  useEffect(() => {
    setParameters(customParams || {})
  }, [customParams])

  const handleSliderChange = (key: string, value: number | string) => {
    // eslint-disable-next-line prefer-const
    let newParameters = { ...parameters, [key]: value }
    
    // Special validation for AI Edge Detection thresholds (only for numeric values)
    if (algorithm === 'ai-edge-detection' && typeof value === 'number') {
      if (key === 'low_threshold') {
        // If low threshold is being changed, ensure high threshold is higher
        const currentHigh = newParameters.high_threshold ?? 150
        if (typeof currentHigh === 'number' && value >= currentHigh) {
          // Automatically adjust high threshold to be at least 10 units higher
          newParameters.high_threshold = Math.min(300, value + 20)
        }
      } else if (key === 'high_threshold') {
        // If high threshold is being changed, ensure low threshold is lower
        const currentLow = newParameters.low_threshold ?? 50
        if (typeof currentLow === 'number' && value <= currentLow) {
          // Automatically adjust low threshold to be at least 10 units lower
          newParameters.low_threshold = Math.max(10, value - 20)
        }
      }
    }
    
    setParameters(newParameters)
    onParametersChange(newParameters)
  }

  const resetToDefaults = () => {
    const defaults: Record<string, string | number> = {}
    sliderConfigs.forEach(config => {
      defaults[config.key] = config.defaultValue
    })
    
    // Ensure AI Edge Detection thresholds are valid
    if (algorithm === 'ai-edge-detection') {
      const lowThreshold = defaults.low_threshold
      const highThreshold = defaults.high_threshold
      if (typeof lowThreshold === 'number' && typeof highThreshold === 'number' && lowThreshold >= highThreshold) {
        defaults.low_threshold = 50
        defaults.high_threshold = 150
      }
    }
    
    setParameters(defaults)
    onParametersChange(defaults)
  }

  const getCurrentValue = (config: SliderConfig) => {
    return parameters[config.key] ?? config.defaultValue
  }

  if (sliderConfigs.length === 0) {
    return null
  }

  return (
    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="flex items-center justify-between w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
          Advanced Settings
        </h4>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="mt-3 space-y-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Fine-tune the {algorithm.replace('-', ' ')} algorithm parameters
            </p>
            <button
              onClick={resetToDefaults}
              disabled={disabled}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
          
          <div className="grid gap-2">
            {sliderConfigs.map((config) => (
              <div key={config.key} className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {config.label}
                  </label>
                  {config.type === 'select' || config.type === 'text' ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-right min-w-[2.5rem]">
                      {getCurrentValue(config)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-right min-w-[2.5rem]">
                      {Number(getCurrentValue(config)).toFixed(1)}
                    </span>
                  )}
                </div>
                {config.type === 'select' ? (
                  <select
                    value={getCurrentValue(config)}
                    onChange={(e) => handleSliderChange(config.key, e.target.value)}
                    disabled={disabled}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {config.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : config.type === 'text' ? (
                  <input
                    type="text"
                    value={getCurrentValue(config)}
                    onChange={(e) => handleSliderChange(config.key, e.target.value)}
                    disabled={disabled}
                    placeholder={config.description}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                ) : (
                  <input
                    type="range"
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={getCurrentValue(config)}
                    onChange={(e) => handleSliderChange(config.key, parseFloat(e.target.value))}
                    disabled={disabled}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed slider"
                  />
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  {config.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 1px solid white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 1px solid white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  )
}
