import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createOutline, OutlineOptions } from '@/lib/imageProcessing'

function _getErrMsg(e: unknown): string {
  try {
    if (e == null) return 'Unknown error'
    if (typeof e === 'string') return e
    try {
      const m = (e as any).message
      if (typeof m === 'string' && m.length > 0) return m
    } catch {
      // ignore
    }
    try {
      const n = (e as any).name
      if (typeof n === 'string' && n.length > 0) return n
    } catch {
      // ignore
    }
    return Object.prototype.toString.call(e)
  } catch {
    return 'Unknown error'
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    // Get optional processing parameters
    let algorithm = formData.get('algorithm') as string || 'edge-detection'
    const intensity = formData.get('intensity') as string || 'medium'
    const invertColors = formData.get('invertColors') === 'true'
    const customParamsString = formData.get('customParams') as string
    
    // Backward compatibility: map old advanced-edge-detection to edge-detection
    if (algorithm === 'advanced-edge-detection') {
      algorithm = 'edge-detection'
    }
    
    let customParams = {}
    if (customParamsString) {
      try {
        customParams = JSON.parse(customParamsString)
      } catch (e) {
        console.warn('Failed to parse custom parameters:', e)
      }
    }
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Validate algorithm parameter
  const validAlgorithms = ['edge-detection', 'portrait-optimized', 'high-contrast', 'artistic', 'ai-edge-detection', 'coloring-xdog', 'coloring-hf', 'svg-vector-trace']
    const validIntensities = ['light', 'medium', 'strong']
    
    if (!validAlgorithms.includes(algorithm)) {
      return NextResponse.json(
        { error: 'Invalid algorithm. Must be one of: edge-detection, portrait-optimized, high-contrast, artistic, ai-edge-detection, coloring-xdog, coloring-hf' },
        { status: 400 }
      )
    }
    
    if (!validIntensities.includes(intensity)) {
      return NextResponse.json(
        { error: 'Invalid intensity. Must be one of: light, medium, strong' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const inputBuffer = Buffer.from(bytes)
    
    // Get original image metadata
    const originalMetadata = await sharp(inputBuffer).metadata()
    
    // Create base64 of original image for display
    const originalBase64 = inputBuffer.toString('base64')
    const originalImage = `data:${file.type};base64,${originalBase64}`
    
    // Process the image to create outline with specified options
    const options: OutlineOptions = {
      algorithm: algorithm as OutlineOptions['algorithm'],
      intensity: intensity as OutlineOptions['intensity'],
      invertColors,
      customParams: Object.keys(customParams).length > 0 ? customParams : undefined
    }
    
    let outlineBuffer: Buffer
    try {
      outlineBuffer = await createOutline(inputBuffer, options)
    } catch (processingError) {
      console.error('Error during image processing:', processingError)
      const errorMessage = (processingError as any)?.message || String(processingError) || 'Unknown error'
      return NextResponse.json(
        { 
          error: `Image processing failed: ${errorMessage}`,
          algorithm,
          intensity,
          invertColors
        },
        { status: 500 }
      )
    }
    
    // If the processing returned an SVG (UTF-8 text), detect and return svg data URI
    const maybeText = outlineBuffer.toString('utf8', 0, Math.min(outlineBuffer.length, 200)).trim()
    let outlineImage: string
    const isSvg = maybeText.startsWith('<?xml') || maybeText.startsWith('<svg')
    if (isSvg) {
      const outlineBase64 = outlineBuffer.toString('base64')
      outlineImage = `data:image/svg+xml;charset=utf-8;base64,${outlineBase64}`
    } else {
      const outlineBase64 = outlineBuffer.toString('base64')
      outlineImage = `data:image/png;base64,${outlineBase64}`
    }
    
    // Generate filename
    const originalName = file.name.split('.')[0]
    const filename = isSvg
      ? `${originalName}_outline_${algorithm}_${intensity}.svg`
      : `${originalName}_outline_${algorithm}_${intensity}.png`
    
    return NextResponse.json({
      success: true,
      originalImage,
      outlineImage,
      message: `Successfully converted ${originalMetadata.width}×${originalMetadata.height} image to ${algorithm} outline (${intensity} intensity)`,
      filename,
      processedAt: new Date().toISOString(),
      settings: {
        algorithm,
        intensity,
        invertColors
      },
      metadata: {
        originalWidth: originalMetadata.width,
        originalHeight: originalMetadata.height,
        originalFormat: originalMetadata.format,
        originalSize: file.size,
        outlineSize: outlineBuffer.length
      }
    })

  } catch (error) {
    console.error('Error processing image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
