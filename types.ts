
export interface MarkdownContent {
  text: string;
  title: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  EXPORTING = 'EXPORTING',
  ERROR = 'ERROR'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}

export interface ProcessingState {
  status: AppStatus;
  message?: string;
}
