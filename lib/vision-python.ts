/**
 * 视觉分析统一入口：仅使用腾讯混元（hunyuan-vision）进行图像理解。
 * 提交前对图片做压缩（缩小尺寸+JPEG 质量），多张图并行请求，以加快响应。
 */

const HUNYUAN_BASE = 'https://api.hunyuan.cloud.tencent.com/v1';
const HUNYUAN_API_KEY = process.env.HUNYUAN_API_KEY ?? '';

/** 视觉分析用：最大边长、JPEG 质量，控制上传体积与速度 */
const VISION_MAX_EDGE = 1280;
const VISION_JPEG_QUALITY = 82;

/**
 * 压缩图片再提交混元：统一为 JPEG、长边不超过 VISION_MAX_EDGE、质量 VISION_JPEG_QUALITY。
 * 失败时返回原 buffer。
 */
async function compressForVision(buffer: Buffer): Promise<Buffer> {
  try {
    const sharp = (await import('sharp')).default;
    const out = await sharp(buffer)
      .resize(VISION_MAX_EDGE, VISION_MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: VISION_JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
    return out.length < buffer.length ? out : buffer;
  } catch {
    return buffer;
  }
}

export type VisionBatchItem = {
  buffer: Buffer;
  filename: string;
  contentType?: string;
};

export type VisionBatchOptions = {
  context?: 'avatar' | string;
};

export type VisionDetail = {
  filename: string;
  labels?: { label: string; score: number }[];
  summary?: string;
  error?: string;
};

export type VisionBatchResult = {
  success: boolean;
  data?: {
    summary: string;
    all_labels?: string[];
    details?: VisionDetail[];
    summaries?: string[];
  };
  error?: string;
};

/** 检查是否已配置混元（API Key 存在即视为可用） */
export async function checkVisionService(): Promise<boolean> {
  return Boolean(HUNYUAN_API_KEY && HUNYUAN_API_KEY.length > 0);
}

function getVisionPrompt(context?: string): string {
  if (context === 'avatar') {
    return '请用一句简短的中文描述这张图片中的人物或角色（如年龄、性别、表情、穿着等），并列出关键视觉标签（如：人、肖像、微笑、室内等），多个标签用中文逗号分隔。格式：描述：xxx。标签：a，b，c';
  }
  return '请用一句简短的中文描述这张图片的内容，并列出图中的关键元素或标签（如人物、场景、物体等），多个标签用中文逗号分隔。格式：描述：xxx。标签：a，b，c';
}

function parseVisionReply(text: string): { summary: string; labels: string[] } {
  const summary = text.trim() || '暂无描述';
  let labels: string[] = [];
  const tagMatch = text.match(/标签[：:]\s*([^\n。]+)/);
  if (tagMatch) {
    labels = tagMatch[1]
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (labels.length === 0) {
    const descMatch = text.match(/描述[：:]\s*([^\n。]+)/);
    if (descMatch) {
      labels = [descMatch[1].trim().slice(0, 30)];
    } else {
      labels = [summary.slice(0, 20)];
    }
  }
  return { summary, labels };
}

async function analyzeOneWithHunyuan(
  buffer: Buffer,
  filename: string,
  context?: string
): Promise<{ summary: string; labels: string[]; error?: string }> {
  if (!HUNYUAN_API_KEY) {
    return { summary: '', labels: [], error: '未配置 HUNYUAN_API_KEY' };
  }
  const compressed = await compressForVision(buffer);
  const base64 = compressed.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64}`;
  const prompt = getVisionPrompt(context);

  const res = await fetch(`${HUNYUAN_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${HUNYUAN_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'hunyuan-vision',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { summary: '', labels: [], error: `混元接口 ${res.status}: ${errText.slice(0, 200)}` };
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };
  if (json.error?.message) {
    return { summary: '', labels: [], error: json.error.message };
  }
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    return { summary: '', labels: [], error: '混元未返回内容' };
  }
  const { summary, labels } = parseVisionReply(content);
  return { summary, labels };
}

/**
 * 批量分析图片：每张图调用混元 hunyuan-vision，返回汇总与每张图的摘要/标签。
 */
export async function analyzeBatchFromBuffers(
  items: VisionBatchItem[],
  options?: VisionBatchOptions
): Promise<VisionBatchResult> {
  if (items.length === 0) {
    return { success: false, error: '没有可分析的图片' };
  }
  if (!HUNYUAN_API_KEY) {
    return {
      success: false,
      error: '未配置 HUNYUAN_API_KEY，请在环境变量中配置腾讯混元 API Key',
    };
  }

  const details: VisionDetail[] = [];
  const summaries: string[] = [];
  const allLabelsSet = new Set<string>();

  try {
    const results = await Promise.all(
      items.map((item) => analyzeOneWithHunyuan(item.buffer, item.filename, options?.context))
    );
    for (let i = 0; i < results.length; i++) {
      const one = results[i];
      const item = items[i];
      if (one.error) {
        details.push({
          filename: item.filename,
          summary: one.error,
          error: one.error,
        });
        summaries.push(one.error);
      } else {
        one.labels.forEach((l) => allLabelsSet.add(l));
        details.push({
          filename: item.filename,
          summary: one.summary,
          labels: one.labels.map((label) => ({ label, score: 1 })),
        });
        summaries.push(one.summary);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('analyzeBatchFromBuffers error:', e);
    return { success: false, error: `视觉分析异常：${msg}` };
  }

  const all_labels = Array.from(allLabelsSet);
  const summary =
    all_labels.length > 0
      ? `照片分析结果：包含${all_labels.slice(0, 8).join('、')}等元素。`
      : details.map((d) => d.summary).filter(Boolean)[0] || '暂无识别结果。';

  return {
    success: true,
    data: {
      summary,
      all_labels,
      details,
      summaries,
    },
  };
}
