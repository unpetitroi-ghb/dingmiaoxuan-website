/** 通过文件头判断是否为 HEIC/HEIF（ftyp + heic/mif1） */
function isHeicBuffer(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;
  const ftyp = buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70;
  if (!ftyp) return false;
  const brand = buffer.slice(8, 12).toString('ascii');
  return brand === 'heic' || brand === 'mif1' || brand === 'heix' || brand === 'hevc';
}

/**
 * 将 HEIC/HEIF 图片转为 JPEG，供上传与视觉分析统一使用。
 * 通过 mimetype、文件名或文件头识别 HEIC，转换失败时不再回退为原图（避免把 HEIC 传给不支持的服务）。
 */
export async function normalizeImageToJpeg(
  buffer: Buffer,
  contentType: string,
  filename: string
): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  const ct = (contentType || '').toLowerCase();
  const name = (filename || '').toLowerCase();
  const isHeicByNameOrType =
    ct === 'image/heic' ||
    ct === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif');
  const isHeicByMagic = isHeicBuffer(buffer);
  const isHeic = isHeicByNameOrType || isHeicByMagic;

  if (!isHeic) {
    return { buffer, contentType: contentType || 'image/jpeg', filename };
  }

  try {
    const mod = await import('heic-convert');
    const convert = (mod as unknown as { default: (opts: { buffer: Buffer; format: string; quality?: number }) => Promise<Buffer | ArrayBuffer> }).default;
    const out = await convert({
      buffer,
      format: 'JPEG',
      quality: 0.92,
    });
    const jpegBuffer = Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBuffer);
    const baseName = name.replace(/\.(heic|heif)$/i, '') || 'image';
    const newFilename = baseName.endsWith('.jpg') ? baseName : `${baseName}.jpg`;
    return {
      buffer: jpegBuffer,
      contentType: 'image/jpeg',
      filename: newFilename,
    };
  } catch (e) {
    console.error('HEIC convert error:', e);
    throw new Error('您上传的是 HEIC 格式，服务端转换失败，请先在手机相册中转为 JPEG 后重试。');
  }
}
