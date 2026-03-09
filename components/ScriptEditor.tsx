'use client';

/**
 * Script Editor: hard gate before any image generation.
 * - Never auto-confirm; confirmation is an explicit user action.
 * - On scene regenerate (polish) failure: keep existing content; only update on success.
 * - Page order is stable; add/delete/move renumbers pageNo via ensureSequentialPageNos.
 */
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import type { StoryScript, StoryScriptPage } from '@/types/story';

export interface ScriptEditorProps {
  script: StoryScript;
  onScriptChange: (script: StoryScript) => void;
  onValidChange?: (isValid: boolean) => void;
  /** 单页重新生成（仅更新 imagePrompt 等，可选） */
  onRegenerateScene?: (pageIndex: number) => void;
}

function ensureSequentialPageNos(pages: StoryScriptPage[]): StoryScriptPage[] {
  return pages.map((p, i) => ({ ...p, pageNo: i + 1 }));
}

export default function ScriptEditor({
  script,
  onScriptChange,
  onValidChange,
  onRegenerateScene,
}: ScriptEditorProps) {
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pages = script.pages ?? [];
  const setPages = useCallback(
    (next: StoryScriptPage[] | ((prev: StoryScriptPage[]) => StoryScriptPage[])) => {
      const nextPages =
        typeof next === 'function' ? next(pages) : next;
      const normalized = ensureSequentialPageNos(nextPages);
      onScriptChange({ ...script, pages: normalized });
    },
    [script, pages, onScriptChange]
  );

  const updatePage = useCallback(
    (index: number, patch: Partial<StoryScriptPage>) => {
      if (index < 0 || index >= pages.length) return;
      const next = pages.map((p, i) => (i === index ? { ...p, ...patch } : p));
      setPages(next);
    },
    [pages, setPages]
  );

  const addScene = useCallback(() => {
    const newPage: StoryScriptPage = {
      pageNo: pages.length + 1,
      sceneTitle: `第 ${pages.length + 1} 页`,
      imagePrompt: '',
      caption: '',
      dialogue: '',
      visualChecklist: [],
    };
    setPages([...pages, newPage]);
  }, [pages, setPages]);

  const deleteScene = useCallback(
    (index: number) => {
      if (pages.length <= 1) return;
      const next = pages.filter((_, i) => i !== index);
      setPages(ensureSequentialPageNos(next));
    },
    [pages, setPages]
  );

  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const next = [...pages];
      [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
      setPages(next);
    },
    [pages, setPages]
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index >= pages.length - 1) return;
      const next = [...pages];
      [next[index], next[index + 1]] = [next[index + 1]!, next[index]!];
      setPages(next);
    },
    [pages, setPages]
  );

  const handleRegenerateScene = useCallback(
    async (index: number) => {
      const page = pages[index];
      if (!page?.imagePrompt?.trim()) return;
      setRegeneratingIndex(index);
      setError(null);
      try {
        const { data } = await axios.post<{ polished: string }>('/api/polish-prompt', {
          prompt: page.imagePrompt,
        });
        updatePage(index, { imagePrompt: data.polished ?? page.imagePrompt });
        onRegenerateScene?.(index);
      } catch (e) {
        const msg =
          axios.isAxiosError(e) && e.response?.data?.error
            ? e.response.data.error
            : '润色失败';
        setError(msg);
      } finally {
        setRegeneratingIndex(null);
      }
    },
    [pages, updatePage, onRegenerateScene]
  );

  const isValid =
    pages.length >= 1 &&
    pages.every((p) => (p.imagePrompt ?? '').trim() !== '' && (p.caption ?? '').trim() !== '');

  useEffect(() => {
    onValidChange?.(isValid);
  }, [isValid, onValidChange]);

  return (
    <div className="space-y-6">
      <h2 className="kid-title text-xl">{script.title}</h2>
      <p className="kid-muted text-sm">编辑每一页的场景标题、画面描述和旁白，确认后可进入绘图。</p>

      {error && (
        <div className="rounded-xl bg-[var(--kid-error-soft)] text-[var(--kid-error)] px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {pages.map((page, index) => (
          <div
            key={index}
            className="kid-card p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="kid-label">第 {page.pageNo} 页</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-2 rounded-lg kid-btn-secondary text-sm min-h-0"
                  aria-label="上移"
                >
                  上移
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === pages.length - 1}
                  className="p-2 rounded-lg kid-btn-secondary text-sm min-h-0"
                  aria-label="下移"
                >
                  下移
                </button>
                <button
                  type="button"
                  onClick={() => handleRegenerateScene(index)}
                  disabled={regeneratingIndex === index || !(page.imagePrompt ?? '').trim()}
                  className="p-2 rounded-lg bg-[var(--kid-magic-light)]/20 text-[var(--kid-magic-dark)] text-sm min-h-0"
                  aria-label="重新生成本页描述"
                >
                  {regeneratingIndex === index ? '…' : '✨ 润色'}
                </button>
                {pages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteScene(index)}
                    className="p-2 rounded-lg text-[var(--kid-error)] text-sm min-h-0 hover:bg-[var(--kid-error-soft)]"
                    aria-label="删除本页"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--kid-text-muted)] mb-1">场景标题</label>
              <input
                type="text"
                value={page.sceneTitle ?? ''}
                onChange={(e) => updatePage(index, { sceneTitle: e.target.value })}
                className="kid-input w-full"
                placeholder="本页场景标题"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--kid-text-muted)] mb-1">画面描述（用于AI绘图，必填）</label>
              <textarea
                value={page.imagePrompt ?? ''}
                onChange={(e) => updatePage(index, { imagePrompt: e.target.value })}
                className="kid-input w-full min-h-[100px] text-sm resize-y"
                placeholder="详细描述本页画面，用于生成插画"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--kid-text-muted)] mb-1">旁白（必填）</label>
              <textarea
                value={page.caption ?? ''}
                onChange={(e) => updatePage(index, { caption: e.target.value })}
                className="kid-input w-full min-h-[80px] resize-y kid-reading"
                style={{ fontFamily: 'KaiTi, 楷体, STKaiti, serif' }}
                placeholder="本页出现在书中的文字"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--kid-text-muted)] mb-1">台词</label>
              <input
                type="text"
                value={page.dialogue ?? ''}
                onChange={(e) => updatePage(index, { dialogue: e.target.value })}
                className="kid-input w-full"
                placeholder="角色对话（可选）"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--kid-text-muted)] mb-1">视觉清单（每行一项或逗号分隔）</label>
              <textarea
                value={Array.isArray(page.visualChecklist) ? page.visualChecklist.join('\n') : ''}
                onChange={(e) => {
                  const list = e.target.value
                    .split(/[\n,]/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  updatePage(index, { visualChecklist: list });
                }}
                className="kid-input w-full min-h-[60px] text-sm resize-y"
                placeholder="画面中要出现的元素，每行一个"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addScene}
        className="kid-btn-secondary w-full"
      >
        ＋ 添加一页
      </button>

      {!isValid && pages.length > 0 && (
        <p className="kid-muted text-sm text-center">
          请填写每一页的「画面描述」和「旁白」后再确认脚本。
        </p>
      )}
    </div>
  );
}

/** 供父组件读取：当前脚本是否可确认 */
export function useScriptValid(script: StoryScript | null): boolean {
  if (!script?.pages?.length) return false;
  return script.pages.every(
    (p) => (p.imagePrompt ?? '').trim() !== '' && (p.caption ?? '').trim() !== ''
  );
}
