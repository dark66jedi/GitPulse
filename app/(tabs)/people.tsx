import { useState, useEffect } from 'react';
import { View, TextInput, FlatList, StyleSheet, Text } from 'react-native';
import { github } from '../../lib/github';
import ContributorCard from '../../components/ContributorCard';
import ContributionCard from '../../components/ContributionCard';
import { supabase } from '../../lib/supabase';

export default function ContributorSearchScreen() {
  const [query, setQuery] = useState('');
  const [contributors, setContributors] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function getUserId() {
      const { data } = await supabase.auth.getUser();
      const id = data?.user?.id ?? null;
      setUserId(id);

      if (id && query.trim().length === 0) {
        loadFollowedContributions(id);
      }
    }

    getUserId();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim().length > 1) {
        searchContributors();
      } else if (userId) {
        loadFollowedContributions(userId);
      } else {
        setContributors([]);
        setContributions([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  async function searchContributors() {
    setLoading(true);
    try {
      const results = await github.searchUsersByUsername(query);
      const enriched = await Promise.all(
        results.map((u) => github.getContributorStats(u.username))
      );
      setContributors(enriched);
      setContributions([]); // Clear feed when searching
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadFollowedContributions(userId: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('username')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching followed contributors:', error.message);
        return;
      }

      const usernames = data.map((row) => row.username);
      const allContributions = await Promise.all(
        usernames.map((u) => github.getRecentContributions(u))
      );

      const flattened = allContributions.flat(); // One feed
      setContributions(flattened);
      setContributors([]); // Clear contributor cards when showing feed
    } catch (err) {
      console.error('Loading contributions failed:', err);
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
        data={query.length > 1 ? contributors : contributions}
        keyExtractor={(item, index) =>
          query.length > 1 ? item.username : item.timestamp + index
        }
        renderItem={({ item }) =>
          query.length > 1 ? (
            <ContributorCard contributor={item} />
          ) : (
            <ContributionCard contribution={item} />
          )
        }
        ListEmptyComponent={
          !loading && (query.length > 1 || contributions.length === 0) ? (
            <Text style={styles.empty}>
              {query.length > 1 ? 'No users found' : 'No recent activity'}
            </Text>
          ) : null
        }
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
