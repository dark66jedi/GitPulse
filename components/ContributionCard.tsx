import { View, Text, StyleSheet, Image } from 'react-native';
import { Linking } from 'react-native';
import Card from './Card'; // Adjust the import path as needed

type Contribution = {
  repoName: string;
  repoUrl: string;
  author: string;
  authorAvatar?: string; // optional but recommended
  message: string;
  timestamp: string; // ISO string
};

export default function ContributionCard({ contribution }: { contribution: Contribution }) {
  const timeAgo = getTimeAgo(contribution.timestamp);

  const handleOpenRepo = () => {
    Linking.openURL(contribution.repoUrl);
  };

  return (
    <Card onPress={handleOpenRepo} style={styles.cardOverride}>
      <View style={styles.header}>
        <Image source={{ uri: contribution.authorAvatar }} style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={styles.author}>{contribution.author}</Text>
          <Text style={styles.repoName}>{contribution.repoName}</Text>
        </View>
        <Text style={styles.timeAgo}>{timeAgo}</Text>
      </View>

      <Text style={styles.message}>{contribution.message}</Text>
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
    color: '#003366',
  },
  repoName: {
    fontSize: 14,
    color: '#666',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  message: {
    fontSize: 15,
    marginTop: 4,
  },
});