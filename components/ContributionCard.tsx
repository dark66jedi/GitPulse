import { View, Text, StyleSheet, Image } from 'react-native';
import { Linking } from 'react-native';
import { useTheme } from '../lib/theme';
import Card from './Card';

type Contribution = {
  repoName: string;
  repoUrl: string;
  author: string;
  authorAvatar?: string;
  message: string;
  timestamp: string;
};

export default function ContributionCard({ contribution }: { contribution: Contribution }) {
  const { theme } = useTheme();
  const timeAgo = getTimeAgo(contribution.timestamp);

  const handleOpenRepo = () => {
    Linking.openURL(contribution.repoUrl);
  };

  return (
    <Card onPress={handleOpenRepo} style={styles.cardOverride}>
      <View style={styles.header}>
        <Image source={{ uri: contribution.authorAvatar }} style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={[styles.author, { color: theme.colors.primary }]}>{contribution.author}</Text>
          <Text style={[styles.repoName, { color: theme.colors.textSecondary }]}>{contribution.repoName}</Text>
        </View>
        <Text style={[styles.timeAgo, { color: theme.colors.textSecondary }]}>{timeAgo}</Text>
      </View>

      <Text style={[styles.message, { color: theme.colors.text }]}>{contribution.message}</Text>
    </Card>
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

const styles = StyleSheet.create({
  cardOverride: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  author: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  repoName: {
    fontSize: 14,
  },
  timeAgo: {
    fontSize: 12,
  },
  message: {
    fontSize: 15,
    marginTop: 4,
  },
});