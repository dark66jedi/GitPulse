const GITHUB_API_URL = 'https://api.github.com';

type GitHubResponse<T> = {
  items?: T[];
  message?: string;
};

type Repository = {
  id: number;
  name: string;
  owner: {
    login: string;
  };
  description: string;
  stargazers_count: number;
  html_url: string;
};

async function fetchFromGitHub<T>(endpoint: string): Promise<GitHubResponse<T>> {
  try {
    const response = await fetch(`${GITHUB_API_URL}${endpoint}`);

    if (!response.ok) {
      throw new Error('GitHub API error');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from GitHub:', error);
    throw error;
  }
}

export const github = {
  // Obtenir les repos tendance (limité à 30 résultats)
  getTrendingRepos: () => 
    fetchFromGitHub<Repository>('/search/repositories?q=stars:>1&sort=stars&order=desc&per_page=30'),
  
  // Rechercher des repos
  searchRepos: (query: string) => 
    fetchFromGitHub<Repository>(`/search/repositories?q=${encodeURIComponent(query)}&per_page=30`),
};

export type { Repository };