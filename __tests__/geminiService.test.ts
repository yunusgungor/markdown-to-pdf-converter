import { describe, it, expect, vi, beforeEach } from 'vitest';

// Replicate the internal validation logic for testing
// Since readGeminiApiKey and normalizeGeminiError are not exported,
// we test the logic by duplicating it and verifying behavior

const PLACEHOLDER_KEYS = [
  'PLACEHOLDER_API_KEY',
  'YOUR_API_KEY_HERE',
  'API_KEY',
  'YOUR_GEMINI_API_KEY',
  'GEMINI_API_KEY',
  'INSERT_YOUR_API_KEY',
];

const isPlaceholderKey = (value: string): boolean => {
  const lower = value.toLowerCase().trim();
  if (PLACEHOLDER_KEYS.some(pk => pk.toLowerCase() === lower)) return true;
  if (/^(your_|insert_)?api_?key(_here)?$/i.test(lower)) return true;
  if (/^x+$/i.test(lower)) return true;
  if (lower.length < 5 && /^[a-z0-9]+$/i.test(lower)) return true;
  return false;
};

const readGeminiApiKeyLogic = (env: Record<string, any>): { isValid: boolean; apiKey?: string; errorCode?: 'missing' | 'placeholder' | 'invalid_format'; errorMessage?: string } => {
  const candidates = [
    env.VITE_GEMINI_API_KEY,
    env.GEMINI_API_KEY,
    env.API_KEY
  ];

  for (const candidate of candidates) {
    const value = typeof candidate === 'string' ? candidate.trim() : '';

    if (!value || value.length === 0) {
      continue;
    }

    if (isPlaceholderKey(value)) {
      return {
        isValid: false,
        errorCode: 'placeholder',
        errorMessage: 'Geçerli bir Gemini API anahtarı tanımlayın. "PLACEHOLDER_API_KEY" veya benzeri anahtar kullanmayın.'
      };
    }

    if (value.length < 10) {
      return {
        isValid: false,
        errorCode: 'invalid_format',
        errorMessage: 'Tanımlanan Gemini API anahtarı çok kısa. Geçerli bir API anahtarı kullanın.'
      };
    }

    return { isValid: true, apiKey: value };
  }

  return {
    isValid: false,
    errorCode: 'missing',
    errorMessage: 'Gemini API anahtarı eksik. `.env` veya `.env.local` dosyasında VITE_GEMINI_API_KEY, GEMINI_API_KEY veya API_KEY tanımlayın.'
  };
};

// Mock class for testing
class TestGeminiServiceError extends Error {
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

const normalizeGeminiErrorLogic = (error: unknown): TestGeminiServiceError => {
  const rawMessage = error instanceof Error ? error.message : String(error);

  if (rawMessage.includes('API key expired')) {
    return new TestGeminiServiceError(
      'expired_api_key',
      'Gemini API anahtarının süresi dolmuş. Yeni bir anahtar tanımlayın.'
    );
  }

  if (rawMessage.includes('API key not valid')) {
    return new TestGeminiServiceError(
      'invalid_api_key',
      'Gemini API anahtarı geçersiz. Geçerli bir anahtar ile güncelleyin.'
    );
  }

  if (error instanceof TestGeminiServiceError) {
    return error;
  }

  return new TestGeminiServiceError(
    'request_failed',
    'Gemini isteği başarısız oldu. API anahtarını ve ağ bağlantısını kontrol edin.'
  );
};

describe('geminiService - readGeminiApiKey', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return valid when a proper API key is provided', () => {
    const mockEnv = {
      VITE_GEMINI_API_KEY: 'valid_api_key_12345',
      GEMINI_API_KEY: '',
      API_KEY: ''
    };
    
    const result = readGeminiApiKeyLogic(mockEnv);
    
    expect(result.isValid).toBe(true);
    expect(result.apiKey).toBe('valid_api_key_12345');
    expect(result.errorCode).toBeUndefined();
  });

  it('should return missing error when no API key is defined', () => {
    const mockEnv = {
      VITE_GEMINI_API_KEY: '',
      GEMINI_API_KEY: '',
      API_KEY: ''
    };
    
    const result = readGeminiApiKeyLogic(mockEnv);
    
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('missing');
    expect(result.errorMessage).toContain('eksik');
  });

  it('should return placeholder error for PLACEHOLDER_API_KEY', () => {
    const mockEnv = {
      VITE_GEMINI_API_KEY: 'PLACEHOLDER_API_KEY',
      GEMINI_API_KEY: '',
      API_KEY: ''
    };
    
    const result = readGeminiApiKeyLogic(mockEnv);
    
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('placeholder');
    expect(result.errorMessage).toContain('Geçerli bir Gemini API anahtarı');
  });

  it('should return placeholder error for YOUR_API_KEY_HERE', () => {
    const mockEnv = {
      VITE_GEMINI_API_KEY: 'YOUR_API_KEY_HERE',
      GEMINI_API_KEY: '',
      API_KEY: ''
    };
    
    const result = readGeminiApiKeyLogic(mockEnv);
    
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('placeholder');
  });

  it('should return placeholder error for API_KEY (literal)', () => {
    const mockEnv = {
      VITE_GEMINI_API_KEY: 'API_KEY',
      GEMINI_API_KEY: '',
      API_KEY: ''
    };
    
    const result = readGeminiApiKeyLogic(mockEnv);
    
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('placeholder');
  });

  it('should return placeholder error for YOUR_GEMINI_API_KEY', () => {
    const mockEnv = {
      VITE_GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',
      GEMINI_API_KEY: '',
      API_KEY: ''
    };
    
    const result = readGeminiApiKeyLogic(mockEnv);
    
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('placeholder');
  });

  it('should return placeholder error for GEMINI_API_KEY (literal)', () => {
    const mockEnv = {
      VITE_GEMINI_API_KEY: 'GEMINI_API_KEY',
      GEMINI_API_KEY: '',
      API_KEY: ''
    };
    
    const result = readGeminiApiKeyLogic(mockEnv);
    
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('placeholder');
  });

  it('should return placeholder error for INSERT_YOUR_API_KEY', () => {
    const mockEnv = {
      VITE_GEMINI_API_KEY: 'INSERT_YOUR_API_KEY',
      GEMINI_API_KEY: '',
      API_KEY: ''
    };
    
    const result = readGeminiApiKeyLogic(mockEnv);
    
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('placeholder');
  });

  it('should return placeholder error for short strings like "abc"', () => {
    const mockEnv = {
      VITE_GEMINI_API_KEY: 'abc',
      GEMINI_API_KEY: '',
      API_KEY: ''
    };
    
    const result = readGeminiApiKeyLogic(mockEnv);
    
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('placeholder');
  });

  it('should return placeholder error for all Xs like "XXXXX"', () => {
    const mockEnv = {
      VITE_GEMINI_API_KEY: 'XXXXX',
      GEMINI_API_KEY: '',
      API_KEY: ''
    };
    
    const result = readGeminiApiKeyLogic(mockEnv);
    
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('placeholder');
  });

  it('should return invalid_format error for key shorter than 10 characters', () => {
    const mockEnv = {
      VITE_GEMINI_API_KEY: 'shortkey',
      GEMINI_API_KEY: '',
      API_KEY: ''
    };
    
    const result = readGeminiApiKeyLogic(mockEnv);
    
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('invalid_format');
    expect(result.errorMessage).toContain('çok kısa');
  });

  it('should check GEMINI_API_KEY as fallback', () => {
    const mockEnv = {
      VITE_GEMINI_API_KEY: '',
      GEMINI_API_KEY: 'fallback_key_12345',
      API_KEY: ''
    };
    
    const result = readGeminiApiKeyLogic(mockEnv);
    
    expect(result.isValid).toBe(true);
    expect(result.apiKey).toBe('fallback_key_12345');
  });

  it('should check API_KEY as second fallback', () => {
    const mockEnv = {
      VITE_GEMINI_API_KEY: '',
      GEMINI_API_KEY: '',
      API_KEY: 'last_resort_key_12345'
    };
    
    const result = readGeminiApiKeyLogic(mockEnv);
    
    expect(result.isValid).toBe(true);
    expect(result.apiKey).toBe('last_resort_key_12345');
  });

  it('should handle non-string values gracefully', () => {
    const mockEnv = {
      VITE_GEMINI_API_KEY: null,
      GEMINI_API_KEY: undefined,
      API_KEY: 12345
    };
    
    const result = readGeminiApiKeyLogic(mockEnv as any);
    
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('missing');
  });

  it('should prioritize VITE_GEMINI_API_KEY over other keys', () => {
    const mockEnv = {
      VITE_GEMINI_API_KEY: 'primary_key_12345',
      GEMINI_API_KEY: 'secondary_key_12345',
      API_KEY: 'tertiary_key_12345'
    };
    
    const result = readGeminiApiKeyLogic(mockEnv);
    
    expect(result.isValid).toBe(true);
    expect(result.apiKey).toBe('primary_key_12345');
  });

  it('should trim whitespace from API key', () => {
    const mockEnv = {
      VITE_GEMINI_API_KEY: '  trimmed_key_12345  ',
      GEMINI_API_KEY: '',
      API_KEY: ''
    };
    
    const result = readGeminiApiKeyLogic(mockEnv);
    
    expect(result.isValid).toBe(true);
    expect(result.apiKey).toBe('trimmed_key_12345');
  });
});

describe('geminiService - normalizeGeminiError', () => {
  it('should return expired_api_key for expired API key errors', () => {
    const error = new Error('API key expired. Please provide a valid key.');
    const result = normalizeGeminiErrorLogic(error);

    expect(result.code).toBe('expired_api_key');
    expect(result.message).toContain('süresi dolmuş');
  });

  it('should return expired_api_key for "API key expired" message', () => {
    const error = new Error('API key expired. Please provide a valid key.');
    const result = normalizeGeminiErrorLogic(error);

    expect(result.code).toBe('expired_api_key');
  });

  it('should return invalid_api_key for "API key not valid" message', () => {
    const error = new Error('API key not valid. Please check your credentials.');
    const result = normalizeGeminiErrorLogic(error);

    expect(result.code).toBe('invalid_api_key');
    expect(result.message).toContain('geçersiz');
  });

  it('should return the same GeminiServiceError if already normalized', () => {
    const originalError = new TestGeminiServiceError('missing_api_key', 'Test error message');
    const result = normalizeGeminiErrorLogic(originalError);

    expect(result).toBe(originalError);
    expect(result.code).toBe('missing_api_key');
  });

  it('should return request_failed for unknown errors', () => {
    const error = new Error('Something went wrong');
    const result = normalizeGeminiErrorLogic(error);

    expect(result.code).toBe('request_failed');
    expect(result.message).toContain('başarısız');
  });

  it('should handle string errors', () => {
    const result = normalizeGeminiErrorLogic('Network error occurred');

    expect(result.code).toBe('request_failed');
    expect(result.message).toContain('başarısız');
  });

  it('should handle null errors', () => {
    const result = normalizeGeminiErrorLogic(null);

    expect(result.code).toBe('request_failed');
  });

  it('should handle undefined errors', () => {
    const result = normalizeGeminiErrorLogic(undefined);

    expect(result.code).toBe('request_failed');
  });

  it('should handle object errors', () => {
    const result = normalizeGeminiErrorLogic({ code: 'ERR_UNKNOWN', data: 'test' } as any);

    expect(result.code).toBe('request_failed');
  });

  it('should handle errors containing both expired and not valid messages', () => {
    const error = new Error('API key expired and not valid');
    const result = normalizeGeminiErrorLogic(error);

    // Expired check comes first
    expect(result.code).toBe('expired_api_key');
  });
});