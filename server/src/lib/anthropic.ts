import { createAnthropic } from '@ai-sdk/anthropic';

import { config } from '../config.js';

export const anthropicProvider = createAnthropic({ apiKey: config.ANTHROPIC_API_KEY });
export const DEFAULT_MODEL = 'claude-sonnet-4-5-20251001';
