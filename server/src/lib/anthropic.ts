import { createAnthropic } from '@ai-sdk/anthropic';

import { config } from '../config.js';

export const anthropicProvider = config.ANTHROPIC_API_KEY
  ? createAnthropic({ apiKey: config.ANTHROPIC_API_KEY })
  : null;

export const DEFAULT_MODEL = 'claude-sonnet-4-5-20251001';
