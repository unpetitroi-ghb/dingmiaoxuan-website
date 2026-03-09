# 暖暖绘本 / dingmiaoxuan — Refactor Acceptance Report

## 1. ACCEPTANCE STATUS

**PASS WITH TODOs**

The strict business flow (upload → analyze → concept → script → confirm → generate → wait → preview → export) is implemented and verified. Remaining TODOs are limited to external API keys and one optional UX item (mobile keyboard).

---

## 2. WHAT WAS VERIFIED

- **Imports & types**: All imports resolve; props and types align (ScriptEditor, MagicMap, PhotoUploader, store, session, APIs). No removed component is still imported (FloatingToolbar removed from preview only).
- **Routes**: `/`, `/create`, `/create/waiting`, `/create/preview`, `/pricing`, `/admin` and all API routes exist and compile.
- **A. Upload phase**: User can upload multiple photos (PhotoUploader, role + scene). FormData uses `roleImages[]` / `sceneImages[]`; analyze-images accepts them (and legacy `images[]`). On success, characterDescription and characterProfile are stored; phase moves to PHASE_CONCEPT.
- **B. Concept phase**: User can input story idea, character name, and style (STYLE_OPTIONS). Validation: “生成脚本” requires characterDescription or storyIdea. generate-script API is called with character_description, character_name, story_idea, style.
- **C. Script phase**: Script renders in ScriptEditor; each scene has sceneTitle, imagePrompt, caption, dialogue, visualChecklist; add/delete/move with ensureSequentialPageNos. Confirmation is explicit (“确认脚本，开始绘图”); button disabled until scriptValid. Image generation cannot start without confirmScript (waiting page redirects if !scriptConfirmed).
- **D. Generate phase**: Waiting page reads creation state (scriptConfirmed, scriptData, projectId) or legacy createPayload/generationState. Per-page status (processing/done/failed) from generation/status. No fake progress; fairy only increases poll frequency. Retry button shown on poll/network error.
- **E. Preview phase**: Preview loads from loadFullStory() or sessionStorage fallback. Swipe (touch) and prev/next work. Text is editable (contentEditable + save on blur via saveFullStory). PDF export, print, download current page, download ZIP, share are preserved in the bottom Magic Menu. No duplicate toolbar.
- **API & data**: generate-script parses defensively; normalizes pages; validates with zod; returns 502/503 with safe messages. generation/start accepts scriptData or legacy payload; provider logic in lib/jimeng. No secrets in responses.
- **State & persistence**: currentPhase, scriptData, scriptConfirmed, projectId persist via saveCreationState; fromPersisted validates shape and has safe fallbacks. Hydration only in useEffect. Stale/invalid storage does not crash (validScript check, type guards).
- **Hydration / Next.js**: No sessionStorage/localStorage or window/document during render; all storage access is inside useEffect or event handlers. Pages Router only; no App Router confusion.
- **Pricing & admin**: Unchanged; no broken imports or routes.

---

## 3. ISSUES FOUND AND FIXED

| File | Issue | Fix |
|------|--------|-----|
| `pages/create/index.tsx` | After refresh with script confirmed, currentPhase could be PHASE_GENERATE but create page only renders UPLOAD/CONCEPT/SCRIPT → blank content. | Added useEffect: when currentPhase === 'PHASE_GENERATE' && scriptConfirmed, router.replace('/create/waiting'). |
| `pages/create/index.tsx` | When phase was PHASE_SCRIPT but scriptData was null (e.g. corrupt or cleared storage), user saw empty step. | In same useEffect: when currentPhase === 'PHASE_SCRIPT' && !scriptData, setPhase('PHASE_CONCEPT') and persist. |
| `store/createStore.ts` | fromPersisted assumed persisted shape was always valid; malformed scriptData or wrong types could cause runtime issues. | fromPersisted now validates scriptData (object + non-empty pages array), uses typeof checks and Array.isArray, and falls back to safe defaults for all fields. |
| `pages/api/generate-script.ts` | Unused extractJson function (dead code). | Removed extractJson; JSON stripping remains in lib/deepseek for generateStructuredScript. |

---

## 4. REMAINING TODOs

- **DeepSeek**: Set `DEEPSEEK_API_KEY` for `/api/generate-script`. Without it, API returns 503 with a safe message.
- **Jimeng (Volc)**: Set `VOLC_ACCESSKEY` and `VOLC_SECRETKEY` (or JIMENG_* ) for image generation. Required for `/api/generation/start` and `/api/generation/status`.
- **Hunyuan**: Set `HUNYUAN_API_KEY` for `/api/analyze-images`.
- **Preview mobile keyboard**: TODO in code — ensure editable text area scrolls into view when focused on mobile so keyboard does not hide it.
- **Share to WeChat poster**: Placeholder button only; no implementation.

---

## 5. FILES CHANGED IN THIS QA PASS

- `pages/create/index.tsx` — Redirect when phase is PHASE_GENERATE; fallback PHASE_SCRIPT → PHASE_CONCEPT when scriptData is missing.
- `store/createStore.ts` — Safer fromPersisted with validation and default fallbacks.
- `pages/api/generate-script.ts` — Removed unused extractJson.
- `docs/ACCEPTANCE-REPORT.md` — Added (this report).

---

## 6. LOCAL TEST PLAN FOR DAVID

1. **Open**: `http://localhost:3000` (or your dev URL).
2. **Upload photos**: Go to “开始创作” or `/create`. Under “Role” and “Scene”, upload at least one photo each (or use the same for both). Click “下一步：提炼视觉精华”.
3. **Analyze**: Ensure analyze-images runs (HUNYUAN_API_KEY set). After success you should see the “构思” step (tags/summary).
4. **Concept**: Enter 主角名字, 故事创意, choose 漫画风格. Click “生成脚本”.
5. **Generate script**: Wait for generate-script (DEEPSEEK_API_KEY set). Script step appears with ScriptEditor.
6. **Edit script**: Change any scene’s 画面描述 or 旁白. Optionally add/delete/move pages. Ensure “确认脚本，开始绘图” stays disabled until every page has non-empty 画面描述 and 旁白.
7. **Confirm script**: Click “确认脚本，开始绘图”. You should be redirected to `/create/waiting`.
8. **Start generation**: Waiting page should call generation/start (with scriptData) and show the grid + potion. Set VOLC_* for Jimeng; otherwise you will see an error and can use “重试连接” after fixing.
9. **Wait / poll**: Let status poll or click the fairy to poll more often. When all pages are done, you are redirected to `/create/preview`.
10. **Preview**: Check page navigation (buttons and swipe). Edit text and blur to save. Use bottom Magic Menu: 导出 PDF, 分享, 打印, 下载当前页, 下载全部 ZIP, 返回首页. Confirm PDF export, print, download current, and ZIP all work.

**Guardrail checks**

- Direct open of `/create/waiting` without confirming script → should redirect to `/create`.
- Refresh on `/create` after confirming script → should redirect to `/create/waiting` (or show waiting if generationState exists).
- Pricing: Open `/pricing` — page loads. Admin: Open `/admin` — page loads (login may be required).

---

## 7. KNOWN RISKS

- **Refresh on create (upload step)**: roleFiles/sceneFiles are not persisted (File not storable). User must re-upload if they refresh in PHASE_UPLOAD.
- **Per-page retry**: Waiting page shows “失败” for a page when status is `failed`, but there is no per-page “重试”;
  only global “重试连接” for poll/network errors. Per-page retry would need backend support.
- **Jimeng rate limits / errors**: If the provider returns errors or rate limits, the user sees the API error message and can retry; no automatic retry of failed pages.
