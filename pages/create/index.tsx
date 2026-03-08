'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import MagicMap from '@/components/MagicMap';
import PhotoUploader from '@/components/PhotoUploader';

const STEPS = [
  { name: '选角', icon: '👤' },
  { name: '线索', icon: '🔗' },
  { name: '故事', icon: '📖' },
  { name: '脚本', icon: '✏️' },
];

const STYLE_OPTIONS = [
  { value: '水彩', label: '水彩' },
  { value: '日漫', label: '日漫' },
  { value: '美漫', label: '美漫' },
  { value: '卡通', label: '卡通' },
  { value: '绘本', label: '绘本' },
];

export default function CreatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ summary: string; all_labels: string[] } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [characterName, setCharacterName] = useState('暖暖');
  const [storyIdea, setStoryIdea] = useState('');
  const [style, setStyle] = useState('绘本');

  const handleUploadSuccess = useCallback((publicUrl: string, file: File) => {
    setPhotoUrls((prev) => [...prev, publicUrl]);
    setPhotoFiles((prev) => [...prev, file]);
  }, []);

  const handleAnalyze = async () => {
    if (photoFiles.length === 0) {
      alert('请先上传至少一张照片');
      return;
    }
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const form = new FormData();
      photoFiles.forEach((f) => form.append('images[]', f));
      const { data } = await axios.post('/api/analyze-images', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnalysisResult({
        summary: data.summary || data.description || '',
        all_labels: data.all_labels || [],
      });
      setCompletedSteps((prev) => (prev.includes(0) ? prev : [...prev, 0]));
      setCurrentStep(1);
    } catch (err: unknown) {
      const ax = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number; data?: { message?: string } } }) : null;
      if (ax?.response?.status === 503) {
        setAnalysisError('AI 分析暂不可用，请检查 HUNYUAN_API_KEY 配置或稍后重试。');
      } else {
        setAnalysisError('分析失败，请重试。');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const goNext = (step: number) => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
    setCurrentStep(step + 1);
  };

  const goToGenerate = () => {
    const projectId = `proj_${Date.now()}`;
    sessionStorage.setItem('createPayload', JSON.stringify({
      photoUrls,
      analysisResult,
      imageLabels: analysisResult?.all_labels ?? [],
      characterName,
      storyIdea,
      style,
      projectId,
    }));
    router.push('/create/waiting');
  };

  return (
    <div className="kid-page min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="kid-muted text-sm hover:text-[var(--kid-primary)]">
            ← 返回首页
          </Link>
        </div>

        <MagicMap
          steps={STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />

        {/* Step 0: 选角 */}
        {currentStep === 0 && (
          <div className="kid-card p-6 space-y-4">
            <span className="bubble-label">上传照片</span>
            <PhotoUploader
              onUploadSuccess={handleUploadSuccess}
              maxFiles={5}
              uploading={analyzing}
            />
            {photoUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {photoUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`已选 ${i + 1}`}
                    className="kid-thumbnail rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
            {analysisError && (
              <p className="text-[var(--kid-error)] text-sm">{analysisError}</p>
            )}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || photoFiles.length === 0}
              className="kid-btn-primary w-full"
            >
              {analyzing ? '分析中…' : '下一步：分析照片'}
            </button>
          </div>
        )}

        {/* Step 1: 线索 */}
        {currentStep === 1 && (
          <div className="kid-card p-6 space-y-4">
            <span className="bubble-label">分析结果</span>
            {analysisResult && (
              <div className="kid-muted text-sm whitespace-pre-wrap bg-[var(--kid-card-alt)] p-4 rounded-xl">
                {analysisResult.summary}
              </div>
            )}
            <button
              type="button"
              onClick={() => goNext(1)}
              className="kid-btn-primary w-full"
            >
              下一步：故事设定
            </button>
          </div>
        )}

        {/* Step 2: 故事 */}
        {currentStep === 2 && (
          <div className="kid-card p-6 space-y-4">
            <label htmlFor="characterName" className="block">
              <span className="bubble-label">主角名字</span>
            </label>
            <input
              id="characterName"
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className="kid-input w-full"
              placeholder="例如：暖暖"
            />

            <label htmlFor="storyIdea" className="block">
              <span className="bubble-label">故事创意</span>
            </label>
            <textarea
              id="storyIdea"
              value={storyIdea}
              onChange={(e) => setStoryIdea(e.target.value)}
              className="kid-input w-full min-h-[120px]"
              placeholder="你想让故事发生什么？"
            />

            <label id="style-label" className="block">
              <span className="bubble-label">漫画风格</span>
            </label>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="style-label">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStyle(opt.value)}
                  className={`px-4 py-2 rounded-xl border-2 transition ${
                    style === opt.value
                      ? 'border-[var(--kid-magic)] bg-[var(--kid-magic-light)]/20 text-[var(--kid-magic-dark)]'
                      : 'border-[var(--kid-border-light)] hover:border-[var(--kid-magic-light)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => goNext(2)}
              className="kid-btn-primary w-full"
            >
              下一步：确认脚本
            </button>
          </div>
        )}

        {/* Step 3: 脚本 */}
        {currentStep === 3 && (
          <div className="kid-card p-6 space-y-4">
            <span className="bubble-label">确认信息</span>
            <dl className="kid-muted text-sm space-y-2">
              <dt className="font-medium text-[var(--kid-text-primary)]">主角</dt>
              <dd>{characterName}</dd>
              <dt className="font-medium text-[var(--kid-text-primary)]">风格</dt>
              <dd>{style}</dd>
              <dt className="font-medium text-[var(--kid-text-primary)]">故事创意</dt>
              <dd className="whitespace-pre-wrap">{storyIdea || '（未填写）'}</dd>
            </dl>
            <button
              type="button"
              onClick={goToGenerate}
              className="kid-btn-primary w-full"
            >
              开始生成漫画
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
