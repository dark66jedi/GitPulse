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

export type RepoMeta = {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  html_url: string;
  created_at: string;
  updated_at: string;
};

export type RepoUpdate = {
  id: string;
  repo: {
    name: string;         
    url: string;
  };
  action: 'commit' | 'star' | 'fork';
  actor: {
    username: string;
    avatarUrl: string;
    profileUrl: string;
  };
  message?: string;
  timestamp: string;
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

export type HomeStats = {
  total: number;
  recentActivityCount: number;
  followsCount: number;
  mostStarred: { repo: string; stars: number } | null;
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

// New function: Get basic repo metadata (lighter than getRepoDetailsByUrl)
async function getRepoMeta(owner: string, repo: string): Promise<RepoMeta> {
  try {
    const repoData = await fetchFromGitHub<RepoMeta>(`/repos/${owner}/${repo}`);
    return repoData;
  } catch (error) {
    console.error(`Error fetching repo meta for ${owner}/${repo}:`, error);
    throw error;
  }
}

// New function: Get home page stats efficiently
async function getHomeStats(bookmarkUrls: string[], followsCount: number): Promise<HomeStats> {
  try {    
    if (bookmarkUrls.length === 0) {
      return {
        total: 0,
        recentActivityCount: 0,
        followsCount,
        mostStarred: null,
      };
    }

    // Get all repo updates in parallel
    const updatesPromises = bookmarkUrls.map(async (url) => {
      const path = new URL(url).pathname;
      const [, owner, repo] = path.split('/');
      try {
        return await getRepoUpdates(owner, repo);
      } catch (error) {
        console.error(`Error getting updates for ${owner}/${repo}:`, error);
        return [];
      }
    });

    const allUpdates = await Promise.all(updatesPromises);
    const flatUpdates = allUpdates.flat();

    // Count today's activity
    const today = new Date().toISOString().split('T')[0];
    const recentActivityCount = flatUpdates.filter((update) => 
      update.timestamp.startsWith(today)
    ).length;

    // Find most starred repo
    const mostStarred = await getMostStarredRepo(bookmarkUrls);

    return {
      total: bookmarkUrls.length,
      recentActivityCount,
      followsCount,
      mostStarred,
    };
  } catch (error) {
    console.error('Error calculating home stats:', error);
    return {
      total: bookmarkUrls.length,
      recentActivityCount: 0,
      followsCount,
      mostStarred: null,
    };
  }
}

// New function: Get most starred repo from a list of URLs
async function getMostStarredRepo(urls: string[]): Promise<{ repo: string; stars: number } | null> {
  if (urls.length === 0) return null;
  
  let topRepo = null;
  let maxStars = -1;

  // Process repos in parallel with error handling
  const repoPromises = urls.map(async (url) => {
    try {
      const path = new URL(url).pathname;
      const [, owner, repo] = path.split('/');
      
      if (!owner || !repo) {
        console.warn('Invalid URL format:', url);
        return null;
      }

      const data = await getRepoMeta(owner, repo);
      return {
        repoName: `${owner}/${repo}`,
        stars: data.stargazers_count,
      };
    } catch (error) {
      console.error(`Error getting stars for ${url}:`, error);
      return null;
    }
  });

  const results = await Promise.all(repoPromises);
  
  // Find the repo with most stars
  for (const result of results) {
    if (result && result.stars > maxStars) {
      maxStars = result.stars;
      topRepo = result.repoName;
    }
  }

  return topRepo ? { repo: topRepo, stars: maxStars } : null;
}

// New function: Get all repo updates for bookmarked repos
async function getAllBookmarkedRepoUpdates(urls: string[]): Promise<RepoUpdate[]> {
  if (urls.length === 0) return [];

  const updatesPromises = urls.map(async (url) => {
    const path = new URL(url).pathname;
    const [, owner, repo] = path.split('/');
    try {
      return await getRepoUpdates(owner, repo);
    } catch (error) {
      console.error(`Error loading updates for ${owner}/${repo}:`, error);
      return [];
    }
  });

  const allUpdates = await Promise.all(updatesPromises);
  const flatUpdates = allUpdates.flat();

  // Sort by timestamp (most recent first)
  return flatUpdates.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
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
      const repoName = event.repo?.name;
      const repoUrl = `https://github.com/${repoName}`;
      const timestamp = event.created_at;
      const author = event.actor?.login ?? username;
      const authorAvatar = event.actor?.avatar_url ?? '';

      if (event.type === 'PushEvent') {
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

      if (event.type === 'PullRequestEvent') {
        const pr = event.payload.pull_request;
        if (pr) {
          contributions.push({
            repoName,
            repoUrl,
            author,
            authorAvatar,
            message: `Opened PR: ${pr.title}`,
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

async function getRepoUpdates(owner: string, repo: string): Promise<RepoUpdate[]> {
  const updates: RepoUpdate[] = [];

  const repoFullName = `${owner}/${repo}`;
  const repoUrl = `https://github.com/${repoFullName}`;

  try {
    // 🟡 Commits
    const commits = await fetchFromGitHub<any[]>(`/repos/${owner}/${repo}/commits?per_page=5`);
    for (const commit of commits) {
      updates.push({
        id: `${repoFullName}-commit-${commit.sha}`,
        repo: {
          name: repoFullName,
          url: repoUrl,
        },
        action: 'commit',
        actor: {
          username: commit.author?.login ?? 'unknown',
          avatarUrl: commit.author?.avatar_url ?? '',
          profileUrl: commit.author?.html_url ?? '',
        },
        message: commit.commit.message,
        timestamp: commit.commit.author.date,
      });
    }

    // 🟡 Stargazers (note: GitHub does not return star timestamps via REST API)
    const stargazers = await fetchFromGitHub<any[]>(`/repos/${owner}/${repo}/stargazers?per_page=3`);
    for (const user of stargazers) {
      updates.push({
        id: `${repoFullName}-star-${user.id}`,
        repo: {
          name: repoFullName,
          url: repoUrl,
        },
        action: 'star',
        actor: {
          username: user.login,
          avatarUrl: user.avatar_url,
          profileUrl: user.html_url,
        },
        timestamp: new Date().toISOString(), // Placeholder
      });
    }

    // 🟡 Forks
    const forks = await fetchFromGitHub<any[]>(`/repos/${owner}/${repo}/forks?per_page=3`);
    for (const fork of forks) {
      updates.push({
        id: `${repoFullName}-fork-${fork.id}`,
        repo: {
          name: repoFullName,
          url: repoUrl,
        },
        action: 'fork',
        actor: {
          username: fork.owner.login,
          avatarUrl: fork.owner.avatar_url,
          profileUrl: fork.owner.html_url,
        },
        timestamp: fork.created_at,
      });
    }
  } catch (error) {
    console.error(`Error fetching updates for ${owner}/${repo}:`, error);
  }

  // ⏳ Sort by timestamp (most recent first)
  return updates.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const github = {
  getRepoDetailsByUrl,
  getRepoMeta,
  getUserContributions,
  getContributorStats,
  searchUsersByUsername,
  getRecentContributions,
  getTopStarredRepos,
  getTrendingReposLast30Days,
  getRepoUpdates,
  getHomeStats,
  getMostStarredRepo,
  getAllBookmarkedRepoUpdates,
};