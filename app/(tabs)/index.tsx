import { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Text,
  RefreshControl
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { github } from '../../lib/github';
import RepoUpdateCard from '../../components/RepoUpdateCard';
import type { RepoUpdate } from '../../lib/github';

export default function SearchScreen() {
  const [repoUpdates, setRepoUpdates] = useState<RepoUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
    }, [])
  );

  async function loadBookmarks() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('bookmarks').select('repo_url');
      if (error) throw error;

      const urls = (data || []).map((b: any) => b.repo_url);
      const updates = await Promise.all(
        urls.map(async (url) => {
          const path = new URL(url).pathname;
          const [, owner, repo] = path.split('/');
          try {
            return await github.getRepoUpdates(owner, repo);
          } catch {
            return [];
          }
        })
      );

      const sortedUpdates = updates.flat().sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setRepoUpdates(sortedUpdates);
    } catch (err) {
      console.error('Error loading bookmarks:', err);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await loadBookmarks();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.center} size="large" />
      ) : (
        <FlatList
          data={repoUpdates}
          keyExtractor={(item) => `${item.repo.name}-${item.action}-${item.timestamp}`}
          renderItem={({ item }) => <RepoUpdateCard update={item} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No bookmarks yet.
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
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
