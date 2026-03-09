/**
 * 绘本/漫画脚本类型定义
 * 供 generate-script API、ScriptEditor 组件等共用
 */

export interface StoryScriptPage {
  pageNo: number;
  sceneTitle: string;
  /** 给即梦用的画面描述（英文或中文均可） */
  imagePrompt: string;
  /** 绘本页面上展示的旁白/台词 */
  caption: string;
  /** 角色对话（可为空） */
  dialogue: string;
  /** 画面元素自查清单，可用于提示词补充 */
  visualChecklist: string[];
}

export interface StoryScriptCharacterProfile {
  name: string;
  coreTraits: string[];
  /** 视觉一致性描述，用于每页 prompt 插入 */
  visualConsistency: string;
}

export interface StoryScript {
  title: string;
  theme: string;
  targetAge: string;
  style: string;
  characterProfile: StoryScriptCharacterProfile;
  pages: StoryScriptPage[];
}
