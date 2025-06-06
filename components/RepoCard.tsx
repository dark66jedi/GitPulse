import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { github } from '../lib/github';
import { supabase } from '../lib/supabase';
import { addBookmark, removeBookmark, isBookmarked } from '../lib/bookmarks';
import type { Repository } from '../lib/github';
import Card from './Card'; // Adjust the import path as needed

export default function RepoCard({ url }: { url: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [repo, setRepo] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);

  // Load current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null);
    });
  }, []);

  // Load repo data
  useEffect(() => {
    github.getRepoDetailsByUrl(url)
      .then(setRepo)
      .catch((err) => console.error('Failed to load repo data:', err));
  }, [url]);

  // Check bookmark status when user and repo are both loaded
  useEffect(() => {
    const check = async () => {
      if (userId && repo) {
        const isMarked = await isBookmarked(userId, repo.id);
        setBookmarked(isMarked);
        setLoading(false);
      }
    };
    check();
  }, [userId, repo]);

  async function handleBookmark() {
    if (!userId || !repo) return;

    try {
      if (bookmarked) {
        await removeBookmark(userId, repo.id);
      } else {
        await addBookmark(userId, {
          ...repo,
          name: `${repo.owner.login}/${repo.name}`,
          html_url: repo.html_url,
        });
      }
      setBookmarked(!bookmarked);
    } catch (error) {
      console.error('Bookmark action failed:', error);
    }
  }

  if (!repo || loading) return <Text>Loading...</Text>;

  const formatDate = (date: string | null) => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <Card style={styles.cardOverride}>
      <View style={styles.header}>
        <Text style={styles.title}>{repo.name}</Text>
        <Pressable onPress={handleBookmark}>
          <FontAwesome
            name={bookmarked ? 'bookmark' : 'bookmark-o'}
            size={20}
            color="#003366"
          />
        </Pressable>
      </View>
      <Text style={styles.owner}>{repo.owner.login}</Text>
      <Text style={styles.description}>{repo.description}</Text>
      <Text>⭐ {repo.stargazers_count}</Text>
      <Text>⏱ {repo.totalCommits} commits</Text>
      <Text>🕒 Last commit: {formatDate(repo.lastCommitDate)}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardOverride: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  owner: {
    color: '#666',
  },
  description: {
    marginTop: 8,
  },
});