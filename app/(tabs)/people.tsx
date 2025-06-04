import { useState, useEffect } from 'react';
import { View, TextInput, FlatList, StyleSheet, Text } from 'react-native';
import { github } from '../../lib/github';
import ContributorCard from '../../components/ContributorCard';

export default function ContributorSearchScreen() {
  const [query, setQuery] = useState('');
  const [contributors, setContributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim().length > 1) {
        loadContributors();
      } else {
        setContributors([]);
      }
    }, 400); // debounce

    return () => clearTimeout(delayDebounce);
  }, [query]);

  async function loadContributors() {
    setLoading(true);
    try {
      const results = await github.searchUsersByUsername(query);
      setContributors(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search GitHub users..."
        style={styles.input}
      />

      <FlatList
        data={contributors}
        keyExtractor={(item) => item.username}
        renderItem={({ item }) => <ContributorCard contributor={item} />}
        ListEmptyComponent={!loading && query.length > 1 ? <Text style={styles.empty}>No users found</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
});
