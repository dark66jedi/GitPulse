import { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { github } from '../../lib/github';
import RepoUpdateCard from '../../components/RepoUpdateCard';
import type { RepoUpdate, HomeStats } from '../../lib/github';

export default function HomeScreen() {
  const [repoUpdates, setRepoUpdates] = useState<RepoUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [homeStats, setHomeStats] = useState<HomeStats>({
    total: 0,
    recentActivityCount: 0,
    followsCount: 0,
    mostStarred: null,
  });
  const [mostActiveRepo, setMostActiveRepo] = useState<RepoUpdate | null>(null);

  // Use useFocusEffect to reload data when tab becomes focused
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  async function loadAllData() {
    setLoading(true);
    try {
      console.log('Loading all home screen data...');
      
      // Fetch bookmarks and follows from Supabase
      const [bookmarksResult, followsResult] = await Promise.all([
        supabase.from('bookmarks').select('repo_url'),
        supabase.from('follows').select('id'),
      ]);

      if (bookmarksResult.error) {
        console.error('Error loading bookmarks:', bookmarksResult.error);
        throw bookmarksResult.error;
      }

      if (followsResult.error) {
        console.error('Error loading follows:', followsResult.error);
        throw followsResult.error;
      }

      const bookmarkUrls = (bookmarksResult.data || []).map((b: any) => b.repo_url);
      const followsCount = followsResult.data?.length || 0;

      console.log('Found bookmark URLs:', bookmarkUrls);
      console.log('Follows count:', followsCount);

      // Use optimized GitHub API functions
      const [stats, updates] = await Promise.all([
        github.getHomeStats(bookmarkUrls, followsCount),
        github.getAllBookmarkedRepoUpdates(bookmarkUrls),
      ]);

      console.log('Loaded stats:', stats);
      console.log('Loaded updates count:', updates.length);

      // Update state
      setHomeStats(stats);
      setRepoUpdates(updates);
      
      // Set most active repo (first in sorted list)
      if (updates.length > 0) {
        setMostActiveRepo(updates[0]);
      } else {
        setMostActiveRepo(null);
      }

    } catch (error) {
      console.error('Error loading home screen data:', error);
      // Set fallback data on error
      setHomeStats({
        total: 0,
        recentActivityCount: 0,
        followsCount: 0,
        mostStarred: null,
      });
      setRepoUpdates([]);
      setMostActiveRepo(null);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await loadAllData();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>👋 Welcome back!</Text>
      <Text style={styles.subheader}>Here's what's new in your bookmarks</Text>

      {mostActiveRepo && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔥 Most Active Repo</Text>
          <Text style={styles.repoName}>{mostActiveRepo.repo.name}</Text>
          <Text style={styles.cardInfo}>
            {mostActiveRepo.action} on {new Date(mostActiveRepo.timestamp).toLocaleString()}
          </Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{homeStats.total}</Text>
          <Text style={styles.statLabel}>Bookmarks</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{homeStats.recentActivityCount}</Text>
          <Text style={styles.statLabel}>Updates Today</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{homeStats.followsCount}</Text>
          <Text style={styles.statLabel}>Follows</Text>
        </View>
      </View>

      <View style={styles.statBoxWide}>
        <Text style={styles.statNumber}>
          {homeStats.mostStarred ? (
            `${homeStats.mostStarred.repo}`
          ) : (
            'No repos found'
          )}
        </Text>
        <Text style={styles.statNumber}>
          {homeStats.mostStarred ? (
            `${homeStats.mostStarred.stars}⭐`
          ) : (
            ''
          )}
        </Text>
        <Text style={styles.statLabel}>Most Starred</Text>
      </View>

      <Text style={styles.sectionTitle}>🗞 Recent Updates</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" />
      ) : (
        <FlatList
          data={repoUpdates}
          keyExtractor={(item, index) => `${item.repo.name}-${item.action}-${item.timestamp}-${index}`}
          renderItem={({ item }) => <RepoUpdateCard update={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {homeStats.total === 0 
                ? 'No bookmarked repos yet. Add some repos to see activity!'
                : 'No recent activity in your bookmarked repos.'
              }
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold' },
  subheader: { fontSize: 16, color: '#666', marginBottom: 16 },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  repoName: { fontSize: 18, fontWeight: '600' },
  cardInfo: { fontSize: 14, color: '#555' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 1,
  },
  statBoxWide: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#999' },
});