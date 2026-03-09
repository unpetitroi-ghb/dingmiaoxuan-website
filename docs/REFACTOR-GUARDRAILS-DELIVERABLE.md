# Refactor Guardrails – Final Deliverable

## 1. Concise summary of what changed

- **Business flow**: Creation is now a strict 5-phase flow: **选角 (Upload) → 构思 (Concept) → 编剧 (Script) → 绘图 (Generate) → 成书 (Preview)**. The **script confirmation step is a hard gate**: image generation only starts after the user explicitly confirms the script on the create page; the waiting page redirects to `/create` if there is no confirmed script.
- **State**: A central Zustand store (`store/createStore.ts`) holds phase, projectId, photos, character analysis, concept, scriptData, scriptConfirmed, and generation state. Important fields are persisted to sessionStorage via `lib/session.ts`; **hydration runs only in `useEffect`** to avoid hydration mismatch.
- **Script step**: A new **ScriptEditor** (`components/ScriptEditor.tsx`) lets users edit sceneTitle, imagePrompt, caption, dialogue, visualChecklist; add/delete/move scenes with safe renumbering; and optionally “润色” a scene. **No auto-confirm and no auto-start of image generation**; “确认脚本，开始绘图” is the only path to the waiting page.
- **APIs**: **`/api/generate-script`** (new) takes character_description, character_name, story_idea, style; calls DeepSeek; parses defensively and validates with zod; returns typed script. **`/api/generation/start`** accepts either a **confirmed script** (scriptData) from the client or the legacy createPayload; when scriptData is present, the backend does not generate script again and only submits Jimeng tasks per page.
- **Waiting page**: Reads from persisted creation state or legacy createPayload/generationState. Shows real per-page status (drawing / done / failed); potion bottle color reflects stage (purple vs orange); fairy click **only increases polling frequency** (no fake progress). On poll/network error, a **“重试连接”** button is shown.
- **Preview**: Still loads from `loadFullStory()` or sessionStorage; **PDF export, print, download current page, download ZIP, share** are all preserved in the unified bottom Magic Menu. Text remains editable; save goes through `saveFullStory`. Paper area uses `#fef9e7`; reading font KaiTi / ZCOOL KuaiLe. A **“分享到微信海报”** placeholder button was added (stub). FloatingToolbar was removed in favor of the single bottom bar.
- **Design**: `globals.css` updated (e.g. kid-card blur 8px / rgba 0.8, kid-btn-primary subtle pulse, kid-input 1.5rem radius, background `#FDFBFF`). Existing kid-* class names and purple/coral language kept.

---

## 2. File-by-file changed list

| File | Change |
|------|--------|
| `types/story.ts` | **New** – CreationPhase, CharacterProfile, StoryScript, StoryScriptPage, GenerationStatus, PreviewPageData, FullStory |
| `lib/story-schema.ts` | **New** – Zod schemas + normalizeScriptPageNumbers |
| `lib/session.ts` | **New** – save/load/clear creation state, saveFullStory/loadFullStory (client-only) |
| `store/createStore.ts` | **New** – Zustand store + actions; persist/hydrate |
| `store/useCreateStore.ts` | **New** – React hook for store |
| `components/ScriptEditor.tsx` | **New** – Script editor with validation; no auto-confirm; keep scene on polish failure |
| `pages/api/generate-script.ts` | **New** – POST; DeepSeek; defensive parse + zod; explicit error codes |
| `pages/api/generation/start.ts` | **Refactor** – Accept scriptData; when present, skip script generation; submit Jimeng tasks only |
| `pages/api/generation/status.ts` | **Comment** – Adapter boundary comment |
| `lib/deepseek.ts` | **Add** – generateStructuredScript + StructuredScriptParams/Result |
| `pages/create/index.tsx` | **Refactor** – 5-phase flow driven by store; PHASE_SCRIPT uses ScriptEditor; confirm → setProjectId, confirmScript, persist, push /create/waiting |
| `pages/create/waiting.tsx` | **Refactor** – Load from creation state or legacy payload; show real status; fairy = faster poll; retry button on error; failed state per page |
| `pages/create/preview.tsx` | **Refactor** – loadFullStory first, then sessionStorage fallback; saveFullStory on text save; paper #fef9e7; font; Magic Menu only (FloatingToolbar removed); WeChat poster stub; TODO mobile keyboard |
| `app/globals.css` | **Refactor** – kid-background #FDFBFF; kid-card 8px blur + 0.8; kid-btn-primary pulse; kid-input radius + min-height |
| `docs/REFACTOR-STEP-A-SUMMARY.md` | **New** – Analysis summary |
| `docs/REFACTOR-GUARDRAILS-DELIVERABLE.md` | **New** – This deliverable |

**Unchanged on purpose**: `pages/pricing.tsx`, `pages/admin/index.tsx`, `pages/_app.tsx`, `components/PhotoUploader.tsx`, `components/MagicMap.tsx`, `components/PaywallModal.tsx`. Routes and existing class names preserved.

---

## 3. Assumptions made

- **analyze-images** response shape is unchanged; `character_description` for generate-script is built on the client from `summary` + `all_labels` (and tags).
- **Pages Router** and current API layout are kept; no App Router migration.
- **Jimeng** (Volc) remains the image provider; `lib/jimeng` stays the single place for credentials and calls.
- **StoryScript** from generate-script uses the new schema (title, theme, targetAge, style, characterProfile, pages with pageNo, sceneTitle, imagePrompt, caption, dialogue, visualChecklist). Preview and fullStory still use the simpler shape (title, pages with index, text, imageUrl); caption/dialogue can be folded in later if needed.
- **Persistence key** `dingmiaoxuan_creation` and `fullStory` are stable; no version migration beyond the existing VERSION check.

---

## 4. TODOs requiring external wiring

- **DeepSeek**: `DEEPSEEK_API_KEY` must be set for `/api/generate-script`. If missing, the route returns 503 with a safe message.
- **Jimeng (Volc)**: `VOLC_ACCESSKEY` and `VOLC_SECRETKEY` (or `JIMENG_API_KEY` / `JIMENG_SECRET_KEY`) must be set for `/api/generation/start` and `/api/generation/status`. If missing, submit/getResult will throw; API returns 503.
- **Hunyuan**: `HUNYUAN_API_KEY` for `/api/analyze-images`. Response is used as-is; no extra normalization beyond what the front end does for `character_description`.
- **Share to WeChat poster**: Only a placeholder button and comment exist; no real implementation or backend.

---

## 5. Known risks or areas not fully completed

- **Refresh on create page**: After refresh, upload state (roleFiles/sceneFiles) is not restored (Files are not in sessionStorage). Only store fields (e.g. phase, characterDescription, scriptData) are restored. User may need to re-upload if they refresh in PHASE_UPLOAD.
- **Preview mobile keyboard**: A TODO was added; the editable text area may need scroll-into-view or viewport handling on small screens when the keyboard opens.
- **Failed page retry**: Waiting page shows “失败” for a page when status is `failed`, but there is no per-page “重试” for that single page; only a global “重试连接” for poll/network errors. Per-page retry would require backend support (e.g. resubmit one task).
- **3D / heavy effects**: Preview keeps a simple slide transition; no 3D flip that could break mobile, per guardrails.

---

## 6. Suggested next steps for David to test locally

1. **Install and run**: `npm install && npm run dev`.
2. **Full flow**: Upload photos → analyze → 构思 (name, story idea, style) → “生成脚本” → wait for script → edit in ScriptEditor if desired → “确认脚本，开始绘图” → waiting page (potion + grid) → wait for images (or use fairy to poll more often) → redirect to preview.
3. **Preview**: Check PDF export, print, download current page, download ZIP, share; edit text and flip pages; confirm data survives refresh (sessionStorage / loadFullStory).
4. **Guardrails**: Confirm that going directly to `/create/waiting` without confirming script redirects to `/create`. Confirm that “确认脚本” is disabled until every page has non-empty imagePrompt and caption.
5. **Pricing & admin**: Open `/pricing` and `/admin` and confirm they still load and behave as before.
6. **Errors**: Turn off or invalidate one of the API keys and confirm that generate-script or generation/start returns 503 with a safe message (no stack trace or key leak).
