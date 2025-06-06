import { View, Text, Image, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import type { RepoUpdate } from '../lib/github';

type Props = {
  update: RepoUpdate;
};

export default function RepoUpdateCard({ update }: Props) {
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
    <TouchableOpacity onPress={handleOpenRepo} activeOpacity={0.9} style={styles.card}>
      <Text style={styles.repoName}>{repo.name}</Text>
      <View style={styles.row}>
        <TouchableOpacity onPress={handleOpenProfile}>
          <Image source={{ uri: actor.avatarUrl }} style={styles.avatar} />
        </TouchableOpacity>
        <Text style={styles.description}>
          <Text style={styles.username}>{actor.username}</Text> {actionText} this repo
        </Text>
      </View>
      {message ? <Text style={styles.message}>"{message}"</Text> : null}
      <Text style={styles.timestamp}>{new Date(timestamp).toLocaleString()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
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
    color: '#333',
  },
  timestamp: {
    marginTop: 6,
    color: '#666',
    fontSize: 12,
  },
});
