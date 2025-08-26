'use client'

interface ProcessingOptionsProps {
  algorithm: string
  intensity: string
  invertColors: boolean
  onAlgorithmChange: (algorithm: string) => void
  onIntensityChange: (intensity: string) => void
  onInvertColorsChange: (invert: boolean) => void
  disabled?: boolean
}

export default function ProcessingOptions({
  algorithm,
  intensity,
  invertColors,
  onAlgorithmChange,
  onIntensityChange,
  onInvertColorsChange,
  disabled = false
}: ProcessingOptionsProps) {
  return (
    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Processing Options
      </h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Algorithm Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Conversion Algorithm
          </label>
          <select
            value={algorithm}
            onChange={(e) => onAlgorithmChange(e.target.value)}
            disabled={disabled}
            className="w-full p-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-no-repeat custom-select"
          >
            <option value="edge-detection">Edge Detection</option>
            <option value="portrait-optimized">Portrait Optimized</option>
            <option value="high-contrast">High Contrast</option>
            <option value="artistic">Artistic</option>
            <option value="ai-edge-detection">AI Edge Detection</option>
            <option value="coloring-xdog">Coloring Book (XDoG)</option>
            <option value="coloring-hf">Coloring Book (HF)</option>
            <option value="svg-vector-trace">SVG Vector Tracing</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {algorithm === 'edge-detection' && 'Sophisticated edge detection with Sobel filters and morphological operations'}
            {algorithm === 'portrait-optimized' && 'Optimized for faces and portraits with enhanced facial feature detection'}
            {algorithm === 'high-contrast' && 'Bold, high-contrast outlines'}
            {algorithm === 'artistic' && 'Stylized, artistic interpretation'}
            {algorithm === 'ai-edge-detection' && 'Advanced AI-powered Canny edge detection with configurable thresholds and blur'}
            {algorithm === 'coloring-xdog' && 'eXtended Difference of Gaussians (XDoG) for clean, deterministic coloring-book outlines'}
            {algorithm === 'coloring-hf' && 'Local coloring-book generator using quantization and edge detection'}
            {algorithm === 'svg-vector-trace' && 'Convert to black & white then vector-trace to an SVG (scalable vector outline)'}
          </p>
        </div>

        {/* Intensity Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Processing Intensity
          </label>
          <select
            value={intensity}
            onChange={(e) => onIntensityChange(e.target.value)}
            disabled={disabled}
            className="w-full p-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-no-repeat custom-select"
          >
            <option value="light">Light</option>
            <option value="medium">Medium</option>
            <option value="strong">Strong</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {intensity === 'light' && 'Subtle processing, preserves detail'}
            {intensity === 'medium' && 'Balanced processing for most images'}
            {intensity === 'strong' && 'Aggressive processing, bold results'}
          </p>
        </div>
      </div>

      {/* Invert Colors Option */}
      <div className="mt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={invertColors}
            onChange={(e) => onInvertColorsChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Invert colors (white lines on black background)
          </span>
        </label>
      </div>
      
      <style jsx>{`
        /* Custom select styling with proper chevron positioning */
        .custom-select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
          background-position: right 8px center;
          background-size: 16px 16px;
        }
        
        /* Dark mode chevron */
        :global(.dark) .custom-select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  )
}
