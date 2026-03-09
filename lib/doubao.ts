/**
 * 豆包 Vision (Doubao-Seed-1.6-vision) via Volcengine ARK
 * 用于分析家庭照片中的场景、活动、情绪
 */

const ARK_BASE = 'https://ark.volcengine.com/api/v3';
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY ?? '';
const DOUBAO_MODEL = process.env.DOUBAO_MODEL ?? 'doubao-seed-1.6-vision';

export interface SceneAnalysis {
  scenes: string[];       // 识别到的场景，如：动物园、旋转木马区
  activities: string[];   // 发生的活动，如：喂长颈鹿、吃冰淇淋
  people: string[];       // 识别到的人物特征
  mood: string;           // 整体氛围
  summary: string;        // 100字内的整体描述
  storyHints: string[];   // 3个故事方向建议
}

/** 分析场景照片（接受 URL 数组，支持 base64 data URL） */
export async function analyzeScenePhotos(imageUrls: string[]): Promise<SceneAnalysis> {
  if (!DOUBAO_API_KEY) throw new Error('未配置 DOUBAO_API_KEY');
  if (imageUrls.length === 0) throw new Error('请至少提供一张照片');

  const prompt = `你是一个善于发现家庭故事的AI。请仔细观察这${imageUrls.length}张照片，这是某个家庭今天的活动记录。

请分析后以JSON格式返回（不要加 markdown 代码块）：
{
  "scenes": ["照片中的具体场景，如：动物园大门、长颈鹿区、旋转木马"],
  "activities": ["发生的具体活动，如：亲子喂食、拍照留念、品尝美食"],
  "people": ["照片中人物的特征，如：小女孩、爸爸、家庭合影"],
  "mood": "整体氛围，如：欢乐冒险、温馨亲密、充满惊喜",
  "summary": "用生动温暖的语言描述这次活动，100字以内",
  "storyHints": ["故事方向1，20字内", "故事方向2，20字内", "故事方向3，20字内"]
}`;

  const content: unknown[] = [
    ...imageUrls.slice(0, 8).map(url => ({
      type: 'image_url',
      image_url: { url },
    })),
    { type: 'text', text: prompt },
  ];

  const res = await fetch(`${ARK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DOUBAO_API_KEY}`,
    },
    body: JSON.stringify({
      model: DOUBAO_MODEL,
      messages: [{ role: 'user', content }],
      max_tokens: 1200,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`豆包 Vision 分析失败 (${res.status}): ${err.slice(0, 300)}`);
  }

  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? '';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('未找到JSON');
    return JSON.parse(jsonMatch[0]) as SceneAnalysis;
  } catch {
    // 解析失败时返回兜底数据
    return {
      scenes: ['精彩活动'],
      activities: ['开心探索'],
      people: ['家庭成员'],
      mood: '温馨快乐',
      summary: text.slice(0, 200) || '一次美好的家庭活动',
      storyHints: ['关于探索与发现的故事', '关于勇敢和成长的故事', '关于爱与家人的故事'],
    };
  }
}

/** 根据角色照片提取特征描述（用于 Jimeng 一致性提示词） */
export async function analyzeCharacterPhoto(imageUrl: string, characterName: string): Promise<string> {
  if (!DOUBAO_API_KEY) return `可爱的小朋友${characterName}`;

  const prompt = `请简要描述这张照片中主要人物的外貌特征（发型、肤色、大致年龄、穿着风格），用于AI绘画风格参考。30字以内，不用提名字。`;

  const res = await fetch(`${ARK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DOUBAO_API_KEY}`,
    },
    body: JSON.stringify({
      model: DOUBAO_MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          { type: 'text', text: prompt },
        ],
      }],
      max_tokens: 100,
    }),
  });

  if (!res.ok) return `可爱的小朋友${characterName}`;
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content?.trim() ?? `可爱的小朋友${characterName}`;
}
