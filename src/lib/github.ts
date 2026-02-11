export function buildGithubReposUrl(params: {
  search: string;
  perPage: number;
  page: number;
  githubUsername: string | null;
}): string {
  const { search, perPage, page, githubUsername } = params;
  const trimmedSearch = search?.trim();
  let url = `https://api.github.com/user/repos?sort=updated&per_page=${perPage}&page=${page}`;

  // If search is provided, use the search API instead
  if (trimmedSearch) {
    const q = `${trimmedSearch}${githubUsername ? ` user:${githubUsername}` : ''}`;
    url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=${perPage}&page=${page}`;
  }

  return url;
}
