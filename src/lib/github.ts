export function parseRepoFullName(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Accept formats: https://github.com/owner/repo, http(s)://www.github.com/owner/repo, owner/repo
  try {
    if (trimmed.includes('github.com')) {
      const url = new URL(trimmed);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const repo = parts[1].replace(/\.git$/i, '');
        return `${parts[0]}/${repo}`;
      }
      return null;
    }
  } catch (_) {
    // Not a valid URL, fall through to owner/repo parsing
  }
  // owner/repo plain text
  const plain = trimmed.replace(/^\/*/, '');
  const parts = plain.split('/').filter(Boolean);
  if (parts.length === 2) {
    const repo = parts[1].replace(/\.git$/i, '');
    return `${parts[0]}/${repo}`;
  }
  return null;
}

export function buildGithubReposUrl(params: {
  search: string;
  perPage: number;
  page: number;
  githubUsername: string | null;
}): string {
  const { search, perPage, page, githubUsername } = params;
  let url = `https://api.github.com/user/repos?sort=updated&per_page=${perPage}&page=${page}`;

  // If search is provided, use the search API instead
  if (search) {
    const q = `${search}${githubUsername ? ` user:${githubUsername}` : ''}`;
    url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=${perPage}&page=${page}`;
  }

  return url;
}
