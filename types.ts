export enum View {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  APP_BUILDER = 'APP_BUILDER',
  ABOUT = 'ABOUT',
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}