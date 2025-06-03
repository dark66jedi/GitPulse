import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import RepoCard from '../../components/RepoCard';

export default function TopReposScreen() {
  const [repoUrls, setRepoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.github.com/search/repositories?q=stars:>1&sort=stars&order=desc&per_page=10', {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const urls = data.items.map((repo: any) => repo.html_url);
        setRepoUrls(urls);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={repoUrls}
      keyExtractor={(url) => url}
      renderItem={({ item }) => <RepoCard url={item} />}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
