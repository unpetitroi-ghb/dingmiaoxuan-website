import axios from 'axios';
import { Signer } from '@volcengine/openapi';

// 使用与 Signer 内部完全一致的 query 编码，否则火山引擎会报 SignatureDoesNotMatch
const volcSign = require('@volcengine/openapi/lib/base/sign') as { queryParamsToString: (p: Record<string, unknown>) => string };

const VOLC_HOST = 'visual.volcengineapi.com';
const VOLC_REGION = 'cn-north-1';
const VOLC_SERVICE = 'cv';
const REQ_KEY = 'jimeng_t2i_v40';

const VOLC_ACCESSKEY = process.env.VOLC_ACCESSKEY ?? process.env.JIMENG_API_KEY ?? '';
const VOLC_SECRETKEY = process.env.VOLC_SECRETKEY ?? process.env.JIMENG_SECRET_KEY ?? '';

export interface ImageGenerationParams {
  prompt: string;
  style?: string;
  referenceImageUrl?: string;
}

function signRequest(
  action: string,
  version: string,
  bodyStr: string
): { headers: Record<string, string>; queryString: string } {
  try {
    const params = { Action: action, Version: version };
    const requestData = {
      region: VOLC_REGION,
      method: 'POST' as const,
      params: { ...params },
      headers: {
        'Content-Type': 'application/json',
        Host: VOLC_HOST,
      },
      body: bodyStr,
    };
    const signer = new Signer(requestData, VOLC_SERVICE);
    signer.addAuthorization({
      accessKeyId: VOLC_ACCESSKEY,
      secretKey: VOLC_SECRETKEY,
    });
    const queryString = volcSign.queryParamsToString(requestData.params);
    return { headers: requestData.headers as Record<string, string>, queryString };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`即梦签名失败: ${msg}`);
  }
}

/** 提交即梦 4.0 异步任务，返回 task_id */
async function submitTask(prompt: string, imageUrls?: string[]): Promise<string> {
  const body: Record<string, unknown> = {
    req_key: REQ_KEY,
    prompt,
    force_single: true,
  };
  if (imageUrls?.length) {
    body.image_urls = imageUrls;
  }
  const bodyStr = JSON.stringify(body);

  const { headers, queryString } = signRequest(
    'CVSync2AsyncSubmitTask',
    '2022-08-31',
    bodyStr
  );

  const url = `https://${VOLC_HOST}?${queryString}`;
  let response;
  try {
    response = await axios.post(url, bodyStr, {
      headers,
      validateStatus: () => true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`即梦请求失败（网络或鉴权）: ${msg}`);
  }

  const data = response.data;
  const err = data?.ResponseMetadata?.Error;
  if (err?.Message ?? err?.message) {
    throw new Error(`即梦提交任务失败 (${err.Code ?? err.CodeN ?? 'Error'}): ${err.Message ?? err.message}`);
  }
  const code = data?.code ?? data?.Code;
  if (code !== 10000 && code !== undefined) {
    const msg = data?.message ?? data?.Message ?? JSON.stringify(data);
    throw new Error(`即梦提交任务失败 (code=${code}): ${msg}`);
  }
  if (typeof data?.data !== 'object') {
    throw new Error(`即梦返回格式异常: ${JSON.stringify(data)}`);
  }

  const taskId = response.data?.data?.task_id;
  if (!taskId) {
    throw new Error(`即梦返回无 task_id: ${JSON.stringify(response.data)}`);
  }
  return taskId;
}

/** 查询即梦任务结果，返回 { status, image_urls? } */
async function getResult(taskId: string): Promise<{
  status: string;
  image_urls?: string[];
  message?: string;
}> {
  const body = {
    req_key: REQ_KEY,
    task_id: taskId,
    req_json: JSON.stringify({ return_url: true }),
  };
  const bodyStr = JSON.stringify(body);

  const { headers, queryString } = signRequest(
    'CVSync2AsyncGetResult',
    '2022-08-31',
    bodyStr
  );

  const url = `https://${VOLC_HOST}?${queryString}`;
  let response;
  try {
    response = await axios.post(url, bodyStr, {
      headers,
      validateStatus: () => true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`即梦查询请求失败: ${msg}`);
  }

  const resp = response.data;
  const err = resp?.ResponseMetadata?.Error;
  if (err?.Message ?? err?.message) {
    throw new Error(`即梦查询失败 (${err.Code ?? err.CodeN ?? 'Error'}): ${err.Message ?? err.message}`);
  }
  const code = resp?.code ?? resp?.Code;
  if (code !== 10000 && code !== undefined) {
    const msg = resp?.message ?? resp?.Message ?? JSON.stringify(resp);
    throw new Error(`即梦查询结果失败 (code=${code}): ${msg}`);
  }

  const data = response.data?.data ?? {};
  return {
    status: data.status || 'unknown',
    image_urls: data.image_urls,
    message: response.data?.message,
  };
}

/** 轮询直到完成或超时，返回第一张图 URL */
async function pollUntilDone(taskId: string, timeoutMs = 120000): Promise<string> {
  const start = Date.now();
  const interval = 2000;

  while (Date.now() - start < timeoutMs) {
    const result = await getResult(taskId);

    if (result.status === 'done') {
      if (result.image_urls?.length) {
        return result.image_urls[0];
      }
      throw new Error('即梦任务完成但无图片 URL');
    }
    if (result.status === 'not_found' || result.status === 'expired') {
      throw new Error(`即梦任务状态: ${result.status}`);
    }

    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error('即梦生成超时，请稍后重试');
}

export async function generateImage(params: ImageGenerationParams): Promise<string> {
  if (!VOLC_ACCESSKEY || !VOLC_SECRETKEY) {
    throw new Error('请配置 VOLC_ACCESSKEY 与 VOLC_SECRETKEY（或 JIMENG_API_KEY 与 JIMENG_SECRET_KEY）');
  }

  const imageUrls = params.referenceImageUrl ? [params.referenceImageUrl] : undefined;
  const taskId = await submitTask(params.prompt, imageUrls);
  return pollUntilDone(taskId);
}
