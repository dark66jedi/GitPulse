const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_TOKEN = process.env.EXPO_PUBLIC_GITHUB_TOKEN;

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

type Commit = {
  commit: {
    author: {
      date: string;
    };
  };
};

async function fetchFromGitHub<T>(endpoint: string): Promise<GitHubResponse<T>> {
  try {
    const response = await fetch(`${GITHUB_API_URL}${endpoint}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'RepoTrackerApp/1.0', // GitHub requires a User-Agent header
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('GitHub API Error Response:', errorBody);
      throw new Error(`GitHub API error: ${response.status} - ${errorBody}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from GitHub:', error);
    throw error;
  }
}

// Test function to verify your token works
async function testToken() {
  console.log('Token value:', GITHUB_TOKEN);
  try {
    console.log('Testing GitHub token...');
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'RepoTrackerApp/1.0',
      },
    });
    
    if (response.ok) {
      const user = await response.json();
      console.log('✅ Token works! User:', user.login);
      console.log('Rate limit remaining:', response.headers.get('x-ratelimit-remaining'));
    } else {
      const errorText = await response.text();
      console.log('❌ Token failed:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function getCommitStats(owner: string, repo: string): Promise<{ totalCommits: number; lastCommitDate: string | null }> {
  try {
    const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/commits?per_page=1`);

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const commits = await response.json();
    const lastCommitDate = commits[0]?.commit?.author?.date || null;

    // Get total commit count from Link header
    const linkHeader = response.headers.get('link');
    let totalCommits = 1;

    if (linkHeader) {
      const match = linkHeader.match(/&page=(\d+)>; rel="last"/);
      if (match && match[1]) {
        totalCommits = parseInt(match[1], 10);
      }
    }

    return { totalCommits, lastCommitDate };
  } catch (error) {
    console.error('Error fetching commit stats:', error);
    return { totalCommits: 0, lastCommitDate: null };
  }
}

export const github = {
  getTrendingRepos: () =>
    fetchFromGitHub<Repository>('/search/repositories?q=stars:>1&sort=stars&order=desc&per_page=10'),

  searchRepos: (query: string) =>
    fetchFromGitHub<Repository>(`/search/repositories?q=${encodeURIComponent(query)}&per_page=10`),

  getCommitStats,
  
  // Add this for testing your token
  testToken,
};

export type { Repository };