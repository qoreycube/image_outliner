# Image to Outline Converter

A modern Next.js application that transforms images into beautiful outline drawings using Sharp-based image processing with multiple conversion algorithms.

## ✨ Features

- **Drag & Drop Upload**: Easy-to-use interface for uploading images
- **Multiple Formats**: Supports PNG and JPG image formats (up to 10MB)
- **Six Conversion Algorithms**:
  - **Edge Detection**: Sharp, clean lines with Sobel filters and morphological operations
  - **Portrait Optimized**: Specialized for faces and portraits with enhanced facial feature detection
  - **High Contrast**: Bold, high-contrast outlines 
  - **Artistic**: Stylized, artistic interpretation
  - **Coloring Book**: Perfect for coloring books - thick, clean lines with simplified details
  - **AI Edge Detection**: Advanced Canny edge detection with Python backend integration
- **Intensity Control**: Light, Medium, or Strong processing intensity
- **Color Options**: Normal or inverted color schemes
- **Real-time Processing**: Convert images with visual feedback
- **Download Results**: Save the converted outline images as PNG
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Built-in dark/light mode compatibility
- **Processing Metadata**: View detailed processing information

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd image-converter
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Set up Python backend for AI Edge Detection:
```bash
# Start the Python service on port 9000
python service.py
```

4. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🐍 AI Edge Detection Backend

The AI Edge Detection algorithm requires a Python backend service. The service provides advanced Canny edge detection with configurable parameters:

- **Low Threshold**: Lower threshold for Canny edge detection (10-100)
- **High Threshold**: Upper threshold for Canny edge detection (50-300) 
- **Blur Kernel**: Gaussian blur kernel size for noise reduction (1-15, must be odd)

Configure the backend URL in `.env.local`:
```bash
PYTHON_BACKEND_URL=http://localhost:9000
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🎨 How It Works

1. **Upload**: Drag and drop or click to upload your PNG or JPG image (max 10MB)
2. **Configure**: Choose your preferred algorithm, intensity, and color options
3. **Process**: The image is processed using Sharp with advanced image processing techniques
4. **Download**: Get your outline image ready for use

## 🔧 Processing Options

### Algorithms

- **Edge Detection**: Uses Gaussian blur, sharpening, thresholding, and convolution for clean edge detection
- **Advanced Edge Detection**: Multi-stage processing with pre-processing noise reduction, Laplacian edge detection, morphological operations, and adaptive thresholding for superior edge quality
- **Portrait Optimized**: Specialized for faces and portraits with gamma correction, multi-directional edge detection, and enhanced preprocessing for skin tones and facial features
- **High Contrast**: Applies gamma correction and linear contrast adjustment for bold outlines  
- **Artistic**: Creates stylized interpretations with blur and edge enhancement
- **Coloring Book**: Perfect for creating coloring book pages - produces thick, clean lines with simplified details and bold outlines ideal for coloring

### Intensity Levels

- **Light**: Subtle processing that preserves fine details
- **Medium**: Balanced processing suitable for most images
- **Strong**: Aggressive processing for bold, dramatic results

### Color Options

- **Normal**: Black lines on white background
- **Inverted**: White lines on black background

## 📡 API Endpoints

### POST /api/outliner

Converts an uploaded image to an outline format with customizable options.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: Form data with:
  - `image`: The image file (required)
  - `algorithm`: Processing algorithm (optional, default: 'edge-detection')
    - Options: 'edge-detection', 'advanced-edge-detection', 'high-contrast', 'artistic'
  - `intensity`: Processing intensity (optional, default: 'medium') 
  - `invertColors`: Color inversion flag (optional, default: false)

**Response:**
```json
{
  "success": true,
  "originalImage": "data:image/...",
  "outlineImage": "data:image/...",
  "message": "Processing message",
  "filename": "image_outline_edge-detection_medium.png",
  "processedAt": "2024-01-01T00:00:00.000Z",
  "settings": {
    "algorithm": "edge-detection",
    "intensity": "medium", 
    "invertColors": false
  },
  "metadata": {
    "originalWidth": 800,
    "originalHeight": 600,
    "originalFormat": "jpeg",
    "originalSize": 150000,
    "outlineSize": 75000
  }
}
```

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **File Upload**: react-dropzone
- **Image Processing**: Sharp (high-performance image processing)
- **Edge Detection**: Custom algorithms using convolution, thresholding, and morphological operations

## 📁 Project Structure

```
src/
├── app/
│   ├── api/outliner/route.ts    # Image processing API endpoint
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main page component
│   └── globals.css              # Global styles
├── components/
│   ├── ImageUploader.tsx        # Drag & drop upload component
│   └── ProcessingOptions.tsx    # Processing options configuration
└── lib/
    └── imageProcessing.ts       # Sharp-based image processing algorithms
```

## 🔬 Image Processing Details

The application uses Sharp for high-performance image processing with multiple algorithms:

### Edge Detection Algorithm
1. Convert to grayscale and normalize contrast
2. Apply Gaussian blur to reduce noise
3. Sharpen the image for edge enhancement
4. Apply threshold for black/white conversion
5. Use median filter for noise reduction
6. Apply convolution kernel for edge detection
7. Final threshold and color inversion

### Advanced Edge Detection Algorithm
1. **Pre-processing**: Grayscale conversion, histogram normalization, and noise reduction blur
2. **Edge Enhancement**: Multi-level sharpening while preserving edge information
3. **Laplacian Edge Detection**: Advanced edge detection using Laplacian operator for superior edge identification
4. **Morphological Processing**: Noise suppression and edge connectivity enhancement
5. **Adaptive Thresholding**: Dynamic threshold based on intensity settings
6. **Edge Thinning**: Final cleanup with morphological operations and artifact removal
7. **Post-processing**: Color inversion and PNG optimization

### High Contrast Algorithm
1. Convert to grayscale
2. Apply gamma correction
3. Linear contrast adjustment
4. Threshold-based outline extraction

### Artistic Algorithm
1. Convert to grayscale with blur
2. Normalize and enhance 
3. Apply edge detection convolution
4. Artistic threshold application

## 🏗 Development

### Building for Production

```bash
npm run build
npm start
```

### Adding New Algorithms

To add new processing algorithms:

1. Add the algorithm to `src/lib/imageProcessing.ts`
2. Update the `OutlineOptions` interface
3. Add the algorithm option to the frontend dropdown
4. Test with various image types

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
