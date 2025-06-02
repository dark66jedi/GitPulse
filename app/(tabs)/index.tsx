import { useState, useEffect } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { github } from '../../lib/github';
import RepoCard from '../../components/RepoCard';
import type { Repository } from '../../lib/github';

export default function TrendingScreen() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingRepos();
    console.log(repos)
  }, []);

  async function loadTrendingRepos() {
    try {
      // TODO: Récupérer les repositories trending
      const trendingRepos = await github.getTrendingRepos();
      console.log(trendingRepos.items)
      setRepos(trendingRepos.items || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={repos}
        keyExtractor={(item) => item.id.toString()} // Ensure `id` is a string
        renderItem={({ item }) => <RepoCard repo={item} />}
      />
    </SafeAreaView>
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
});