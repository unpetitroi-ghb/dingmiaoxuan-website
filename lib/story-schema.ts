/**
 * 绘本脚本 schema 校验 + 工具函数（不依赖 zod）
 */

export interface StoryScriptPage {
  pageNo: number;
  sceneTitle: string;
  imagePrompt: string;
  caption: string;
  dialogue: string;
  visualChecklist: string[];
}

export interface CharacterProfile {
  name: string;
  coreTraits: string[];
  visualConsistency: string;
}

export interface StoryScript {
  title: string;
  theme: string;
  targetAge: string;
  style: string;
  characterProfile: CharacterProfile;
  pages: StoryScriptPage[];
}

// ── 校验结果 ─────────────────────────────────────────────────────────────────
export type SafeParseResult =
  | { success: true; data: StoryScript }
  | { success: false; error: { flatten: () => { fieldErrors: Record<string, string[]> } } };

function flattenError(msg: string): { flatten: () => { fieldErrors: Record<string, string[]> } } {
  return { flatten: () => ({ fieldErrors: { _: [msg] } }) };
}

/**
 * 手动校验 StoryScript，模拟 zod 的 safeParse API
 */
export const StoryScriptSchema = {
  safeParse(input: unknown): SafeParseResult {
    if (!input || typeof input !== 'object') {
      return { success: false, error: flattenError('输入不是对象') };
    }
    const obj = input as Record<string, unknown>;

    if (typeof obj.title !== 'string' || !obj.title) {
      return { success: false, error: flattenError('title 缺失') };
    }
    if (!Array.isArray(obj.pages) || obj.pages.length === 0) {
      return { success: false, error: flattenError('pages 缺失或为空') };
    }
    for (let i = 0; i < (obj.pages as unknown[]).length; i++) {
      const p = (obj.pages as Record<string, unknown>[])[i];
      if (!p.imagePrompt && !p.description) {
        return { success: false, error: flattenError(`第 ${i + 1} 页缺少 imagePrompt`) };
      }
    }

    const cp = (obj.characterProfile ?? {}) as Record<string, unknown>;

    const data: StoryScript = {
      title:       obj.title as string,
      theme:       typeof obj.theme === 'string'     ? obj.theme     : '温馨故事',
      targetAge:   typeof obj.targetAge === 'string' ? obj.targetAge : '3-8岁',
      style:       typeof obj.style === 'string'     ? obj.style     : '绘本',
      characterProfile: {
        name:              typeof cp.name === 'string'              ? cp.name              : '主角',
        coreTraits:        Array.isArray(cp.coreTraits)             ? cp.coreTraits as string[] : [],
        visualConsistency: typeof cp.visualConsistency === 'string' ? cp.visualConsistency : '',
      },
      pages: (obj.pages as Record<string, unknown>[]).map((p, i) => ({
        pageNo:          typeof p.pageNo === 'number' ? p.pageNo : i + 1,
        sceneTitle:      typeof p.sceneTitle === 'string' ? p.sceneTitle : `第 ${i + 1} 页`,
        imagePrompt:     typeof p.imagePrompt === 'string' ? p.imagePrompt : (p.description as string) ?? '',
        caption:         typeof p.caption === 'string' ? p.caption : (p.text as string) ?? '',
        dialogue:        typeof p.dialogue === 'string' ? p.dialogue : '',
        visualChecklist: Array.isArray(p.visualChecklist) ? p.visualChecklist as string[] : [],
      })),
    };

    return { success: true, data };
  },
};

/**
 * 确保 pages 的 pageNo 从 1 开始连续递增
 */
export function normalizeScriptPageNumbers<T extends { pageNo?: number }>(pages: T[]): T[] {
  return pages.map((p, i) => ({ ...p, pageNo: i + 1 }));
}
