/**
 * 调用本地 Python 万物识别服务（阿里万物识别 / 中文标签）
 * 服务地址由环境变量 VISION_SERVICE_URL 配置，默认 http://localhost:5001
 */

import axios, { AxiosError } from 'axios';
import FormData from 'form-data';

const VISION_SERVICE_URL = process.env.VISION_SERVICE_URL || 'http://localhost:5001';

export interface BatchAnalysisResult {
  success: boolean;
  data?: {
    summary: string;
    all_labels: string[];
    /** 每张图一条，与 details 顺序一致 */
    summaries?: string[];
    details: Array<{
      filename: string;
      labels?: Array<{ label: string; score: number }>;
      error?: string;
      /** 本图分析摘要（成功时为标签描述，失败时为明确提示） */
      summary?: string;
    }>;
  };
  error?: string;
}

export interface BatchAnalysisPayload {
  buffer: Buffer;
  filename: string;
  contentType?: string;
}

/** 可选：context=avatar 时使用人物/头像专用标签，分析结果更侧重人像 */
export type AnalyzeBatchOptions = { context?: 'avatar' };

/**
 * 服务端用：将多张图片 buffer 发给 Python 批量分析
 */
export async function analyzeBatchFromBuffers(
  files: BatchAnalysisPayload[],
  options?: AnalyzeBatchOptions
): Promise<BatchAnalysisResult> {
  if (files.length === 0) {
    return { success: false, error: '没有图片' };
  }

  const form = new FormData();
  if (options?.context) {
    form.append('context', options.context);
  }
  for (const f of files) {
    form.append('images[]', f.buffer, {
      filename: f.filename,
      contentType: f.contentType || 'image/jpeg',
    });
  }

  try {
    const { data } = await axios.post<{ success: boolean; data?: BatchAnalysisResult['data']; error?: string }>(
      `${VISION_SERVICE_URL}/analyze_batch`,
      form,
      {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000,
      }
    );

    if (data.success && data.data) {
      return { success: true, data: data.data };
    }
    return { success: false, error: data.error || '分析无结果' };
  } catch (err) {
    const message = err instanceof AxiosError && err.response?.data?.error
      ? String((err.response.data as { error?: string }).error)
      : err instanceof Error ? err.message : '请求视觉服务失败';
    return { success: false, error: message };
  }
}

/**
 * 健康检查
 */
export async function checkVisionService(): Promise<boolean> {
  try {
    const { data } = await axios.get<{ status?: string }>(`${VISION_SERVICE_URL}/health`, {
      timeout: 5000,
    });
    return data.status === 'ok';
  } catch {
    return false;
  }
}
