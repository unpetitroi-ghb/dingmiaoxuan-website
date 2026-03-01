import { ImageAnnotatorClient } from '@google-cloud/vision';
import path from 'path';

const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : undefined;

const client = new ImageAnnotatorClient({
  keyFilename,
});

export interface ImageAnalysis {
  labels: string[];
  faces: number;
  objects: string[];
  safeSearch: unknown;
  webEntities: string[];
  fullText?: string;
}

/**
 * 分析图片URL（公网可访问）
 */
export async function analyzeImageFromUrl(imageUrl: string): Promise<ImageAnalysis> {
  const [result] = await client.annotateImage({
    image: { source: { imageUri: imageUrl } },
    features: [
      { type: 'LABEL_DETECTION', maxResults: 10 },
      { type: 'FACE_DETECTION' },
      { type: 'OBJECT_LOCALIZATION' },
      { type: 'SAFE_SEARCH_DETECTION' },
      { type: 'WEB_DETECTION' },
    ],
  });

  const labels = result.labelAnnotations?.map((anno) => anno.description ?? '') ?? [];
  const faces = result.faceAnnotations?.length ?? 0;
  const objects = result.localizedObjectAnnotations?.map((obj) => obj.name ?? '') ?? [];
  const webEntities =
    result.webDetection?.webEntities?.map((entity) => entity.description ?? '').filter(Boolean) ?? [];

  return {
    labels,
    faces,
    objects,
    safeSearch: result.safeSearchAnnotation,
    webEntities,
  };
}

/**
 * 分析多张图片，合并特征描述
 */
export async function analyzeMultipleImages(imageUrls: string[]): Promise<{
  combinedLabels: string[];
  totalFaces: number;
  commonObjects: string[];
  description: string;
}> {
  const allLabels = new Set<string>();
  let totalFaces = 0;
  const allObjects = new Set<string>();

  for (const url of imageUrls) {
    const analysis = await analyzeImageFromUrl(url);
    analysis.labels.forEach((label) => allLabels.add(label));
    analysis.objects.forEach((obj) => allObjects.add(obj));
    totalFaces += analysis.faces;
  }

  const combinedLabels = Array.from(allLabels);
  const commonObjects = Array.from(allObjects);

  const description = `照片分析结果：包含角色${totalFaces > 0 ? `（可能有人物${totalFaces}个）` : ''}，场景元素包括：${combinedLabels.slice(0, 5).join('、')}，物品有：${commonObjects.slice(0, 5).join('、')}。`;

  return {
    combinedLabels,
    totalFaces,
    commonObjects,
    description,
  };
}
