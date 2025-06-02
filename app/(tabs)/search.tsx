import { useState } from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { github } from '../../lib/github';
import RepoCard from '../../components/RepoCard';
import type { Repository } from '../../lib/github';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);

  async function searchRepos() {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // TODO: Récupérer les repositories recherchés
      const trendingRepos = await github.searchRepos(query);
      console.log(trendingRepos.items)
      setRepos(trendingRepos.items || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={searchRepos}
        placeholder="Search repositories..."
        returnKeyType="search"
      />
      {loading ? (
        <ActivityIndicator style={styles.center} size="large" />
      ) : (
        <FlatList
          data={repos}
          keyExtractor={(item) => item.id.toString()} // Ensure `id` is a string
          renderItem={({ item }) => <RepoCard repo={item} />}
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
});