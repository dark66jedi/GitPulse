import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

type Contribution = {
  repoName: string;
  repoUrl: string;
  author: string;
  message: string;
  timestamp: string; // ISO string
};

export default function ContributionCard({ contribution }: { contribution: Contribution }) {
  const timeAgo = getTimeAgo(contribution.timestamp);

  return (
    <Pressable style={styles.card} onPress={() => openRepo(contribution.repoUrl)}>
      <View style={styles.header}>
        <Text style={styles.author}>{contribution.author}</Text>
        <Text style={styles.repo}>{contribution.repoName}</Text>
      </View>
      <Text style={styles.message}>{contribution.message}</Text>
      <Text style={styles.timestamp}>🕒 {timeAgo}</Text>
    </Pressable>
  );
}

function getTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `just now`;
}

function openRepo(url: string) {
  // You can use `Linking.openURL` if you'd like
  console.log('Open repo:', url);
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  author: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#003366',
  },
  repo: {
    fontStyle: 'italic',
    color: '#444',
  },
  message: {
    marginVertical: 8,
    fontSize: 15,
  },
  timestamp: {
    color: '#666',
    fontSize: 13,
  },
});
