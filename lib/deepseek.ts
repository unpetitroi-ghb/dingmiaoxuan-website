import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export interface StoryParams {
  characterName: string;
  characterTraits: string;
  theme: string;
  style: string;
}

export interface StoryResult {
  title: string;
  pages: { text: string; description: string }[];
}

export async function generateStory(params: StoryParams): Promise<StoryResult> {
  const prompt = `
你是一个儿童绘本作家。请为一个叫“${params.characterName}”的孩子创作一个6页的绘本故事。
故事主题：${params.theme}
主角外貌：${params.characterTraits}
艺术风格：${params.style}

要求：
- 每页文字简单活泼，适合3-10岁儿童。
- 故事要有积极的意义。
- 输出格式为JSON，包含 title 和 pages 数组，每个page包含 text（故事文字）和 description（画面描述，用于AI绘画）。
  `;

  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    },
    {
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const content = response.data.choices[0].message.content;
  return JSON.parse(content) as StoryResult;
}

export interface ComicScriptParams {
  characterName: string;
  /** 旧：纯文本描述 */
  imageAnalysisDescription?: string;
  /** 新：万物识别结果（summary + labels） */
  imageAnalysis?: { summary: string; labels: string[] };
  userStoryIdea: string;
  style: string;
  pageCount?: number;
}

export interface ComicScriptResult {
  title: string;
  pages: { text: string; description: string }[];
}

/**
 * 基于图片分析生成漫画脚本和分镜（每页 text + description）
 */
export async function generateComicScript(params: ComicScriptParams): Promise<ComicScriptResult> {
  const pageCount = params.pageCount ?? 6;
  const analysisText = params.imageAnalysis
    ? `【照片分析】${params.imageAnalysis.summary}\n【图片标签】${(params.imageAnalysis.labels || []).slice(0, 10).join('、')}`
    : `【照片分析】${params.imageAnalysisDescription ?? '用户上传了照片，请结合用户创意创作。'}`;

  const prompt = `
你是一个专业的漫画编剧和分镜师。请根据以下信息创作一个${pageCount}页的短篇漫画。

【主角名称】${params.characterName}
${analysisText}
【用户创意】${params.userStoryIdea}
【漫画风格】${params.style}

要求：
- 每页包含一句简短的台词或旁白（text），以及详细的画面描述（description，用于AI绘画）。
- 故事要有起承转合，适合儿童阅读。
- 输出格式为JSON，包含 title 和 pages 数组，每个元素包含 text 和 description。
  `;

  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    },
    {
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const content = response.data.choices[0].message.content;
  return JSON.parse(content) as ComicScriptResult;
}

/** 多图线索分析结果的一项 */
export interface ClueAnalysisItem {
  url: string;
  summary?: string;
  labels?: string[];
}

/** V5：推荐的寓教于乐方向 */
export interface RecommendedTheme {
  title: string;
  summary: string;
  moral_lesson?: string;
}

/** 角色简要信息（用于汇总故事概要） */
export interface CharacterSummaryForStory {
  name: string;
  summary?: string;
  labels?: string[];
}

/** 根据多图分析 + 角色信息，汇总成故事概要并推荐 3 个寓教于乐方向 */
export async function generateStorySummaryAndThemes(
  clueAnalysis: ClueAnalysisItem[],
  characterInfos: CharacterSummaryForStory[]
): Promise<{ storySummary: string; themes: RecommendedTheme[] }> {
  const cluesText = clueAnalysis
    .map((c, i) => `图${i + 1}：${c.summary || '（无描述）'}；标签：${(c.labels || []).join('、')}`)
    .join('\n');
  const charsText =
    characterInfos.length > 0
      ? characterInfos
          .map(
            (c) =>
              `角色「${c.name}」：${c.summary || ''}；标签：${(c.labels || []).slice(0, 8).join('、')}`
          )
          .join('\n')
      : '（未指定角色）';

  const prompt = `
你是一位儿童绘本策划。请根据用户上传的多张图片分析结果，以及用户定义的角色信息，完成两件事：

1）用 2～4 句话写一个「故事概要」，概括这些图片和角色可能组成的故事（适合 3～10 岁儿童，温馨、有画面感）。
2）根据这个故事概要，推荐 3 个不同的「寓教于乐」方向（例如：友情、勇气、分享、成长、家庭等），每个方向要有标题、一两句梗概、以及简短的教育意义。

【每张图的分析】
${cluesText}

【用户定义的角色】
${charsText}

要求：
- 输出 JSON：{ "storySummary": "故事概要的 2～4 句话", "themes": [ { "title": "方向标题", "summary": "一两句梗概", "moral_lesson": "教育意义" }, ... ] }
- 3 个方向要有明显差异，moral_lesson 简短正面。
  `;

  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    },
    {
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = JSON.parse(response.data.choices[0].message.content) as {
    storySummary?: string;
    themes?: RecommendedTheme[];
  };
  const storySummary =
    typeof data.storySummary === 'string' ? data.storySummary : '根据你的图片和角色，将诞生一个温馨的小故事。';
  const themes = Array.isArray(data.themes) ? data.themes.slice(0, 3) : [];
  return { storySummary, themes };
}

/** V5：根据故事概要/选定方向与线索生成分镜脚本 */
export async function generateScriptForStory(params: {
  clueAnalysis: ClueAnalysisItem[];
  selectedTheme: string;
  moral_lesson?: string;
  characterNames: string[];
  pageCount?: number;
  /** 用户编辑后的故事概要，若提供则优先基于概要写脚本 */
  storySummary?: string;
}): Promise<ComicScriptResult> {
  const pageCount = params.pageCount ?? 6;
  const cluesText = params.clueAnalysis
    .map((c, i) => `图${i + 1}：${c.summary || ''}；${(c.labels || []).join('、')}`)
    .join('\n');

  const summaryBlock = params.storySummary
    ? `【故事概要（用户确认）】\n${params.storySummary}\n\n`
    : '';

  const prompt = `
你是儿童漫画编剧。根据下面的故事概要/方向与线索，创作一个 ${pageCount} 页的短篇漫画脚本。
${summaryBlock}【线索图分析】
${cluesText}

【选定方向】${params.selectedTheme}
【教育意义】${params.moral_lesson || '积极向上'}
【出场角色】${params.characterNames.join('、')}

要求：
- 输出 JSON：{ "title": "绘本标题", "pages": [ { "text": "本页旁白/台词", "description": "本页画面描述（用于AI绘画）" }, ... ] }
- 每页 text 简短，description 详细便于绘图。
- 故事完整、适合儿童，体现教育意义。
  `;

  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    },
    {
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const content = response.data.choices[0].message.content;
  return JSON.parse(content) as ComicScriptResult;
}
