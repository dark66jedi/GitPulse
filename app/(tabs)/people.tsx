import { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { github } from '../../lib/github';
import ContributorCard from '../../components/ContributorCard';
import ContributionCard from '../../components/ContributionCard';
import SearchBar from '../../components/SearchBar'; // Import the SearchBar component
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
    }

    getUserId();
  }, []);

  // Use useFocusEffect to refresh the feed when tab is focused
  useFocusEffect(
    useCallback(() => {
      async function refreshOnFocus() {
        if (query.trim().length === 0) {
          // Clear current data to force refresh
          setContributions([]);
          setContributors([]);
          
          // Get fresh userId on each focus
          const { data } = await supabase.auth.getUser();
          const currentUserId = data?.user?.id ?? null;
          
          if (currentUserId) {
            await loadFollowedContributions(currentUserId);
          }
        }
      }
      
      refreshOnFocus();
    }, [query]) // Remove userId dependency to avoid stale closure
  );

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

      if (!data || data.length === 0) {
        setContributions([]);
        setContributors([]);
        return;
      }

      const usernames = data.map((row) => row.username);
      
      // Add detailed logging for each user's contributions
      const allContributions = [];
      for (const username of usernames) {
        try {
          const userContributions = await github.getRecentContributions(username);
          allContributions.push(...userContributions);
        } catch (err) {
          console.error(`Error fetching contributions for ${username}:`, err);
        }
      }
      
      // Sort contributions by timestamp (most recent first)
      const sorted = allContributions.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          console.warn('Invalid date found in contributions:', a.timestamp, b.timestamp);
          return 0;
        }
        
        return dateB.getTime() - dateA.getTime();
      });
      
      setContributions(sorted);
      setContributors([]);
    } catch (err) {
      console.error('Loading contributions failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search GitHub users..."
        style={styles.searchBar}
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
        refreshing={loading}
        onRefresh={() => {
          if (query.trim().length === 0) {
            // Get fresh userId for manual refresh
            supabase.auth.getUser().then(({ data }) => {
              const currentUserId = data?.user?.id ?? null;
              if (currentUserId) {
                loadFollowedContributions(currentUserId);
              }
            });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  searchBar: {
    margin: 0,
    marginBottom: 12,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
});