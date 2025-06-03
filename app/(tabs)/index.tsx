import { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  Text 
} from 'react-native';
import { github } from '../../lib/github';
import { supabase } from '../../lib/supabase';
import RepoCard from '../../components/RepoCard';
import type { Repository } from '../../lib/github';

let debounceTimeout: NodeJS.Timeout;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<Repository[]>([]);

  useEffect(() => {
    loadBookmarks();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setRepos([]); // clear search results if input is empty
      return;
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchRepos();
    }, 500); // wait 500ms after last keystroke

    return () => clearTimeout(debounceTimeout);
  }, [query]);

  // Helper function to extract owner and repo name from GitHub URL
  function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    try {
      // Handle URLs like: https://github.com/owner/repo
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        return {
          owner: match[1],
          repo: match[2]
        };
      }
      return null;
    } catch (error) {
      console.error('Error parsing GitHub URL:', url, error);
      return null;
    }
  }

  async function loadBookmarks() {
    setLoading(true);
    try {
      // Get bookmark URLs from Supabase
      const { data, error } = await supabase.from('bookmarks').select('repo_url');
      
      if (error) throw error;

      if (!data || data.length === 0) {
        setBookmarks([]);
        return;
      }

      // Extract owner/repo from URLs and fetch fresh data from GitHub
      const githubPromises = data.map(async (bookmark: any) => {
        try {
          const urlInfo = parseGitHubUrl(bookmark.repo_url);
          if (!urlInfo) {
            console.error('Invalid GitHub URL:', bookmark.repo_url);
            return null;
          }

          // Fetch fresh repository data from GitHub API
          const repoData = await github.getRepository(urlInfo.owner, urlInfo.repo);
          return repoData;
        } catch (error) {
          console.error(`Error fetching GitHub data for ${bookmark.repo_url}:`, error);
          return null;
        }
      });

      // Wait for all GitHub API calls to complete
      const githubResults = await Promise.all(githubPromises);
      
      // Filter out any failed requests (null values)
      const validRepos = githubResults.filter((repo): repo is Repository => repo !== null);

      console.log('Fresh bookmark data from GitHub:', validRepos.map(repo => ({
        id: repo.id,
        name: repo.name,
        owner: repo.owner?.login,
        stargazers_count: repo.stargazers_count,
      })));

      setBookmarks(validRepos);
    } catch (err) {
      console.error('Error loading bookmarks:', err);
    } finally {
      setLoading(false);
    }
  }

  async function searchRepos() {
    setLoading(true);
    try {
      const response = await github.searchRepos(query);
      setRepos(response.items || []);
    } catch (error) {
      console.error('Error searching repos:', error);
    } finally {
      setLoading(false);
    }
  }

  const displayRepos = query.trim() ? repos : bookmarks;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search repositories..."
        returnKeyType="search"
      />

      {loading ? (
        <ActivityIndicator style={styles.center} size="large" />
      ) : (
        <FlatList
          data={displayRepos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <RepoCard repo={item} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {query ? 'No search results found.' : 'No bookmarks yet.'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  input: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
});