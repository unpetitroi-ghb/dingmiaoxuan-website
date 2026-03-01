'use client';

import { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface PhotoUploaderProps {
  onUploadSuccess: (publicUrl: string, file: File) => void;
  maxFiles?: number;
  uploading?: boolean;
  externalLoading?: boolean;
}

export default function PhotoUploader({
  onUploadSuccess,
  maxFiles = 1,
  uploading: externalUploading = false,
  externalLoading = false,
}: PhotoUploaderProps) {
  const [localUploading, setLocalUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64 ?? '');
      };
      reader.onerror = reject;
    });

  const uploadFile = useCallback(
    async (file: File, index: number) => {
      setCurrentFileIndex(index + 1);
      setUploadProgress(0);
      const tick = setInterval(() => setUploadProgress((p) => Math.min(p + 8, 85)), 120);
      try {
        const fileBase64 = await fileToBase64(file);
        const { data } = await axios.post('/api/upload-file', {
          filename: file.name,
          contentType: file.type || 'image/jpeg',
          fileBase64,
        });
        clearInterval(tick);
        setUploadProgress(100);
        onUploadSuccess(data.publicUrl, file);
      } finally {
        clearInterval(tick);
      }
    },
    [onUploadSuccess]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setLocalUploading(true);
      try {
        for (let i = 0; i < acceptedFiles.length; i++) await uploadFile(acceptedFiles[i], i);
      } catch (error) {
        console.error('Upload failed', error);
        alert('上传失败，请重试');
      } finally {
        setLocalUploading(false);
        setUploadProgress(0);
      }
    },
    [uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles,
    noClick: true,
  });

  const inputProps = getInputProps();
  const inputPropsWithRef = inputProps as typeof inputProps & { ref?: React.Ref<HTMLInputElement> };
  const mergeRef = (el: HTMLInputElement | null) => {
    (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
    const ref = inputPropsWithRef.ref;
    if (typeof ref === 'function') ref(el);
    else if (ref && typeof ref === 'object') (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
  };

  const isBusy = localUploading || externalUploading || externalLoading;

  return (
    <div
      {...getRootProps()}
      className={`
        rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition
        ${isDragActive ? 'border-kid-primary bg-kid-primary-soft/10' : 'border-kid-primary-soft/50 bg-white'}
        ${isBusy ? 'pointer-events-none opacity-90' : 'cursor-pointer hover:border-kid-primary/60'}
      `}
    >
      <input {...inputProps} ref={mergeRef} />
      {localUploading ? (
        <div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-kid-primary rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="kid-muted font-medium">
            {maxFiles > 1 ? `上传第 ${currentFileIndex} 张… ${uploadProgress}%` : `上传中 ${uploadProgress}%`}
          </p>
        </div>
      ) : isBusy ? (
        <p className="kid-muted font-medium">分析中…</p>
      ) : isDragActive ? (
        <p className="text-kid-primary font-medium">松开以上传照片</p>
      ) : (
        <div>
          <span className="text-4xl sm:text-5xl block mb-2" aria-hidden>📤</span>
          <p className="kid-muted mb-4">点击或拖拽照片到这里（最多 {maxFiles} 张）</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="kid-btn-secondary"
          >
            选择照片
          </button>
        </div>
      )}
    </div>
  );
}
