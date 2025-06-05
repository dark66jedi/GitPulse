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
  authorAvatar: string;
  message: string;
  timestamp: string;
};

export type ContributorStats = {
  username: string;
  name?: string;
  avatarUrl: string;
  totalCommitsLastMonth: number;
  topRepos: {
    name: string;
    commits: number;
  }[];
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
  const repos = await fetchFromGitHub<any[]>(`/users/${username}/repos?per_page=100`);

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const repoStats = await Promise.all(
    repos.map(async (repo) => {
      try {
        const commits = await fetchFromGitHub<any[]>(
          `/repos/${repo.owner.login}/${repo.name}/commits?author=${username}&since=${since}`
        );
        return {
          name: repo.name,
          commits: commits.length,
        };
      } catch (err) {
        console.warn(`Failed to fetch commits for ${repo.name}`, err);
        return {
          name: repo.name,
          commits: 0,
        };
      }
    })
  );

  const activeRepos = repoStats
    .filter((r) => r.commits > 0)
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 3);

  const totalCommits = repoStats.reduce((acc, r) => acc + r.commits, 0);

  console.log({username,
    name: user.name ?? undefined,
    avatarUrl: user.avatar_url,
    totalCommitsLastMonth: totalCommits,
    topRepos: activeRepos})

  return {
    username,
    name: user.name ?? undefined,
    avatarUrl: user.avatar_url,
    totalCommitsLastMonth: totalCommits,
    topRepos: activeRepos,
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

async function getRecentContributions(username: string): Promise<Contribution[]> {
  try {
    const events = await fetchFromGitHub<any[]>(`/users/${username}/events/public`);

    const contributions: Contribution[] = [];

    for (const event of events) {
      if (event.type === 'PushEvent') {
        const repoName = event.repo.name;
        const repoUrl = `https://github.com/${repoName}`;
        const timestamp = event.created_at;
        const author = event.actor?.login ?? username;
        const authorAvatar = event.actor?.avatar_url ?? '';

        for (const commit of event.payload.commits) {
          contributions.push({
            repoName,
            repoUrl,
            author,
            authorAvatar,
            message: commit.message,
            timestamp,
          });
        }
      }
    }

    return contributions;
  } catch (error) {
    console.error(`Failed to fetch recent contributions for ${username}:`, error);
    return [];
  }
}

function getLast30DaysDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30); // subtract 30 days
  return d.toISOString().split('T')[0]; // format as YYYY-MM-DD
}

async function getTopStarredRepos(): Promise<string[]> {
  const data = await fetchFromGitHub<{ items: any[] }>(
    `/search/repositories?q=stars:>1&sort=stars&order=desc&per_page=10`
  );
  return data.items.map((repo) => repo.html_url);
}

async function getTrendingReposLast30Days(): Promise<string[]> {
  const since = getLast30DaysDate();
  const data = await fetchFromGitHub<{ items: any[] }>(
    `/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=10`
  );
  return data.items.map((repo) => repo.html_url);
}


export const github = {
  getRepoDetailsByUrl,
  getUserContributions,
  getContributorStats,
  searchUsersByUsername,
  getRecentContributions,
  getTopStarredRepos,
  getTrendingReposLast30Days
};
