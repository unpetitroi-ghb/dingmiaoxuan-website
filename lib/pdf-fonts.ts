import { Font } from '@react-pdf/renderer';

/**
 * 注册 PDF 用中文字体（用于导出时正确显示中文）
 * 使用 Noto Sans SC 的 woff2，若加载失败 PDF 会回退到 Helvetica
 */
const NOTO_SANS_SC_URL =
  'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.0.17/files/noto-sans-sc-chinese-simplified-400-normal.woff';

try {
  Font.register({
    family: 'NotoSansSC',
    src: NOTO_SANS_SC_URL,
  });
} catch {
  // 忽略注册失败（如无网络），PDF 将使用默认字体
}

export const pdfFontFamily = 'NotoSansSC';
