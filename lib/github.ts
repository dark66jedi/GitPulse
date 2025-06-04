const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_TOKEN = process.env.EXPO_PUBLIC_GITHUB_TOKEN;

export type Repository = {
  id: number;
  name: string;
  owner: {
    login: string;
  };
  description: string;
  stargazers_count: number;
  html_url: string;
  totalCommits: number;
  lastCommitDate: string | null;
};

export type Contribution = {
  repoName: string;
  repoUrl: string;
  author: string;
  message: string;
  timestamp: string; // ISO 8601 string
};

export type ContributorStats = {
  username: string;
  name: string | null;
  avatarUrl: string;
  totalCommitsLastMonth: number;
  topRepos: { name: string; commits: number }[];
};

async function fetchFromGitHub<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${GITHUB_API_URL}${endpoint}`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`GitHub API Error ${response.status}:`, errorText);
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}

async function getRepoDetailsByUrl(url: string): Promise<Repository> {
  const path = new URL(url).pathname;
  const [, owner, repo] = path.split('/');

  // Fetch main repo data
  const repoData = await fetchFromGitHub<Omit<Repository, 'totalCommits' | 'lastCommitDate'>>(
    `/repos/${owner}/${repo}`
  );

  // Fetch last commit and total commit count
  const commitsResponse = await fetch(
    `${GITHUB_API_URL}/repos/${owner}/${repo}/commits?per_page=1`,
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  const linkHeader = commitsResponse.headers.get('Link');
  const commitsJson = await commitsResponse.json();

  let totalCommits = 1;
  if (linkHeader) {
    const match = linkHeader.match(/&page=(\d+)>; rel="last"/);
    if (match) {
      totalCommits = parseInt(match[1], 10);
    }
  }

  const lastCommitDate = commitsJson?.[0]?.commit?.author?.date || null;

  return {
    ...repoData,
    totalCommits,
    lastCommitDate,
  };
}

async function getUserContributions(username: string): Promise<Contribution[]> {
  const events = await fetchFromGitHub<any[]>(`/users/${username}/events/public`);

  return events
    .filter((e) => e.type === 'PushEvent')
    .flatMap((e) =>
      e.payload.commits.map((c: any) => ({
        repoName: e.repo.name,
        repoUrl: `https://github.com/${e.repo.name}`,
        author: c.author.name,
        message: c.message,
        timestamp: e.created_at,
      }))
    );
}

async function getContributorStats(username: string): Promise<ContributorStats> {
  const user = await fetchFromGitHub<{ name: string | null; avatar_url: string }>(`/users/${username}`);

  const events = await fetchFromGitHub<any[]>(`/users/${username}/events/public`);

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

  const commitsByRepo: Record<string, number> = {};

  let totalCommits = 0;

  for (const event of events) {
    if (event.type === 'PushEvent') {
      const eventDate = new Date(event.created_at);
      if (eventDate >= oneMonthAgo) {
        const repoName = event.repo.name;
        const commitCount = event.payload.commits?.length || 0;
        commitsByRepo[repoName] = (commitsByRepo[repoName] || 0) + commitCount;
        totalCommits += commitCount;
      }
    }
  }

  const topRepos = Object.entries(commitsByRepo)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, commits]) => ({ name, commits }));

  return {
    username,
    name: user.name,
    avatarUrl: user.avatar_url,
    totalCommitsLastMonth: totalCommits,
    topRepos,
  };
}

async function searchUsersByUsername(query: string) {
  if (!query) return [];

  const data = await fetchFromGitHub<{ items: any[] }>(`/search/users?q=${encodeURIComponent(query)}&per_page=10`);
  return data.items.map((user) => ({
    username: user.login,
    avatarUrl: user.avatar_url,
  }));
}

export const github = {
  getRepoDetailsByUrl,
  getUserContributions,
  getContributorStats,
  searchUsersByUsername,
};
