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

  async function loadBookmarks() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('bookmarks').select('*');

      if (error) throw error;

      const formatted: Repository[] = data.map((b: any) => ({
        id: b.repo_id,
        name: b.repo_name,
        description: b.repo_desc,
        owner: { login: b.repo_owner },
        stargazers_count: b.repo_stars,
        html_url: b.repo_url,
      }));

      setBookmarks(formatted);
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
