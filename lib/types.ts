export interface Project {
  id: string;
  name: string;
  style: string;
  theme: string;
  characterName: string;
  characterPhotoUrls: string[];
  pages: Page[];
  createdAt: string;
}

export interface Page {
  index: number;
  text: string;
  imageUrl?: string;
  imagePrompt?: string;
  status: 'pending' | 'generating' | 'done' | 'failed';
}

export interface GenerationTask {
  taskId: string;
  projectId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  pages: Page[];
}
