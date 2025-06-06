import { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { github } from '../../lib/github';
import ContributorCard from '../../components/ContributorCard';
import ContributionCard from '../../components/ContributionCard';
import SearchBar from '../../components/SearchBar';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme'; // Add this import

export default function ContributorSearchScreen() {
  const [query, setQuery] = useState('');
  const [contributors, setContributors] = useState<any[]>([]);
  const [topContributors, setTopContributors] = useState<any[]>([]);
  const [recentContributions, setRecentContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Add theme hook
  const { theme } = useTheme();

  useEffect(() => {
    async function getUserId() {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
    }
    getUserId();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!query.trim() && userId) {
        loadFollowedData(userId);
      }
    }, [query, userId])
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim().length > 1) {
        searchContributors();
      } else if (userId) {
        loadFollowedData(userId);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  async function searchContributors() {
    setLoading(true);
    try {
      const results = await github.searchUsersByUsername(query);
      const enriched = await Promise.all(
        results.map((u) => github.getContributorStats(u.username))
      );
      setContributors(enriched);
      setTopContributors([]);
      setRecentContributions([]);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadFollowedData(userId: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('username')
        .eq('user_id', userId);

      if (error || !data || data.length === 0) {
        setTopContributors([]);
        setRecentContributions([]);
        return;
      }

      const usernames = data.map((row) => row.username);
      const userStats = [];
      const allContributions = [];

      for (const username of usernames) {
        try {
          const stats = await github.getContributorStats(username);
          const recent = await github.getRecentContributions(username);
          if (stats) userStats.push({ ...stats, username });
          if (recent) allContributions.push(...recent);
        } catch (err) {
          console.error(`Failed for ${username}:`, err);
        }
      }

      const sortedTop = userStats
        .sort((a, b) => b.totalCommitsLastMonth - a.totalCommitsLastMonth)
        .slice(0, 3);

      const sortedRecent = allContributions
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      setTopContributors(sortedTop);
      setRecentContributions(sortedRecent);
    } catch (err) {
      console.error('Loading followed data failed:', err);
    } finally {
      setLoading(false);
    }
  }

  // Create dynamic styles that use theme colors
  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      padding: 16, 
      backgroundColor: theme.colors.background 
    },
    searchBar: { 
      marginBottom: 12 
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginVertical: 12,
      color: theme.colors.text, // Use theme text color
    },
    empty: {
      textAlign: 'center',
      color: theme.colors.textSecondary || theme.colors.text,
      marginVertical: 16,
    },
  });

  return (
    <View style={styles.container}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search GitHub users..."
        style={styles.searchBar}
      />

      {query.length > 1 ? (
        <FlatList
          data={contributors}
          keyExtractor={(item) => item.username}
          renderItem={({ item }) => <ContributorCard contributor={item} />}
          refreshing={loading}
          onRefresh={() => userId && loadFollowedData(userId)}
          // Add theme-aware list styling
          style={{ backgroundColor: theme.colors.background }}
        />
      ) : (
        <ScrollView style={{ backgroundColor: theme.colors.background }}>
          <Text style={styles.sectionTitle}>Top Contributors You Follow</Text>
          {topContributors.length === 0 ? (
            <Text style={styles.empty}>No contributors yet</Text>
          ) : (
            topContributors.map((user) => (
              <ContributorCard key={user.username} contributor={user} />
            ))
          )}

          <Text style={styles.sectionTitle}>Recent Contributions</Text>
          {recentContributions.length === 0 ? (
            <Text style={styles.empty}>No recent activity</Text>
          ) : (
            recentContributions.map((contribution, index) => (
              <ContributionCard key={contribution.timestamp + index} contribution={contribution} />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}