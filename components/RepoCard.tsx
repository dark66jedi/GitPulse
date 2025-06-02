import { View, Text, Pressable, StyleSheet } from 'react-native';

type RepoProps = {
  id: number;
  name: string;
  owner: {
    login: string;
  };
  description: string;
  stargazers_count: number;
};

export default function RepoCard({ repo }: { repo: RepoProps }) {
  return (
    <Pressable style={styles.card}>
      <Text style={styles.title}>{repo.name}</Text>
      <Text style={styles.owner}>{repo.owner.login}</Text>
      <Text style={styles.description}>{repo.description}</Text>
      <Text>⭐ {repo.stargazers_count}</Text>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  owner: {
    color: '#666',
  },
  description: {
    marginTop: 8,
  },
});