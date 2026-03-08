/**
 * @deprecated 已弃用，视觉分析统一走 lib/vision-python.ts（腾讯混元）
 */

export interface ImageAnalysis {
  labels: string[];
  faces: number;
  objects: string[];
  safeSearch: unknown;
  webEntities: string[];
  fullText?: string;
}

export async function analyzeImageFromUrl(_imageUrl: string): Promise<ImageAnalysis> {
  throw new Error('已弃用，请使用 lib/vision-python 的 analyzeBatchFromBuffers');
}

export async function analyzeMultipleImages(_imageUrls: string[]): Promise<{
  combinedLabels: string[];
  totalFaces: number;
  commonObjects: string[];
  description: string;
}> {
  throw new Error('已弃用，请使用 lib/vision-python 的 analyzeBatchFromBuffers');
}
