import { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  Text,
  RefreshControl
} from 'react-native';
import { supabase } from '../../lib/supabase';
import RepoCard from '../../components/RepoCard';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [repoUrls, setRepoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Reload bookmarks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!query.trim()) {
        loadBookmarks();
      }
    }, [query])
  );

  useEffect(() => {
    if (!query.trim()) {
      loadBookmarks();
      return;
    }

    const timeout = setTimeout(() => {
      searchRepos();
    }, 500);

    return () => clearTimeout(timeout);
  }, [query]);

  async function loadBookmarks() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('bookmarks').select('repo_url');
      if (error) throw error;

      const urls = (data || []).map((b: any) => b.repo_url);
      setRepoUrls(urls);
    } catch (err) {
      console.error('Error loading bookmarks:', err);
    } finally {
      setLoading(false);
    }
  }

  async function searchRepos() {
    setLoading(true);
    try {
      const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=10`, {
        headers: {
          Accept: 'application/vnd.github+json',
        },
      });
      const json = await response.json();
      const urls = (json.items || []).map((repo: any) => repo.html_url);
      setRepoUrls(urls);
    } catch (error) {
      console.error('Error searching repos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      if (!query.trim()) {
        await loadBookmarks();
      } else {
        await searchRepos();
      }
    } finally {
      setRefreshing(false);
    }
  }

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
          data={repoUrls}
          keyExtractor={(item) => item}
          renderItem={({ item }) => <RepoCard url={item} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {query ? 'No search results found.' : 'No bookmarks yet.'}
            </Text>
          }
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#007AFF']} // Android
              tintColor="#007AFF" // iOS
            />
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