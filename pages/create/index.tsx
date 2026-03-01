'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';

interface Character {
  id: string;
  name: string;
  relationship: string | null;
  gender: string | null;
  age_range: string | null;
  avatar_url: string | null;
  reference_image_url: string | null;
  visual_tags: { summary?: string; labels?: string[] } | null;
}

interface ThemeOption {
  title: string;
  summary: string;
  moral_lesson?: string;
}

/** 单个「待新建」角色草稿 */
interface NewCharacterDraft {
  id: string;
  name: string;
  relationship: string;
  avatarFile: File | null;
  previewUrl: string | null;
  analyzeResult: { summary?: string; labels?: string[] } | null;
}

const STEP_TITLES = ['选角', '上传线索图', '选择故事方向', '分镜脚本'];
const STYLE_OPTIONS = [
  { value: '水彩', label: '水彩' },
  { value: '漫画', label: '漫画' },
  { value: '黑白漫画', label: '黑白漫画' },
  { value: '3D漫画', label: '3D 漫画' },
  { value: '儿童插画', label: '儿童插画' },
  { value: '手绘', label: '手绘' },
];
const CLUE_LOADING_MESSAGES = [
  'AI 正在观察你的房间…',
  '正在寻找玩具和故事线索…',
  '小精灵在翻看你的照片…',
  '马上就好，再等一下下…',
];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 120 : -120, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -120 : 120, opacity: 0 }),
};

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  /** 多个待新建角色草稿，每个可独立填名字、关系、头像并分析 */
  const [newCharacterDrafts, setNewCharacterDrafts] = useState<NewCharacterDraft[]>([]);
  const [loadingAnalyzeId, setLoadingAnalyzeId] = useState<string | null>(null);
  const [loadingCreate, setLoadingCreate] = useState(false);

  const [clueFiles, setClueFiles] = useState<File[]>([]);
  const [cluePreviewUrls, setCluePreviewUrls] = useState<string[]>([]);
  const [loadingClues, setLoadingClues] = useState(false);
  const [clueLoadingMsg, setClueLoadingMsg] = useState(CLUE_LOADING_MESSAGES[0]);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [clueImages, setClueImages] = useState<string[]>([]);
  const [clueAnalysis, setClueAnalysis] = useState<{ url: string; summary?: string; labels?: string[] }[]>([]);
  const [storySummary, setStorySummary] = useState('');
  const [recommendedThemes, setRecommendedThemes] = useState<ThemeOption[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [selectedTheme, setSelectedTheme] = useState<ThemeOption | null>(null);
  const [moralLesson, setMoralLesson] = useState('');
  const [loadingGenerate, setLoadingGenerate] = useState(false);

  /** Step 4: 脚本生成后的故事、可编辑脚本、每页角色、风格 */
  const [storyWithScript, setStoryWithScript] = useState<{
    id: string;
    cast: Character[];
    script: { title?: string; pages?: { text: string; description: string }[] };
  } | null>(null);
  const [scriptEdit, setScriptEdit] = useState<{ title: string; pages: { text: string; description: string }[] }>({ title: '', pages: [] });
  const [pageCharacters, setPageCharacters] = useState<string[][]>([]);
  const [selectedStyle, setSelectedStyle] = useState('水彩');
  const [savingScript, setSavingScript] = useState(false);

  const fetchCharacters = useCallback(async () => {
    try {
      const { data } = await axios.get<Character[]>('/api/characters');
      setCharacters(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  useEffect(() => {
    if (!loadingClues) return;
    const id = setInterval(() => {
      setClueLoadingMsg((prev) => {
        const idx = CLUE_LOADING_MESSAGES.indexOf(prev);
        return CLUE_LOADING_MESSAGES[(idx + 1) % CLUE_LOADING_MESSAGES.length];
      });
    }, 2200);
    return () => clearInterval(id);
  }, [loadingClues]);

  /** 进入第三步时：根据线索图 + 已选角色生成故事概要与推荐方向 */
  useEffect(() => {
    if (step !== 3 || !storyId) return;
    if (recommendedThemes.length > 0 && storySummary) return;
    let cancelled = false;
    setLoadingSummary(true);
    axios
      .post<{ storySummary: string; recommendedThemes: ThemeOption[] }>(`/api/story/${storyId}`, {
        characterIds: selectedCharacterIds.length > 0 ? selectedCharacterIds : undefined,
      })
      .then(({ data }) => {
        if (!cancelled) {
          setStorySummary(data.storySummary || '');
          setRecommendedThemes(data.recommendedThemes || []);
        }
      })
      .catch((e) => {
        if (!cancelled) alert(axios.isAxiosError(e) && e.response?.data?.error ? String(e.response.data.error) : '生成故事概要失败');
      })
      .finally(() => {
        if (!cancelled) setLoadingSummary(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, storyId, selectedCharacterIds]);

  const goToStep = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const addNewDraft = () => {
    setNewCharacterDrafts((prev) => [
      ...prev,
      {
        id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: '',
        relationship: '',
        avatarFile: null,
        previewUrl: null,
        analyzeResult: null,
      },
    ]);
  };

  const removeDraft = (id: string) => {
    setNewCharacterDrafts((prev) => {
      const next = prev.filter((d) => d.id !== id);
      const draft = prev.find((d) => d.id === id);
      if (draft?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(draft.previewUrl);
      return next;
    });
  };

  const updateDraft = (id: string, updates: Partial<NewCharacterDraft>) => {
    setNewCharacterDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  const handleAnalyzeDraft = async (draftId: string) => {
    const draft = newCharacterDrafts.find((d) => d.id === draftId);
    if (!draft?.avatarFile) return;
    setLoadingAnalyzeId(draftId);
    try {
      const form = new FormData();
      form.append('image', draft.avatarFile, draft.avatarFile.name);
      const { data } = await axios.post<{ summary?: string; labels?: string[] }>('/api/character/analyze', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateDraft(draftId, { analyzeResult: data });
    } catch (e: unknown) {
      const msg =
        axios.isAxiosError(e) && e.response?.status === 503
          ? '请先启动视觉服务（vision-service）'
          : '分析失败，请重试';
      alert(msg);
    } finally {
      setLoadingAnalyzeId(null);
    }
  };

  const onDraftAvatarChange = (draftId: string, file: File | null) => {
    const draft = newCharacterDrafts.find((d) => d.id === draftId);
    if (draft?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(draft.previewUrl);
    if (!file) {
      updateDraft(draftId, { avatarFile: null, previewUrl: null, analyzeResult: null });
      return;
    }
    fileToPreviewDataUrl(file).then(
      (dataUrl) => updateDraft(draftId, { avatarFile: file, previewUrl: dataUrl, analyzeResult: null }),
      () => updateDraft(draftId, { avatarFile: file, previewUrl: URL.createObjectURL(file), analyzeResult: null })
    );
  };

  /** 保存所有已填写完整（名字 + 头像 + 已分析）的草稿到角色库 */
  const handleSaveAllDrafts = async () => {
    const toSave = newCharacterDrafts.filter(
      (d) => d.name.trim() && d.avatarFile && d.analyzeResult
    );
    if (toSave.length === 0) return;
    setLoadingCreate(true);
    try {
      for (const draft of toSave) {
        const fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(draft.avatarFile!);
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] ?? '');
          };
          reader.onerror = reject;
        });
        const { data: uploadData } = await axios.post<{ publicUrl: string }>('/api/upload-file', {
          filename: draft.avatarFile!.name,
          contentType: draft.avatarFile!.type || 'image/jpeg',
          fileBase64,
        });
        await axios.post('/api/character/create', {
          name: draft.name.trim(),
          relationship: draft.relationship.trim() || undefined,
          visual_tags: draft.analyzeResult,
          avatar_url: uploadData.publicUrl,
          reference_image_url: uploadData.publicUrl,
        });
      }
      setNewCharacterDrafts((prev) => {
        prev.forEach((d) => d.previewUrl?.startsWith('blob:') && URL.revokeObjectURL(d.previewUrl));
        return [];
      });
      fetchCharacters();
    } catch (e) {
      console.error(e);
      alert('部分角色创建失败，请重试');
    } finally {
      setLoadingCreate(false);
    }
  };

  const completeDraftsCount = newCharacterDrafts.filter(
    (d) => d.name.trim() && d.avatarFile && d.analyzeResult
  ).length;
  const hasAnyDraft = newCharacterDrafts.length > 0;

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  /** HEIC 在多数浏览器无法直接预览，转为 JPEG 后再显示 */
  const fileToPreviewDataUrl = useCallback(async (file: File): Promise<string> => {
    const isHeic =
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      /\.heic$/i.test(file.name) ||
      /\.heif$/i.test(file.name);
    if (isHeic) {
      try {
        const heic2any = (await import('heic2any')).default;
        const blob = await heic2any({ blob: file, toType: 'image/jpeg' });
        const b = Array.isArray(blob) ? blob[0] : blob;
        return new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = reject;
          r.readAsDataURL(b);
        });
      } catch {
        return readFileAsDataUrl(file).catch(() => URL.createObjectURL(file));
      }
    }
    return readFileAsDataUrl(file).catch(() => URL.createObjectURL(file));
  }, []);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length === 0) return;
    setClueFiles((prev) => [...prev, ...accepted]);
    Promise.all(accepted.map(fileToPreviewDataUrl))
      .then((dataUrls) => {
        setCluePreviewUrls((prev) => [...prev, ...dataUrls]);
      })
      .catch(() => {
        setCluePreviewUrls((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
      });
  }, [fileToPreviewDataUrl]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.heic', '.heif'] },
    multiple: true,
    noClick: false,
  });

  const removeClue = (index: number) => {
    setClueFiles((prev) => prev.filter((_, i) => i !== index));
    setCluePreviewUrls((prev) => {
      const url = prev[index];
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleAnalyzeClues = async () => {
    if (clueFiles.length === 0) return;
    setLoadingClues(true);
    setClueLoadingMsg(CLUE_LOADING_MESSAGES[0]);
    try {
      const form = new FormData();
      clueFiles.forEach((f) => form.append('images', f, f.name));
      const res = await axios.post<{
        storyId: string;
        clue_images: string[];
        clue_analysis: { url: string; summary?: string; labels?: string[] }[];
      }>('/api/story/analyze-clues', form, { timeout: 120000 });
      const data = res.data;
      if (!data?.storyId) {
        alert('分析成功但返回数据异常，请重试');
        setLoadingClues(false);
        return;
      }
      setStoryId(data.storyId);
      setClueImages(data.clue_images ?? []);
      setClueAnalysis(data.clue_analysis ?? []);
      setLoadingClues(false);
      setStep(3);
      setDirection(1);
    } catch (e: unknown) {
      let msg = '分析线索失败，请重试';
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 503) msg = '请先启动视觉服务';
        else if (e.response?.data && typeof e.response.data === 'object' && 'error' in e.response.data)
          msg = String((e.response.data as { error?: string }).error) || msg;
      }
      alert(msg);
      setLoadingClues(false);
    }
  };

  /** 第三步点击「下一步：分镜脚本」：保存概要后根据概要+选定方向生成脚本，进入第四步 */
  const handleGenerateScript = async () => {
    if (!storyId || !selectedTheme) return;
    setLoadingGenerate(true);
    try {
      await axios.patch(`/api/story/${storyId}`, { story_summary: storySummary });
      const { data } = await axios.post<{
        id: string;
        cast: Character[];
        script: { title?: string; pages?: { text: string; description: string }[] };
      }>('/api/story/generate', {
        storyId,
        selected_theme: selectedTheme.title,
        characterIds: selectedCharacterIds.length > 0 ? selectedCharacterIds : undefined,
        story_summary: storySummary,
      });
      const script = data.script;
      const pages = Array.isArray(script?.pages) ? script.pages : [];
      setStoryWithScript({ id: data.id, cast: data.cast || [], script: script || {} });
      setScriptEdit({
        title: script?.title || data.id,
        pages: pages.map((p) => ({ text: p.text || '', description: p.description || '' })),
      });
      setPageCharacters(pages.map(() => []));
      goToStep(4);
    } catch (e) {
      console.error(e);
      alert('生成脚本失败');
    } finally {
      setLoadingGenerate(false);
    }
  };

  const updateScriptPage = (pageIndex: number, field: 'text' | 'description', value: string) => {
    setScriptEdit((prev) => ({
      ...prev,
      pages: prev.pages.map((p, i) =>
        i === pageIndex ? { ...p, [field]: value } : p
      ),
    }));
  };

  const setPageCharacterIds = (pageIndex: number, characterIds: string[]) => {
    setPageCharacters((prev) => {
      const next = prev.slice();
      next[pageIndex] = characterIds;
      return next;
    });
  };

  const handleSaveScriptAndStart = async () => {
    if (!storyWithScript) return;
    setSavingScript(true);
    try {
      await axios.patch(`/api/story/${storyWithScript.id}`, {
        script: { title: scriptEdit.title, pages: scriptEdit.pages },
        page_characters: pageCharacters,
      });
      router.push(`/create/waiting?storyId=${storyWithScript.id}&style=${encodeURIComponent(selectedStyle)}`);
    } catch (e) {
      console.error(e);
      alert('保存脚本失败');
    } finally {
      setSavingScript(false);
    }
  };

  const toggleCharacter = (id: string) => {
    setSelectedCharacterIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  };

  return (
    <div className="kid-page">
      <div className="mx-auto max-w-xl">
        <header className="text-center mb-8">
          <h1 className="kid-title text-2xl sm:text-3xl">创作你的 AI 绘本</h1>
          <div className="flex justify-center gap-2 mt-3">
            {[1, 2, 3, 4].map((s) => (
              <span
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-orange-500' : s < step ? 'w-6 bg-teal-400' : 'w-6 bg-amber-200'
                }`}
              />
            ))}
          </div>
          <p className="kid-muted mt-2">{STEP_TITLES[step - 1]}</p>
        </header>

        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.section
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.25 }}
              className="kid-card shadow-lg rounded-3xl space-y-6"
            >
              <h2 className="kid-heading text-lg">第一步：选角</h2>

              {characters.length > 0 && (
                <div>
                  <p className="kid-muted mb-3">从角色库选择本故事使用的角色（可多选）</p>
                  <div className="flex flex-wrap gap-4">
                    {characters.map((c) => {
                      const selected = selectedCharacterIds.includes(c.id);
                      return (
                        <motion.button
                          key={c.id}
                          type="button"
                          onClick={() => toggleCharacter(c.id)}
                          className={`relative w-24 flex flex-col items-center p-2 rounded-2xl border-2 transition-all ${
                            selected
                              ? 'ring-4 ring-orange-400 border-orange-400 bg-orange-50 shadow-md'
                              : 'border-amber-200 bg-white hover:border-orange-300'
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          {selected && (
                            <motion.span
                              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ repeat: Infinity, duration: 1.2 }}
                            >
                              ✓
                            </motion.span>
                          )}
                          {c.avatar_url ? (
                            <img
                              src={c.avatar_url}
                              alt={c.name}
                              className={`w-20 h-20 rounded-xl object-cover mb-1 ${selected ? 'animate-card-bounce' : ''}`}
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-amber-100 flex items-center justify-center text-3xl mb-1">
                              👤
                            </div>
                          )}
                          <span className="font-semibold text-sm text-stone-800 truncate w-full text-center">
                            {c.name}
                          </span>
                          {c.relationship && (
                            <span className="kid-muted text-xs">({c.relationship})</span>
                          )}
                        </motion.button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={addNewDraft}
                      className="w-24 h-[7.5rem] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:border-orange-400 hover:bg-orange-50/50 transition-colors"
                    >
                      <span className="text-3xl text-amber-600 mb-1">+</span>
                      <span className="text-xs text-amber-700 font-medium">新建角色</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-amber-200 pt-4">
                <p className="kid-heading text-sm mb-3">新建多个角色（每个可上传不同头像）</p>
                {newCharacterDrafts.length === 0 ? (
                  <button
                    type="button"
                    onClick={addNewDraft}
                    className="w-full min-h-[140px] rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:border-orange-400 hover:bg-orange-50/50 transition-colors flex flex-col items-center justify-center gap-2"
                  >
                    <span className="text-4xl">👤</span>
                    <span className="text-amber-800 font-medium">点击添加第一个角色</span>
                  </button>
                ) : (
                  <div className="space-y-4">
                    {newCharacterDrafts.map((draft, index) => (
                      <motion.div
                        key={draft.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border-2 border-amber-200 bg-amber-50/30 p-4"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="kid-muted text-sm font-medium">角色 {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeDraft(draft.id)}
                            className="text-amber-600 hover:text-red-500 text-sm"
                          >
                            删除
                          </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
                          <input
                            type="text"
                            value={draft.name}
                            onChange={(e) => updateDraft(draft.id, { name: e.target.value })}
                            className="kid-input bg-white/90 shadow-sm"
                            placeholder="名字"
                          />
                          <input
                            type="text"
                            value={draft.relationship}
                            onChange={(e) => updateDraft(draft.id, { relationship: e.target.value })}
                            className="kid-input bg-white/90 shadow-sm"
                            placeholder="关系，如：女儿、儿子"
                          />
                          <div className="sm:col-span-2">
                            {!draft.previewUrl ? (
                              <label className="flex flex-col items-center justify-center min-h-[100px] rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-colors">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    onDraftAvatarChange(draft.id, file ?? null);
                                  }}
                                />
                                <p className="text-amber-800 text-sm">点击上传头像</p>
                              </label>
                            ) : (
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-amber-100 shadow border-2 border-amber-200">
                                  <img
                                    src={draft.previewUrl}
                                    alt={draft.previewUrl ? '头像预览' : '加载失败'}
                                    className="h-full w-full object-cover"
                                    decoding="async"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleAnalyzeDraft(draft.id)}
                                    disabled={loadingAnalyzeId === draft.id}
                                    className="kid-btn-secondary min-h-10 px-3 text-sm"
                                  >
                                    {loadingAnalyzeId === draft.id ? '分析中…' : '🔍 分析'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDraftAvatarChange(draft.id, null)}
                                    className="text-xs text-amber-700 hover:text-orange-600"
                                  >
                                    重选
                                  </button>
                                </div>
                                {draft.analyzeResult && (
                                  <div className="flex-1 min-w-0">
                                    <p className="text-amber-700 text-xs font-medium">本地模型分析</p>
                                    <p className="kid-muted text-xs mt-0.5">{draft.analyzeResult.summary}</p>
                                    {draft.analyzeResult.labels && draft.analyzeResult.labels.length > 0 && (
                                      <p className="text-stone-500 text-xs mt-1 truncate" title={draft.analyzeResult.labels.join('、')}>
                                        标签：{draft.analyzeResult.labels.slice(0, 5).join('、')}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={addNewDraft}
                        className="kid-btn-secondary min-h-12 px-4"
                      >
                        + 再添加一个角色
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAllDrafts}
                        disabled={completeDraftsCount === 0 || loadingCreate}
                        className="kid-btn-primary min-h-12 px-6"
                      >
                        {loadingCreate
                          ? `保存中…`
                          : completeDraftsCount > 0
                            ? `保存全部到角色库（${completeDraftsCount} 个）`
                            : '保存到角色库'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <motion.button
                type="button"
                onClick={() => goToStep(2)}
                className="kid-btn-primary w-full min-h-14"
                whileTap={{ scale: 0.95 }}
              >
                下一步：上传线索图
              </motion.button>
            </motion.section>
          )}

          {step === 2 && (
            <motion.section
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.25 }}
              className="kid-card shadow-lg rounded-3xl space-y-6"
            >
              <h2 className="kid-heading text-lg">第二步：线索图</h2>
              <p className="kid-muted">上传多张照片作为故事线索，AI 会分析并推荐 3 个故事方向</p>

              {loadingClues ? (
                <div className="py-12 text-center">
                  <motion.div
                    className="text-5xl mb-4"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    🔍
                  </motion.div>
                  <p className="text-lg text-orange-600 font-medium">{clueLoadingMsg}</p>
                </div>
              ) : (
                <>
                  <div
                    {...getRootProps()}
                    className={`min-h-[220px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
                      isDragActive
                        ? 'border-orange-500 bg-orange-100'
                        : 'border-amber-400 bg-amber-100/80 hover:border-orange-400 hover:bg-amber-100'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <span className="text-5xl">📷</span>
                    <p className="text-amber-800 font-medium text-lg">
                      {isDragActive ? '松开即可添加' : '拖拽图片到此处，或点击选择'}
                    </p>
                    <p className="kid-muted text-sm">可多选，支持 JPG、PNG</p>
                  </div>

                  {cluePreviewUrls.length > 0 && (
                    <div className="flex flex-wrap gap-4 justify-center">
                      {cluePreviewUrls.map((url, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative"
                          style={{
                            transform: `rotate(${(i % 3) * 4 - 4}deg)`,
                          }}
                        >
                          <div className="w-24 h-28 rounded-lg overflow-hidden bg-white shadow-lg p-1 border-2 border-amber-100">
                            <div className="relative h-20 w-full rounded bg-amber-50">
                              <img
                                src={url}
                                alt={url ? `线索${i + 1}` : '加载失败'}
                                className="h-full w-full object-cover rounded"
                                decoding="async"
                              />
                            </div>
                            <div className="h-6 flex items-center justify-center text-xs text-amber-800">
                              线索 {i + 1}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeClue(i)}
                            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-400 text-white text-sm leading-none"
                          >
                            ×
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAnalyzeClues}
                    disabled={clueFiles.length === 0 || loadingClues}
                    className="kid-btn-primary w-full min-h-14"
                  >
                    分析线索并推荐故事方向
                  </button>
                  <button type="button" onClick={() => goToStep(1)} className="kid-btn-secondary w-full min-h-14">
                    上一步
                  </button>
                </>
              )}
            </motion.section>
          )}

          {step === 3 && (
            <motion.section
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.25 }}
              className="kid-card shadow-lg rounded-3xl space-y-6"
            >
              <h2 className="kid-heading text-lg">第三步：故事概要与方向</h2>

              {loadingSummary ? (
                <div className="py-8 text-center">
                  <p className="text-orange-600 font-medium">正在根据图片和角色生成故事概要…</p>
                </div>
              ) : (
                <>
                  <p className="kid-muted text-sm">每张图的分析结果与汇总概要（可编辑）</p>

                  {clueImages.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-amber-800">各图分析</p>
                      {clueImages.map((url, i) => (
                        <div key={i} className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-3">
                          <img src={url} alt={`图${i + 1}`} className="w-full max-h-32 object-contain rounded-lg bg-white" />
                          <p className="text-xs font-medium text-amber-800 mt-2">图{i + 1} · 本图分析</p>
                          <p className="text-sm text-stone-700 mt-1">{clueAnalysis[i]?.summary || '（暂无分析）'}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="block kid-heading text-sm mb-2">故事概要（根据以上图片与角色汇总，可修改）</label>
                    <textarea
                      value={storySummary}
                      onChange={(e) => setStorySummary(e.target.value)}
                      className="kid-input bg-white/90 min-h-[100px] resize-y"
                      placeholder="AI 将根据图片和角色生成一段概要…"
                      rows={4}
                    />
                  </div>

                  <div>
                    <p className="kid-heading text-sm mb-2">根据以上概要，推荐的寓教于乐方向</p>
                    <div className="space-y-3">
                      {recommendedThemes.map((theme) => {
                        const selected = selectedTheme?.title === theme.title;
                        return (
                          <motion.div
                            key={theme.title}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl overflow-hidden border-2 transition-all"
                            style={{
                              borderColor: selected ? '#f97316' : '#fde68a',
                              background: selected ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' : '#fff',
                              boxShadow: selected ? '0 8px 24px rgba(249,115,22,0.2)' : '0 4px 12px rgba(0,0,0,0.06)',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTheme(theme);
                                setMoralLesson(theme.moral_lesson || '');
                              }}
                              className="w-full text-left p-4 flex items-start gap-3"
                            >
                              <span className="text-2xl shrink-0">📜</span>
                              <div className="min-w-0">
                                <div className="font-bold text-stone-800">{theme.title}</div>
                                <p className="kid-muted text-sm mt-1">{theme.summary}</p>
                                {theme.moral_lesson && (
                                  <p className="text-teal-600 text-sm mt-1">教育意义：{theme.moral_lesson}</p>
                                )}
                              </div>
                              {selected && (
                                <span className="shrink-0 w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm">
                                  ✓
                                </span>
                              )}
                            </button>
                            {selected && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="px-4 pb-3 pt-0 border-t border-amber-100"
                              >
                                <label className="block text-xs font-medium text-amber-800 mb-1">教育意义（可编辑）</label>
                                <input
                                  type="text"
                                  value={moralLesson}
                                  onChange={(e) => setMoralLesson(e.target.value)}
                                  className="kid-input bg-white/90 text-sm"
                                  placeholder="本故事希望传达的意义"
                                />
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateScript}
                    disabled={!selectedTheme || loadingGenerate || recommendedThemes.length === 0}
                    className="kid-btn-primary w-full min-h-14"
                  >
                    {loadingGenerate ? '正在生成分镜…' : '下一步：分镜脚本'}
                  </button>
                  <button type="button" onClick={() => goToStep(2)} className="kid-btn-secondary w-full min-h-14">
                    上一步
                  </button>
                </>
              )}
            </motion.section>
          )}

          {step === 4 && storyWithScript && (
            <motion.section
              key="step4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.25 }}
              className="kid-card shadow-lg rounded-3xl space-y-6"
            >
              <h2 className="kid-heading text-lg">第四步：分镜脚本（可编辑）</h2>
              <p className="kid-muted text-sm">可修改每页文字与画面描述，并为每页选择要出现的角色</p>

              <div>
                <label className="block kid-muted text-xs mb-1">绘本标题</label>
                <input
                  type="text"
                  value={scriptEdit.title}
                  onChange={(e) => setScriptEdit((p) => ({ ...p, title: e.target.value }))}
                  className="kid-input bg-white/90"
                />
              </div>

              <div className="space-y-4">
                {scriptEdit.pages.map((page, i) => (
                  <div key={i} className="rounded-2xl border-2 border-amber-200 bg-amber-50/30 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-amber-800">第 {i + 1} 页</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-amber-700">本页加入角色：</span>
                        {storyWithScript.cast.length > 0 ? (
                          storyWithScript.cast.map((c) => (
                            <label key={c.id} className="inline-flex items-center gap-1 text-sm">
                              <input
                                type="checkbox"
                                checked={(pageCharacters[i] || []).includes(c.id)}
                                onChange={(e) => {
                                  const cur = pageCharacters[i] || [];
                                  setPageCharacterIds(
                                    i,
                                    e.target.checked ? [...cur, c.id] : cur.filter((id) => id !== c.id)
                                  );
                                }}
                                className="rounded border-amber-400"
                              />
                              {c.name}
                            </label>
                          ))
                        ) : (
                          <span className="kid-muted text-xs">未选角色，将使用线索图</span>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <div>
                        <label className="block text-xs text-amber-800 mb-0.5">旁白/台词</label>
                        <input
                          type="text"
                          value={page.text}
                          onChange={(e) => updateScriptPage(i, 'text', e.target.value)}
                          className="kid-input bg-white/90 text-sm"
                          placeholder="本页文字"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-amber-800 mb-0.5">画面描述（供 AI 绘图）</label>
                        <textarea
                          value={page.description}
                          onChange={(e) => updateScriptPage(i, 'description', e.target.value)}
                          className="kid-input bg-white/90 text-sm min-h-[60px]"
                          placeholder="画面描述"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block kid-heading text-sm mb-2">生成插画风格</label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedStyle(opt.value)}
                      className={`min-h-10 px-4 rounded-xl border-2 text-sm font-medium transition ${
                        selectedStyle === opt.value
                          ? 'border-orange-500 bg-orange-100 text-orange-800'
                          : 'border-amber-200 bg-white text-stone-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveScriptAndStart}
                disabled={savingScript}
                className="kid-btn-primary w-full min-h-14"
              >
                {savingScript ? '保存中…' : `保存脚本并用「${selectedStyle}」风格开始生成插画`}
              </button>
              <button type="button" onClick={() => goToStep(3)} className="kid-btn-secondary w-full min-h-14">
                上一步
              </button>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
