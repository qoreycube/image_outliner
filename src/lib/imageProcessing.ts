import sharp from 'sharp'

export interface OutlineOptions {
  algorithm?: 'edge-detection' | 'portrait-optimized' | 'high-contrast' | 'artistic' | 'ai-edge-detection' | 'coloring-xdog' | 'coloring-hf'
  intensity?: 'light' | 'medium' | 'strong'
  invertColors?: boolean
  customParams?: {
    blur?: number
    sharpen?: number
    threshold?: number
    gamma?: number
    contrast?: number
    edgeStrength?: number
    finalThreshold?: number
    preBlur?: number
    edgeThreshold?: number
    morphology?: number
    lineThickness?: number
    // AI Edge Detection parameters
    low_threshold?: number
    high_threshold?: number
    blur_kernel?: number
    // Coloring XDoG parameters
    sigma?: number
    k?: number
    p?: number
    eps?: number
    line_thickness?: number
  // New XDoG/local coloring parameters
  resize_max?: number
  bilateral_d?: number
  bilateral_sigma_color?: number
  bilateral_sigma_space?: number
  k_clusters?: number
  canny_low?: number
  canny_high?: number
  invert_colors?: boolean
    // Coloring HF parameters (updated for local implementation)
    min_area?: number
  }
}

export async function createOutlineAdvancedEdgeDetection(
  imageBuffer: Buffer, 
  options: OutlineOptions = {}
): Promise<Buffer> {
  try {
    const { intensity = 'medium', invertColors = false, customParams } = options

    const settings = {
      light: { 
        preBlur: 0.5, 
        sharpen: 3, 
        threshold: 20, 
        edgeThreshold: 12,
        morphology: 2
      },
      medium: { 
        preBlur: 0.3, 
        sharpen: 4, 
        threshold: 18, 
        edgeThreshold: 9,
        morphology: 3
      },
      strong: { 
        preBlur: 0.2, 
        sharpen: 5, 
        threshold: 15, 
        edgeThreshold: 7,
        morphology: 4
      }
    }
    
    const params = settings[intensity]
    const preBlur = customParams?.preBlur ?? params.preBlur
    const sharpen = customParams?.sharpen ?? params.sharpen
    const threshold = customParams?.threshold ?? params.threshold
    const edgeThreshold = customParams?.edgeThreshold ?? params.edgeThreshold
    const morphology = customParams?.morphology ?? params.morphology

    const preprocessed = await sharp(imageBuffer)
      .grayscale()
      .blur(preBlur)
      .sharpen({ sigma: sharpen })
      .normalize()
      .toBuffer()

    const result = sharp(preprocessed)
      .convolve({
        width: 3,
        height: 3,
        kernel: [
          -1, -2, -1,
          -2, 12, -2,
          -1, -2, -1
        ]
      })
      .threshold(threshold)
      .convolve({
        width: 3,
        height: 3,
        kernel: [
          -1, -1, -1,
          -1,  8, -1,
          -1, -1, -1
        ]
      })
      .threshold(edgeThreshold)

    if (morphology > 0) {
      for (let i = 0; i < morphology; i++) {
        result.convolve({
          width: 3,
          height: 3,
          kernel: [
            1, 1, 1,
            1, 1, 1,
            1, 1, 1
          ]
        })
      }
    }

    if (invertColors) {
      result.negate()
    }

    return result.png().toBuffer()
  } catch (error) {
    console.error('Error in createOutlineAdvancedEdgeDetection:', error)
    throw new Error(`Edge detection processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function createOutlinePortraitOptimized(
  imageBuffer: Buffer, 
  options: OutlineOptions = {}
): Promise<Buffer> {
  try {
    const { intensity = 'medium', invertColors = false, customParams } = options

    const settings = {
      light: { gamma: 1.4, contrast: 1.3, sharpen: 3, threshold: 35, edgeStrength: 6 },
      medium: { gamma: 1.6, contrast: 1.5, sharpen: 4, threshold: 30, edgeStrength: 8 },
      strong: { gamma: 1.8, contrast: 1.7, sharpen: 5, threshold: 25, edgeStrength: 10 }
    }
    
    const params = settings[intensity]
    const gamma = customParams?.gamma ?? params.gamma
    const contrast = customParams?.contrast ?? params.contrast
    const sharpen = customParams?.sharpen ?? params.sharpen
    const threshold = customParams?.threshold ?? params.threshold
    const edgeStrength = customParams?.edgeStrength ?? params.edgeStrength

    const preprocessed = await sharp(imageBuffer)
      .grayscale()
      .gamma(gamma)
      .linear(contrast, 0)
      .sharpen({ sigma: sharpen })
      .toBuffer()

    let result = sharp(preprocessed)
      .convolve({
        width: 3,
        height: 3,
        kernel: Array(9).fill(-1).map((_, i) => i === 4 ? edgeStrength : -1)
      })

    if (threshold > 0) {
      result = result.threshold(threshold)
    }

    if (invertColors) {
      result = result.negate()
    }

    return result.png().toBuffer()
  } catch (error) {
    console.error('Error in createOutlinePortraitOptimized:', error)
    throw new Error(`Portrait processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function createOutlineHighContrast(
  imageBuffer: Buffer, 
  options: OutlineOptions = {}
): Promise<Buffer> {
  try {
    const { intensity = 'medium', invertColors = false, customParams } = options

    const settings = {
      light: { gamma: 1.8, sharpen: 1.5 },
      medium: { gamma: 2.2, sharpen: 2 },
      strong: { gamma: 2.8, sharpen: 3 }
    }
    
    const params = settings[intensity]
    const gamma = customParams?.gamma ?? params.gamma
    const sharpen = customParams?.sharpen ?? params.sharpen

    let result = sharp(imageBuffer)
      .grayscale()
      .gamma(gamma)
      .normalize()

    if (sharpen > 0) {
      result = result.sharpen({ sigma: sharpen })
    }

    if (invertColors) {
      result = result.negate()
    }

    return result.png().toBuffer()
  } catch (error) {
    console.error('Error in createOutlineHighContrast:', error)
    throw new Error(`High contrast processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function createOutlineArtistic(
  imageBuffer: Buffer, 
  options: OutlineOptions = {}
): Promise<Buffer> {
  try {
    const { intensity = 'medium', invertColors = false, customParams } = options

    const settings = {
      light: { blur: 1 },
      medium: { blur: 0.8 },
      strong: { blur: 0.5 }
    }
    
    const params = settings[intensity]
    const blur = customParams?.blur ?? params.blur

    const posterized = await sharp(imageBuffer)
      .grayscale()
      .blur(blur)
      .normalise()
      .toBuffer()

    let result = sharp(posterized)
      .convolve({
        width: 3,
        height: 3,
        kernel: [
          -1, -1, -1,
          -1,  8, -1,
          -1, -1, -1
        ]
      })

    if (invertColors) {
      result = result.negate()
    }

    return result.png().toBuffer()
  } catch (error) {
    console.error('Error in createOutlineArtistic:', error)
    throw new Error(`Artistic processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function createOutlineAIEdgeDetection(
  imageBuffer: Buffer,
  options: OutlineOptions = {}
): Promise<Buffer> {
  try {
    const { intensity = 'medium', invertColors = false, customParams } = options

    const settings = {
      light: {
        low_threshold: 30,
        high_threshold: 100,
        blur_kernel: 7
      },
      medium: {
        low_threshold: 50,
        high_threshold: 150,
        blur_kernel: 5
      },
      strong: {
        low_threshold: 70,
        high_threshold: 200,
        blur_kernel: 3
      }
    }

    const params = settings[intensity]
    const low_threshold = customParams?.low_threshold ?? params.low_threshold
    const high_threshold = customParams?.high_threshold ?? params.high_threshold
    const blur_kernel = customParams?.blur_kernel ?? params.blur_kernel

    const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:9000'
    
    const formData = new FormData()
    const arrayBuffer = imageBuffer.buffer.slice(imageBuffer.byteOffset, imageBuffer.byteOffset + imageBuffer.byteLength) as ArrayBuffer
    const blob = new Blob([arrayBuffer], { type: 'image/jpeg' })
    formData.append('image', blob, 'image.jpg')

    const queryParams = new URLSearchParams({
      low_threshold: low_threshold.toString(),
      high_threshold: high_threshold.toString(),
      blur_kernel: blur_kernel.toString(),
      invert_colors: (customParams?.invert_colors ?? invertColors) ? 'true' : 'false'
    })

    const response = await fetch(`${backendUrl}/outline?${queryParams}`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`AI Edge Detection failed: ${errorText}`)
    }

    const responseArrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(responseArrayBuffer)

    return buffer
  } catch (error) {
    console.error('Error in createOutlineAIEdgeDetection:', error)
    throw new Error(`AI Edge Detection processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function createOutlineColoringXDoG(
  imageBuffer: Buffer,
  options: OutlineOptions = {}
): Promise<Buffer> {
  try {
    const { intensity = 'medium', invertColors = false, customParams } = options

    const settings = {
      light: {
        resize_max: 1024,
        bilateral_d: 9,
        bilateral_sigma_color: 75,
        bilateral_sigma_space: 75,
        k_clusters: 4,
        canny_low: 30,
        canny_high: 100,
        line_thickness: 1,
        min_area: 200
      },
      medium: {
        resize_max: 1024,
        bilateral_d: 9,
        bilateral_sigma_color: 75,
        bilateral_sigma_space: 75,
        k_clusters: 6,
        canny_low: 50,
        canny_high: 150,
        line_thickness: 2,
        min_area: 300
      },
      strong: {
        resize_max: 1200,
        bilateral_d: 11,
        bilateral_sigma_color: 90,
        bilateral_sigma_space: 90,
        k_clusters: 8,
        canny_low: 70,
        canny_high: 200,
        line_thickness: 3,
        min_area: 400
      }
    }

    const params = settings[intensity]
    const resize_max = customParams?.resize_max ?? params.resize_max
    const bilateral_d = customParams?.bilateral_d ?? params.bilateral_d
    const bilateral_sigma_color = customParams?.bilateral_sigma_color ?? params.bilateral_sigma_color
    const bilateral_sigma_space = customParams?.bilateral_sigma_space ?? params.bilateral_sigma_space
    const k_clusters = customParams?.k_clusters ?? params.k_clusters
    const canny_low = customParams?.canny_low ?? params.canny_low
    const canny_high = customParams?.canny_high ?? params.canny_high
    const line_thickness = customParams?.line_thickness ?? params.line_thickness
    const min_area = customParams?.min_area ?? params.min_area

    const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:9000'
    
    const formData = new FormData()
    const inputArrayBuffer = imageBuffer.buffer.slice(imageBuffer.byteOffset, imageBuffer.byteOffset + imageBuffer.byteLength) as ArrayBuffer
    const blob = new Blob([inputArrayBuffer], { type: 'image/jpeg' })
    formData.append('image', blob, 'image.jpg')

  // Add parameters matching service.py
    formData.append('resize_max', resize_max.toString())
    formData.append('bilateral_d', bilateral_d.toString())
    formData.append('bilateral_sigma_color', bilateral_sigma_color.toString())
    formData.append('bilateral_sigma_space', bilateral_sigma_space.toString())
    formData.append('k_clusters', k_clusters.toString())
    formData.append('canny_low', canny_low.toString())
    formData.append('canny_high', canny_high.toString())
    formData.append('line_thickness', line_thickness.toString())
  formData.append('min_area', min_area.toString())
  // Pass invert colors preference (server expects 'invert_colors')
  formData.append('invert_colors', (customParams?.invert_colors ?? invertColors).toString())

  const response = await fetch(`${backendUrl}/coloring_xdog`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Coloring XDoG failed: ${errorText}`)
    }

    const responseArrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(responseArrayBuffer)

    return buffer
  } catch (error) {
    console.error('Error in createOutlineColoringXDoG:', error)
    throw new Error(`Coloring XDoG processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function createOutlineColoringHF(
  imageBuffer: Buffer,
  options: OutlineOptions = {}
): Promise<Buffer> {
  try {
    const { intensity = 'medium', invertColors = false, customParams } = options

    const settings = {
      light: {
        k: 4,
        line_thickness: 1,
        min_area: 200
      },
      medium: {
        k: 6,
        line_thickness: 2,
        min_area: 300
      },
      strong: {
        k: 8,
        line_thickness: 3,
        min_area: 400
      }
    }

    const params = settings[intensity]
    const k = customParams?.k ?? params.k
    const line_thickness = customParams?.line_thickness ?? params.line_thickness
    const min_area = customParams?.min_area ?? params.min_area

    const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:9000'
    
    const formData = new FormData()
    const inputArrayBuffer = imageBuffer.buffer.slice(imageBuffer.byteOffset, imageBuffer.byteOffset + imageBuffer.byteLength) as ArrayBuffer
    const blob = new Blob([inputArrayBuffer], { type: 'image/jpeg' })
    formData.append('image', blob, 'image.jpg')

    // Add parameters
    formData.append('k', k.toString())
    formData.append('line_thickness', line_thickness.toString())
  formData.append('min_area', min_area.toString())
  // Pass invert colors preference
  formData.append('invert_colors', (customParams?.invert_colors ?? invertColors).toString())

    const response = await fetch(`${backendUrl}/coloring_hf`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Coloring HF failed: ${errorText}`)
    }

    const responseArrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(responseArrayBuffer)

    return buffer
  } catch (error) {
    console.error('Error in createOutlineColoringHF:', error)
    throw new Error(`Coloring HF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function createOutline(
  imageBuffer: Buffer, 
  options: OutlineOptions = {}
): Promise<Buffer> {
  const { algorithm = 'edge-detection' } = options

  switch (algorithm) {
    case 'edge-detection':
      return createOutlineAdvancedEdgeDetection(imageBuffer, options)
    case 'portrait-optimized':
      return createOutlinePortraitOptimized(imageBuffer, options)
    case 'high-contrast':
      return createOutlineHighContrast(imageBuffer, options)
    case 'artistic':
      return createOutlineArtistic(imageBuffer, options)
    case 'ai-edge-detection':
      return createOutlineAIEdgeDetection(imageBuffer, options)
    case 'coloring-xdog':
      return createOutlineColoringXDoG(imageBuffer, options)
    case 'coloring-hf':
      return createOutlineColoringHF(imageBuffer, options)
    default:
      return createOutlineAdvancedEdgeDetection(imageBuffer, options)
  }
}
