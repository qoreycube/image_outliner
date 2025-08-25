declare module 'potrace' {
  import { Buffer } from 'buffer'
  
  interface PotraceOptions {
    [key: string]: unknown;
  }
  
  export function trace(
    buffer: Buffer | string, 
    options: PotraceOptions, 
    callback: (err: Error | null, svg: string) => void
  ): void
}
