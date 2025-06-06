import { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import RepoCard from '../../components/RepoCard';
import SearchBar from '../../components/SearchBar';
import { github } from '../../lib/github';

type ViewMode = 'top' | 'trending';

export default function TopReposScreen() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ViewMode>('top');
  const [repoUrls, setRepoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRepos();
    }, 500);
    return () => clearTimeout(timeout);
  }, [query, view]);

  async function fetchRepos() {
    setLoading(true);
    try {
      let urls: string[];

      if (!query.trim()) {
        // No search — get general top/trending
        urls =
          view === 'top'
            ? await github.getTopStarredRepos()
            : await github.getTrendingReposLast30Days();
      } else {
        // Search mode — fetch matching repos from GitHub search API
        const response = await fetch(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=30`,
          {
            headers: {
              Accept: 'application/vnd.github+json',
            },
          }
        );
        const json = await response.json();
        const sorted = [...(json.items || [])];

        sorted.sort((a: any, b: any) => {
          if (view === 'top') {
            return b.stargazers_count - a.stargazers_count;
          } else {
            return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
          }
        });

        urls = sorted.slice(0, 10).map((repo: any) => repo.html_url);
      }

      setRepoUrls(urls);
    } catch (error) {
      console.error('Error loading repos:', error);
    } finally {
      setLoading(false);
    }
  }

  const renderTabs = () => (
    <View style={styles.tabs}>
      <TabButton label="Top 10" active={view === 'top'} onPress={() => setView('top')} />
      <TabButton label="Trending 10" active={view === 'trending'} onPress={() => setView('trending')} />
    </View>
  );

  return (
    <View style={styles.container}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search repositories..."
      />

      {renderTabs()}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={repoUrls}
          keyExtractor={(url) => url}
          renderItem={({ item }) => <RepoCard url={item} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No repositories found.
            </Text>
          }
        />
      )}
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tabButton, active && styles.activeTab]}>
      <Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#333',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
});