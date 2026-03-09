/**
 * DeepSeek — 生成绘本脚本（分镜文字 + 画面描述）
 */

const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? '';

export interface ScriptPage {
  text: string;         // 绘本正文（孩子读的那句话）
  description: string;  // 画面描述（给即梦用的 prompt）
}

export interface BookScript {
  title: string;
  pages: ScriptPage[];
}

export interface GenerateScriptParams {
  characterName: string;
  characterLabel: string;
  characterDescription: string;
  sceneAnalysis: {
    scenes: string[];
    activities: string[];
    mood: string;
    summary: string;
  };
  storyTheme: string;
  educationalTheme?: string;
  style: string;
  pageCount: number;
}

export async function generateBookScript(params: GenerateScriptParams): Promise<BookScript> {
  if (!DEEPSEEK_API_KEY) throw new Error('未配置 DEEPSEEK_API_KEY');

  const {
    characterName, characterLabel, characterDescription,
    sceneAnalysis, storyTheme, educationalTheme, style, pageCount,
  } = params;

  const educationalPart = educationalTheme
    ? `\n- 故事中自然融入关于"${educationalTheme}"的知识点，寓教于乐，不说教`
    : '';

  const systemPrompt = `你是一位专业的儿童绘本作家，擅长创作温馨、有趣、有教育意义的家庭故事。
你的故事特点：文字简洁，每页1-2句话，孩子能读懂；画面描述具体生动，能直接用于AI绘画；情节递进自然，结局温馨积极。`;

  const userPrompt = `请根据以下信息，创作一个${pageCount}页的儿童绘本故事：

【主角】${characterName}（${characterLabel}），外貌：${characterDescription}

【今天发生的事】
${sceneAnalysis.summary}
场景：${sceneAnalysis.scenes.join('、')}
活动：${sceneAnalysis.activities.join('、')}
氛围：${sceneAnalysis.mood}

【故事主题】${storyTheme}${educationalPart}
【绘画风格】${style}风格，儿童绘本插画

以JSON格式返回（不加代码块标记）：
{
  "title": "故事标题，10字以内，有诗意",
  "pages": [
    {
      "text": "绘本正文，每页1-2句话，15-30字，适合孩子朗读",
      "description": "画面描述，50字以内，说明场景、人物动作、表情、背景，直接用于AI绘图，不含文字标注"
    }
  ]
}

要求：pages 必须有${pageCount}个元素，故事完整起承转合，主角外貌在每页保持一致。`;

  const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 3000,
      temperature: 0.85,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek 生成失败 (${res.status}): ${err.slice(0, 300)}`);
  }

  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? '';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('未找到JSON');
    const result = JSON.parse(jsonMatch[0]) as BookScript;
    if (!result.pages?.length) throw new Error('脚本页数为0');
    return result;
  } catch (e) {
    throw new Error(`脚本解析失败: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** 根据场景分析推荐3个故事方向 */
export async function suggestThemes(params: {
  sceneAnalysis: { scenes: string[]; activities: string[]; mood: string };
  characterName: string;
}): Promise<string[]> {
  if (!DEEPSEEK_API_KEY) {
    return ['一次勇敢的探索冒险', '温暖的家人陪伴时光', '充满惊喜的快乐一天'];
  }

  const { sceneAnalysis, characterName } = params;

  const prompt = `根据以下家庭活动，为儿童绘本推荐3个故事主题方向：
场景：${sceneAnalysis.scenes.join('、')}
活动：${sceneAnalysis.activities.join('、')}
氛围：${sceneAnalysis.mood}，主角：${characterName}

返回JSON数组，每个主题15字以内，有画面感和情感温度：["主题1","主题2","主题3"]`;

  try {
    const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.9,
      }),
    });
    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content ?? '';
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]) as string[];
  } catch { /* fallback */ }

  return ['一次勇敢的探索冒险', '温暖的家人陪伴时光', '充满惊喜的快乐一天'];
}
