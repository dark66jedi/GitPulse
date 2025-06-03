import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import {
  addBookmark,
  removeBookmark,
  isBookmarked,
} from '../lib/bookmarks';
import { github } from '../lib/github';
import { formatDistanceToNow } from 'date-fns';

type RepoProps = {
  id: number;
  name: string;
  owner: {
    login: string;
  };
  description: string;
  stargazers_count: number;
  full_name?: string;
  html_url?: string;
};

export default function RepoCard({ repo }: { repo: RepoProps }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [analytics, setAnalytics] = useState<{
    totalCommits: number;
    lastCommitDate: string | null;
  }>({ totalCommits: 0, lastCommitDate: null });

  // Get current user and check bookmark status
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          
          // Check if this repo is bookmarked
          const bookmarkStatus = await isBookmarked(user.id, repo.id);
          setBookmarked(bookmarkStatus);
        }
      } catch (error) {
        console.error('Error getting user or bookmark status:', error);
      }
    };

    getCurrentUser();
  }, [repo.id]);

  // Fetch commit analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Debug: Log what's being passed to the API
        console.log('Fetching analytics for:', {
          owner: repo.owner.login,
          name: repo.name,
          fullApiUrl: `https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits`
        });
        
        const data = await github.getCommitStats(repo.owner.login, repo.name);
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics for repo:', repo.name, error);
      }
    };

    fetchAnalytics();
  }, [repo.owner.login, repo.name]);

  const handleBookmark = async () => {
    if (!userId) return;

    try {
      if (bookmarked) {
        await removeBookmark(userId, repo.id);
      } else {
        await addBookmark(userId, {
          ...repo,
          name: `${repo.owner.login}/${repo.name}`,
          html_url: repo.html_url || `https://github.com/${repo.owner.login}/${repo.name}`,
        });
      }
      setBookmarked(!bookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  return (
    <Pressable style={styles.card}>
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

      {/* Analytics section */}
      <View style={{ marginTop: 8 }}>
        <Text>📝 Commits: {analytics.totalCommits}</Text>
        <Text>
          🕒 Last commit:{' '}
          {analytics.lastCommitDate
            ? formatDistanceToNow(new Date(analytics.lastCommitDate), { addSuffix: true })
            : 'N/A'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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