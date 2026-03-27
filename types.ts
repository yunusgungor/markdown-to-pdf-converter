
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

export class GeminiServiceError extends Error {
  code: 'missing_api_key' | 'invalid_api_key' | 'expired_api_key' | 'request_failed';

  constructor(
    code: 'missing_api_key' | 'invalid_api_key' | 'expired_api_key' | 'request_failed',
    message: string
  ) {
    super(message);
    this.name = 'GeminiServiceError';
    this.code = code;
  }
}
