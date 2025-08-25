declare module 'imagetracerjs' {
  interface TracerOptions {
    ltres?: number;
    qtres?: number;
    pathomit?: number;
    colorsampling?: number;
    numberofcolors?: number;
    mincolorratio?: number;
    colorquantcycles?: number;
    layering?: number;
    strokewidth?: number;
    linefilter?: boolean;
    scale?: number;
    roundcoords?: number;
    viewbox?: boolean;
    desc?: boolean;
    lcpr?: number;
    qcpr?: number;
    blurradius?: number;
    blurdelta?: number;
    rightangleenhance?: boolean;
  }

  interface ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  }

  interface ImageTracer {
    imagedataToSVG(imageData: ImageData, options?: TracerOptions): string;
  }

  const ImageTracer: ImageTracer;
  export = ImageTracer;
}
