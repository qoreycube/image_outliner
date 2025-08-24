declare module 'potrace' {
  import { Buffer } from 'buffer'
  export function trace(buffer: Buffer | string, options: any, callback: (err: Error | null, svg: string) => void): void
}
