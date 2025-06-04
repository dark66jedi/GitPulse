import { useState } from 'react';
import { View, TextInput, FlatList, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { github, Contribution } from '../../lib/github';
import ContributionCard from '../../components/ContributionCard';

export default function PeopleScreen() {
  const [username, setUsername] = useState('');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!username.trim()) return;
    setLoading(true);
    try {
      const data = await github.getUserContributions(username.trim());
      setContributions(data);
    } catch (err) {
      console.error('Failed to fetch contributions:', err);
      setContributions([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        value={username}
        onChangeText={setUsername}
        onSubmitEditing={handleSearch}
        placeholder="Enter GitHub username"
        style={styles.input}
        returnKeyType="search"
      />
      {loading ? (
        <ActivityIndicator style={styles.loading} size="large" />
      ) : (
        <FlatList
          data={contributions}
          keyExtractor={(item, index) => `${item.repoUrl}-${index}`}
          renderItem={({ item }) => <ContributionCard contribution={item} />}
          ListEmptyComponent={<Text style={styles.empty}>No contributions found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  loading: { marginTop: 20 },
  empty: { textAlign: 'center', marginTop: 20, color: '#666' },
});
