import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from 'react-native';
import RepoCard from '../../components/RepoCard';
import { github } from '../../lib/github';

type ViewMode = 'top' | 'trending';

export default function TopReposScreen() {
  const [repoUrls, setRepoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('top');

  useEffect(() => {
    const fetchRepos = async () => {
      setLoading(true);
      try {
        const urls =
          view === 'top'
            ? await github.getTopStarredRepos()
            : await github.getTrendingReposLast30Days();
        setRepoUrls(urls);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [view]);

  const renderTabs = () => (
    <View style={styles.tabs}>
      <TabButton label="Top 10" active={view === 'top'} onPress={() => setView('top')} />
      <TabButton label="Trending 10" active={view === 'trending'} onPress={() => setView('trending')} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        {renderTabs()}
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {renderTabs()}
      <FlatList
        data={repoUrls}
        keyExtractor={(url) => url}
        renderItem={({ item }) => <RepoCard url={item} />}
      />
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tabButton, active && styles.activeTab]}>
      <Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#333',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
