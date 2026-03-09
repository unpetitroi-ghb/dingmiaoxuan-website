import { useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

// ── 教育主题选项 ─────────────────────────────────────────────────────────────
const EDUCATIONAL_THEMES = [
  '动物知识与自然科学', '友情与分享', '勇气与克服困难',
  '传统文化与节日', '家族亲情与感恩', '环保与爱护地球',
  '数学与逻辑思维', '历史与地理探索',
];

const STYLES = [
  { value: '水彩绘本', label: '水彩绘本', emoji: '🎨' },
  { value: '日漫', label: '日漫风格', emoji: '⛩️' },
  { value: '3D卡通', label: '3D卡通', emoji: '🎮' },
  { value: '中国风', label: '中国水墨', emoji: '🖌️' },
];

const PAGE_COUNTS = [6, 8, 10];

const CHARACTER_LABELS = ['孩子', '爸爸', '妈妈', '爷爷', '奶奶', '全家人', '宠物', '其他'];

// ── 图片上传 Hook ─────────────────────────────────────────────────────────────
function useImageUpload() {
  const [urls, setUrls] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(newFiles: File[]) {
    if (!newFiles.length) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      for (const f of newFiles) form.append('images[]', f);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json() as { urls?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? '上传失败');
      setUrls(prev => [...prev, ...(data.urls ?? [])]);
      setFiles(prev => [...prev, ...newFiles]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '上传失败，请重试');
    } finally {
      setUploading(false);
    }
  }

  function remove(index: number) {
    setUrls(prev => prev.filter((_, i) => i !== index));
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  return { urls, files, uploading, error, upload, remove };
}

// ── 主组件 ───────────────────────────────────────────────────────────────────
export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 — 角色
  const charUpload = useImageUpload();
  const [characterName, setCharacterName] = useState('');
  const [characterLabel, setCharacterLabel] = useState('孩子');

  // Step 2 — 场景
  const sceneUpload = useImageUpload();
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [sceneAnalysis, setSceneAnalysis] = useState<{
    scenes: string[]; activities: string[]; mood: string; summary: string;
  } | null>(null);
  const [characterDescription, setCharacterDescription] = useState('');
  const [suggestedThemes, setSuggestedThemes] = useState<string[]>([]);
  const analyzed = useRef(false);

  // Step 3 — 故事设定
  const [storyTheme, setStoryTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [educationalTheme, setEducationalTheme] = useState('');
  const [style, setStyle] = useState('水彩绘本');
  const [pageCount, setPageCount] = useState(6);

  // ── 场景分析 ──────────────────────────────────────────────────────────────
  async function handleAnalyze() {
    if (sceneUpload.urls.length === 0) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    analyzed.current = true;
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneImageUrls: sceneUpload.urls,
          characterImageUrl: charUpload.urls[0] ?? null,
          characterName: characterName || '小主角',
        }),
      });
      const data = await res.json() as {
        sceneAnalysis?: typeof sceneAnalysis;
        characterDescription?: string;
        suggestedThemes?: string[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? '分析失败');
      setSceneAnalysis(data.sceneAnalysis ?? null);
      setCharacterDescription(data.characterDescription ?? '');
      setSuggestedThemes(data.suggestedThemes ?? []);
      if (data.suggestedThemes?.[0]) setStoryTheme(data.suggestedThemes[0]);
      setStep(3);
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : '分析失败，请重试');
    } finally {
      setAnalyzing(false);
    }
  }

  // ── 开始生成 ──────────────────────────────────────────────────────────────
  async function handleStartGenerate() {
    const finalTheme = customTheme.trim() || storyTheme;
    if (!finalTheme) { alert('请选择或输入一个故事方向'); return; }

    const payload = {
      characterName: characterName || '小主角',
      characterLabel,
      characterDescription: characterDescription || `可爱的${characterLabel}`,
      characterPhotoUrl: charUpload.urls[0] ?? undefined,
      sceneAnalysis: sceneAnalysis ?? { scenes: [], activities: [], mood: '温馨', summary: '' },
      storyTheme: finalTheme,
      educationalTheme: educationalTheme || undefined,
      style,
      pageCount,
    };

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { jobId?: string; bookId?: string; error?: string };
      if (!res.ok || !data.jobId) throw new Error(data.error ?? '启动生成失败');
      await router.push(`/create/generating?jobId=${data.jobId}&bookId=${data.bookId}&title=${encodeURIComponent(characterName || '小主角')}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : '启动失败，请重试');
    }
  }

  // ── 渲染 ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>创作绘本 — 暖暖绘本</title>
        <link href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap" rel="stylesheet" />
      </Head>
      <div className="kid-page" style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '4rem' }}>

        {/* 顶部导航 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <Link href="/" style={{ color: 'var(--kid-text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← 返回首页
          </Link>
          <span className="kid-title" style={{ fontSize: '1.2rem' }}>暖暖绘本</span>
          <div style={{ width: '60px' }} />
        </div>

        {/* 步骤指示器 */}
        <StepBar current={step} />

        {/* ── Step 1：认识主角 ── */}
        {step === 1 && (
          <div className="kid-card" style={{ marginTop: '1.5rem' }}>
            <h2 className="kid-heading" style={{ marginBottom: '0.4rem' }}>今天的主角是谁？</h2>
            <p className="kid-muted" style={{ marginBottom: '1.5rem' }}>上传 1-3 张主角的照片，AI会记住这个人物</p>

            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>主角名字</label>
            <input
              className="kid-input"
              value={characterName}
              onChange={e => setCharacterName(e.target.value)}
              placeholder="例如：暖暖、爸爸、爷爷"
              style={{ marginBottom: '1.25rem' }}
            />

            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>主角是</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {CHARACTER_LABELS.map(label => (
                <button
                  key={label}
                  onClick={() => setCharacterLabel(label)}
                  style={{
                    padding: '0.45rem 1rem', borderRadius: '2rem', border: '2px solid',
                    borderColor: characterLabel === label ? 'var(--kid-magic)' : 'var(--kid-border-light)',
                    background: characterLabel === label ? 'var(--kid-magic)' : '#fff',
                    color: characterLabel === label ? '#fff' : 'var(--kid-text-primary)',
                    fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              上传主角照片 <span style={{ color: 'var(--kid-text-muted)', fontWeight: 400 }}>（1-3 张，选填）</span>
            </label>
            <PhotoDropZone
              urls={charUpload.urls}
              uploading={charUpload.uploading}
              error={charUpload.error}
              onDrop={charUpload.upload}
              onRemove={charUpload.remove}
              maxFiles={3}
              hint="上传主角的正面照，AI会记住外貌"
            />

            <button
              className="kid-btn-primary"
              style={{ width: '100%', marginTop: '1.75rem' }}
              onClick={() => setStep(2)}
            >
              下一步：上传今天的故事照片 →
            </button>
          </div>
        )}

        {/* ── Step 2：今天发生了什么 ── */}
        {step === 2 && (
          <div className="kid-card" style={{ marginTop: '1.5rem' }}>
            <h2 className="kid-heading" style={{ marginBottom: '0.4rem' }}>今天发生了什么故事？</h2>
            <p className="kid-muted" style={{ marginBottom: '1.5rem' }}>
              上传 3-15 张今天的活动照片，AI会自动识别场景并构思故事
            </p>

            <PhotoDropZone
              urls={sceneUpload.urls}
              uploading={sceneUpload.uploading}
              error={sceneUpload.error}
              onDrop={sceneUpload.upload}
              onRemove={sceneUpload.remove}
              maxFiles={15}
              hint="动物园、游乐场、生日派对、家庭旅行……任何照片都可以"
            />

            {analyzeError && (
              <div style={{
                marginTop: '1rem', padding: '0.75rem 1rem',
                background: '#fef2f2', border: '1px solid #fca5a5',
                borderRadius: '0.75rem', color: '#b91c1c', fontSize: '0.9rem',
              }}>
                ⚠️ {analyzeError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
              <button className="kid-btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>
                ← 上一步
              </button>
              <button
                className="kid-btn-primary"
                style={{ flex: 2 }}
                disabled={sceneUpload.urls.length === 0 || analyzing}
                onClick={handleAnalyze}
              >
                {analyzing ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="kid-spinner" /> AI 正在理解照片…
                  </span>
                ) : '✨ AI 分析照片，生成故事'}
              </button>
            </div>

            {sceneUpload.urls.length === 0 && (
              <p className="kid-caption" style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                没有照片也可以，直接
                <button
                  onClick={() => { setStep(3); setSuggestedThemes(['一次勇敢的探索冒险', '温暖的家人陪伴时光', '充满惊喜的快乐一天']); }}
                  style={{ background: 'none', border: 'none', color: 'var(--kid-magic)', cursor: 'pointer', fontWeight: 600 }}
                >
                  手动输入故事方向 →
                </button>
              </p>
            )}
          </div>
        )}

        {/* ── Step 3：故事设定 ── */}
        {step === 3 && (
          <div className="kid-card" style={{ marginTop: '1.5rem' }}>
            <h2 className="kid-heading" style={{ marginBottom: '0.4rem' }}>想讲一个什么故事？</h2>
            <p className="kid-muted" style={{ marginBottom: '1.5rem' }}>
              {sceneAnalysis ? `AI 识别到：${sceneAnalysis.scenes.slice(0, 3).join('、')}` : '选择一个故事方向'}
            </p>

            {/* 识别到的场景 tags */}
            {sceneAnalysis && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {[...sceneAnalysis.scenes, ...sceneAnalysis.activities].slice(0, 8).map(tag => (
                    <span key={tag} style={{
                      background: 'var(--kid-primary-soft)', color: 'var(--kid-primary-dark)',
                      borderRadius: '2rem', padding: '0.25rem 0.75rem', fontSize: '0.85rem', fontWeight: 600,
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI 推荐主题 */}
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              故事方向 <span style={{ color: 'var(--kid-text-muted)', fontWeight: 400 }}>（AI 推荐，可自定义）</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {suggestedThemes.map(theme => (
                <button
                  key={theme}
                  onClick={() => { setStoryTheme(theme); setCustomTheme(''); }}
                  style={{
                    padding: '0.75rem 1rem', borderRadius: '0.875rem', border: '2px solid',
                    borderColor: storyTheme === theme && !customTheme ? 'var(--kid-magic)' : 'var(--kid-border-light)',
                    background: storyTheme === theme && !customTheme ? '#f5f0ff' : '#fff',
                    color: 'var(--kid-text-primary)', textAlign: 'left',
                    fontWeight: storyTheme === theme && !customTheme ? 700 : 500,
                    fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {storyTheme === theme && !customTheme ? '✅ ' : '○ '}{theme}
                </button>
              ))}
            </div>
            <input
              className="kid-input"
              value={customTheme}
              onChange={e => setCustomTheme(e.target.value)}
              placeholder="或者自己写：例如「爸爸小时候的故事」"
              style={{ marginBottom: '1.5rem' }}
            />

            {/* 教育元素 */}
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              加入教育元素 <span style={{ color: 'var(--kid-text-muted)', fontWeight: 400 }}>（选填，寓教于乐）</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setEducationalTheme('')}
                style={{
                  padding: '0.4rem 0.875rem', borderRadius: '2rem', border: '2px solid',
                  borderColor: !educationalTheme ? 'var(--kid-magic)' : 'var(--kid-border-light)',
                  background: !educationalTheme ? 'var(--kid-magic)' : '#fff',
                  color: !educationalTheme ? '#fff' : 'var(--kid-text-muted)',
                  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                暂不添加
              </button>
              {EDUCATIONAL_THEMES.map(t => (
                <button
                  key={t}
                  onClick={() => setEducationalTheme(t)}
                  style={{
                    padding: '0.4rem 0.875rem', borderRadius: '2rem', border: '2px solid',
                    borderColor: educationalTheme === t ? 'var(--kid-magic)' : 'var(--kid-border-light)',
                    background: educationalTheme === t ? 'var(--kid-magic)' : '#fff',
                    color: educationalTheme === t ? '#fff' : 'var(--kid-text-primary)',
                    fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* 风格选择 */}
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>绘画风格</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {STYLES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  style={{
                    padding: '0.875rem', borderRadius: '0.875rem', border: '2px solid',
                    borderColor: style === s.value ? 'var(--kid-magic)' : 'var(--kid-border-light)',
                    background: style === s.value ? '#f5f0ff' : '#fff',
                    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.emoji}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: style === s.value ? 700 : 500, color: style === s.value ? 'var(--kid-magic-dark)' : 'var(--kid-text-primary)' }}>{s.label}</div>
                </button>
              ))}
            </div>

            {/* 页数 */}
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>绘本页数</label>
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '2rem' }}>
              {PAGE_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => setPageCount(n)}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '0.875rem', border: '2px solid',
                    borderColor: pageCount === n ? 'var(--kid-magic)' : 'var(--kid-border-light)',
                    background: pageCount === n ? '#f5f0ff' : '#fff',
                    fontWeight: 700, fontSize: '1rem',
                    color: pageCount === n ? 'var(--kid-magic-dark)' : 'var(--kid-text-primary)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {n} 页
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="kid-btn-secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>
                ← 上一步
              </button>
              <button
                className="kid-btn-primary"
                style={{ flex: 2 }}
                onClick={handleStartGenerate}
              >
                🪄 开始生成绘本！
              </button>
            </div>

            <p className="kid-caption" style={{ textAlign: 'center', marginTop: '1rem', opacity: 0.7 }}>
              预计需要 5-8 分钟，请耐心等待 ✨
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// ── 步骤条 ───────────────────────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  const steps = ['认识主角', '今天的故事', '故事设定'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '0.5rem' }}>
      {steps.map((label, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        return (
          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {i < steps.length - 1 && (
              <div style={{
                position: 'absolute', top: '14px', left: '50%', width: '100%',
                height: '2px',
                background: done ? 'var(--kid-magic)' : 'var(--kid-border-light)',
                zIndex: 0,
              }} />
            )}
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', zIndex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700,
              background: done ? 'var(--kid-magic)' : active ? 'var(--kid-primary)' : 'var(--kid-border-light)',
              color: done || active ? '#fff' : 'var(--kid-text-muted)',
            }}>
              {done ? '✓' : num}
            </div>
            <div style={{
              fontSize: '0.75rem', marginTop: '0.3rem',
              color: active ? 'var(--kid-primary)' : 'var(--kid-text-muted)',
              fontWeight: active ? 700 : 400, textAlign: 'center',
            }}>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 拖拽上传区域 ─────────────────────────────────────────────────────────────
function PhotoDropZone({
  urls, uploading, error, onDrop, onRemove, maxFiles, hint,
}: {
  urls: string[];
  uploading: boolean;
  error: string | null;
  onDrop: (files: File[]) => void;
  onRemove: (i: number) => void;
  maxFiles: number;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, maxFiles - urls.length);
    if (arr.length) onDrop(arr);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        style={{
          border: '2px dashed var(--kid-border-light)',
          borderRadius: '1rem',
          padding: '1.5rem',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          background: '#fafafa',
          transition: 'border-color 0.15s',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--kid-text-muted)' }}>
            <span className="kid-spinner" /> 上传中…
          </div>
        ) : (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📤</div>
            <p style={{ fontWeight: 600, color: 'var(--kid-text-primary)', marginBottom: '0.25rem', fontSize: '0.95rem' }}>
              点击或拖拽照片到这里
            </p>
            <p className="kid-caption">{hint}</p>
            <p className="kid-caption">最多 {maxFiles} 张</p>
          </>
        )}
      </div>

      {error && (
        <p style={{ color: 'var(--kid-error)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>
      )}

      {urls.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
          {urls.map((url, i) => (
            <div key={url} style={{ position: 'relative', width: '72px', height: '72px' }}>
              <img
                src={url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.5rem', border: '1.5px solid var(--kid-border-light)' }}
              />
              <button
                onClick={() => onRemove(i)}
                style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: '#ef4444', color: '#fff', border: 'none',
                  fontSize: '0.75rem', cursor: 'pointer', lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>
          ))}
          {urls.length < maxFiles && (
            <button
              onClick={() => inputRef.current?.click()}
              style={{
                width: '72px', height: '72px', borderRadius: '0.5rem',
                border: '2px dashed var(--kid-border-light)',
                background: 'transparent', cursor: 'pointer', fontSize: '1.5rem',
                color: 'var(--kid-text-muted)',
              }}
            >
              +
            </button>
          )}
        </div>
      )}
    </div>
  );
}
