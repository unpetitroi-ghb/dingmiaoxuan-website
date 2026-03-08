declare module 'heic-convert' {
  type ConvertFn = (options: { buffer: Buffer; format: 'JPEG' | 'PNG'; quality?: number }) => Promise<Buffer | ArrayBuffer>;
  const convert: ConvertFn;
  export default convert;
}
