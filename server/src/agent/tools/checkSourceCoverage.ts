import { tool } from 'ai';
import { z } from 'zod';

import prisma from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

export function makeCheckSourceCoverageTool() {
  return tool({
    description:
      'Check whether the trusted source library covers a given course topic or set of content categories.',
    inputSchema: z.object({
      topic: z.string().describe('The proposed course topic to check coverage for'),
      categories: z
        .array(z.string())
        .optional()
        .describe(
          'Specific content categories to check. If omitted, the topic string is used for matching.',
        ),
    }),
    execute: async ({ topic, categories }) => {
      const searchTerms = categories ?? [topic];

      const activeSources = await prisma.trustedSource.findMany({
        where: { active: true },
        select: { id: true, name: true, domain: true, contentTypes: true, categories: true },
      });

      // Application-level substring matching (TrustedSource is a small reference table)
      const matchedSources = activeSources.filter((source) => {
        const sourceCats = source.categories as string[];
        return searchTerms.some((term) =>
          sourceCats.some(
            (cat) =>
              cat.toLowerCase().includes(term.toLowerCase()) ||
              term.toLowerCase().includes(cat.toLowerCase()),
          ),
        );
      });

      const coveredTerms = searchTerms.filter((term) =>
        matchedSources.some((s) =>
          (s.categories as string[]).some(
            (cat) =>
              cat.toLowerCase().includes(term.toLowerCase()) ||
              term.toLowerCase().includes(cat.toLowerCase()),
          ),
        ),
      );

      const uncoveredCategories = searchTerms.filter((t) => !coveredTerms.includes(t));
      const covered = uncoveredCategories.length === 0 && matchedSources.length > 0;

      logger.info(
        { topic, matchedCount: matchedSources.length, covered },
        'Source coverage check completed',
      );

      return {
        covered,
        matchedSources: matchedSources.map((s) => ({
          name: s.name,
          domain: s.domain,
          categories: s.categories as string[],
          contentTypes: s.contentTypes as string[],
        })),
        uncoveredCategories,
      };
    },
  });
}
