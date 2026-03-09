/**
 * 即梦 4.0 图片生成（火山引擎 HMAC 签名方式）
 */
import { Signer } from '@volcengine/openapi';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const volcSign = require('@volcengine/openapi/lib/base/sign') as {
  queryParamsToString: (p: Record<string, unknown>) => string;
};

const VOLC_HOST = 'visual.volcengineapi.com';
const VOLC_REGION = 'cn-north-1';
const VOLC_SERVICE = 'cv';
const REQ_KEY = 'jimeng_t2i_v40';

const VOLC_ACCESSKEY = process.env.VOLC_ACCESSKEY ?? '';
const VOLC_SECRETKEY = process.env.VOLC_SECRETKEY ?? '';

export const STYLE_PROMPTS: Record<string, string> = {
  '水彩绘本': '水彩插画风格，柔和温暖的色调，手绘质感，儿童绘本插画',
  '日漫': '日式动漫风格，明亮活泼的色彩，精细线条，可爱卡通',
  '3D卡通': '3D卡通渲染风格，圆润可爱，皮克斯动画风格，色彩丰富',
  '中国风': '中国水墨画风格，传统美术，淡雅清新，温馨故事感',
  '素描': '铅笔素描风格，黑白为主，细腻线条，温馨手绘感',
};

function signRequest(action: string, version: string, bodyStr: string) {
  const params = { Action: action, Version: version };
  const requestData = {
    region: VOLC_REGION,
    method: 'POST' as const,
    params: { ...params },
    headers: { 'Content-Type': 'application/json', Host: VOLC_HOST },
    body: bodyStr,
  };
  const signer = new Signer(requestData, VOLC_SERVICE);
  signer.addAuthorization({ accessKeyId: VOLC_ACCESSKEY, secretKey: VOLC_SECRETKEY });
  const queryString = volcSign.queryParamsToString(requestData.params);
  return { headers: requestData.headers as Record<string, string>, queryString };
}

async function submitTask(prompt: string, referenceImageUrl?: string): Promise<string> {
  const body: Record<string, unknown> = {
    req_key: REQ_KEY,
    prompt,
    force_single: true,
  };
  if (referenceImageUrl) body.image_urls = [referenceImageUrl];

  const bodyStr = JSON.stringify(body);
  const { headers, queryString } = signRequest('CVSync2AsyncSubmitTask', '2022-08-31', bodyStr);

  const res = await fetch(`https://${VOLC_HOST}?${queryString}`, {
    method: 'POST',
    headers,
    body: bodyStr,
  });

  const data = await res.json() as Record<string, unknown>;
  const err = (data?.ResponseMetadata as Record<string, unknown>)?.Error as Record<string, string> | undefined;
  if (err?.Message) throw new Error(`即梦提交失败: ${err.Message}`);

  const code = data?.code ?? data?.Code;
  if (code !== 10000 && code !== undefined) {
    throw new Error(`即梦提交失败 (code=${String(code)}): ${String(data?.message ?? data?.Message ?? '')}`);
  }

  const taskId = (data?.data as Record<string, unknown>)?.task_id as string;
  if (!taskId) throw new Error(`即梦未返回 task_id: ${JSON.stringify(data).slice(0, 200)}`);
  return taskId;
}

async function queryTask(taskId: string): Promise<{ status: string; imageUrls?: string[] }> {
  const body = JSON.stringify({ req_key: REQ_KEY, task_id: taskId, req_json: JSON.stringify({ return_url: true }) });
  const { headers, queryString } = signRequest('CVSync2AsyncGetResult', '2022-08-31', body);

  const res = await fetch(`https://${VOLC_HOST}?${queryString}`, {
    method: 'POST',
    headers,
    body,
  });

  const data = await res.json() as Record<string, unknown>;
  const err = (data?.ResponseMetadata as Record<string, unknown>)?.Error as Record<string, string> | undefined;
  if (err?.Message) throw new Error(`即梦查询失败: ${err.Message}`);

  const d = data?.data as Record<string, unknown> | undefined;
  return {
    status: String(d?.status ?? 'unknown'),
    imageUrls: d?.image_urls as string[] | undefined,
  };
}

async function pollUntilDone(taskId: string, timeoutMs = 120_000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await queryTask(taskId);
    if (result.status === 'done') {
      if (result.imageUrls?.length) return result.imageUrls[0];
      throw new Error('即梦任务完成但无图片');
    }
    if (result.status === 'not_found' || result.status === 'expired') {
      throw new Error(`即梦任务状态异常: ${result.status}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('即梦生成超时，请稍后重试');
}

export async function generateImage(params: {
  description: string;
  characterDescription: string;
  characterName: string;
  style: string;
  referenceImageUrl?: string;
}): Promise<string> {
  if (!VOLC_ACCESSKEY || !VOLC_SECRETKEY) {
    throw new Error('请配置 VOLC_ACCESSKEY 和 VOLC_SECRETKEY');
  }

  const stylePrompt = STYLE_PROMPTS[params.style] ?? '儿童绘本插画，温馨可爱';
  const prompt = [
    params.description,
    `主角是${params.characterName}（${params.characterDescription}）`,
    stylePrompt,
    '图面整洁，构图饱满，色彩鲜明，高质量',
  ].join('，');

  const taskId = await submitTask(prompt, params.referenceImageUrl);
  return pollUntilDone(taskId);
}
