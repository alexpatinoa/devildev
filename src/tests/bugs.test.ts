import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseRepoFullName, buildGithubReposUrl } from '@/lib/github';
import { updateChatUrlWithReloadWithDeps } from '@/lib/projectChatUrl';

describe('Bug confirmations', () => {
  describe('Import via GitHub link', () => {
    it('strips .git from clone URLs', () => {
      const result = parseRepoFullName('https://github.com/vercel/next.js.git');
      expect(result).toBe('vercel/next.js');
    });
  });

  describe('GitHub repo search pagination', () => {
    it('includes per_page and page in search URL', () => {
      const url = buildGithubReposUrl({
        search: 'react',
        perPage: 9,
        page: 2,
        githubUsername: 'alice',
      });
      const parsed = new URL(url);
      expect(parsed.searchParams.get('per_page')).toBe('9');
      expect(parsed.searchParams.get('page')).toBe('2');
    });
  });

  describe('Project chat URL update', () => {
    it('updates the URL without forcing a reload', () => {
      const deps = {
        location: {
          href: 'https://example.com/project/abc',
          reload: vi.fn(),
        },
        history: {
          replaceState: vi.fn(),
        },
      };
      updateChatUrlWithReloadWithDeps(deps, '123');
      expect(deps.history.replaceState).toHaveBeenCalled();
      expect(deps.location.reload).not.toHaveBeenCalled();
    });
  });
});
