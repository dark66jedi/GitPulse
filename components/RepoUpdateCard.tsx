import { View, Text, Image, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import type { RepoUpdate } from '../lib/github';
import { useTheme } from '../lib/theme';
import Card from './Card'; // Adjust the import path as needed

type Props = {
  update: RepoUpdate;
};

export default function RepoUpdateCard({ update }: Props) {
  const { theme } = useTheme();
  const { repo, action, actor, message, timestamp } = update;

  const actionText =
    action === 'commit'
      ? 'pushed a commit to'
      : action === 'star'
      ? 'starred'
      : 'forked';

  const handleOpenRepo = () => {
    Linking.openURL(repo.url);
  };

  const handleOpenProfile = () => {
    if (actor.profileUrl) {
      Linking.openURL(actor.profileUrl);
    }
  };

  return (
    <Card onPress={handleOpenRepo}>
      <Text style={[styles.repoName, { color: theme.colors.text }]}>{repo.name}</Text>
      <View style={styles.row}>
        <TouchableOpacity onPress={handleOpenProfile}>
          <Image source={{ uri: actor.avatarUrl }} style={styles.avatar} />
        </TouchableOpacity>
        <Text style={[styles.description, { color: theme.colors.text }]}>
          <Text style={[styles.username, { color: theme.colors.primary }]}>{actor.username}</Text> {actionText} this repo
        </Text>
      </View>
      {message ? (
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>"{message}"</Text>
      ) : null}
      <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>{new Date(timestamp).toLocaleString()}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  repoName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  username: {
    fontWeight: '600',
  },
  description: {
    flex: 1,
    flexWrap: 'wrap',
  },
  message: {
    fontStyle: 'italic',
    marginTop: 6,
    // Removed static color
  },
  timestamp: {
    marginTop: 6,
    fontSize: 12,
    // Removed static color
  },
});