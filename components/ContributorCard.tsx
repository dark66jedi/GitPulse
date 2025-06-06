import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import type { ContributorStats } from '../lib/github';
import { followUser, unfollowUser, isFollowing } from '../lib/follows';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';
import { useEffect, useState } from 'react';
import Card from './Card'; // Adjust the import path as needed

export default function ContributorCard({ contributor }: { contributor: ContributorStats }) {
    const { theme } = useTheme();
    const [userId, setUserId] = useState<string | null>(null);
    const [following, setFollowing] = useState(false);

    useEffect(() => {
        async function init() {
            const { data } = await supabase.auth.getUser();
            const id = data?.user?.id ?? null;
            setUserId(id);

            if (id) {
                const isFollowed = await isFollowing(id, contributor.username);
                setFollowing(isFollowed);
            }
        }

        init();
    }, []);

    async function handleToggleFollow() {
        if (!userId) return;

        try {
            if (following) {
                await unfollowUser(userId, contributor.username);
            } else {
                await followUser(userId, contributor.username);
            }
            setFollowing(!following);
        } catch (error) {
            console.error('Toggle follow failed:', error);
        }
    }

    return (
        <Card style={styles.cardOverride}>
            <View style={styles.header}>
                <Image source={{ uri: contributor.avatarUrl }} style={styles.avatar} />

                <View style={styles.infoContainer}>
                    <Text style={[styles.username, { color: theme.colors.text }]}>@{contributor.username}</Text>
                    {contributor.name && <Text style={[styles.name, { color: theme.colors.textSecondary }]}>{contributor.name}</Text>}
                </View>

                <Pressable 
                    onPress={handleToggleFollow} 
                    style={[styles.followBtn, { backgroundColor: theme.colors.primary }]}
                >
                    <Text style={[styles.followText, { color: theme.colors.background }]}>
                        {following ? 'Unfollow' : 'Follow'}
                    </Text>
                </Pressable>
            </View>

            <Text style={[styles.stats, { color: theme.colors.text }]}>🧮 {contributor.totalCommitsLastMonth} commits in the last 30 days</Text>
            <Text style={[styles.subheading, { color: theme.colors.text }]}>Most Active Repos:</Text>
            {contributor.topRepos ? (
                contributor.topRepos.map((repo, idx) => (
                    <Text key={idx} style={[styles.repoItem, { color: theme.colors.textSecondary }]}>
                        • {repo.name} ({repo.commits} commits)
                    </Text>
                ))
            ) : (
                <Text style={[styles.repoItem, { color: theme.colors.textSecondary }]}>Loading activity...</Text>
            )}
        </Card>
    );
}

const styles = StyleSheet.create({
    cardOverride: {
        padding: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    username: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    name: {
        fontSize: 14,
    },
    stats: {
        marginBottom: 8,
    },
    subheading: {
        fontWeight: '600',
        marginTop: 8,
        marginBottom: 4,
    },
    repoItem: {
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    infoContainer: {
        flex: 1,
        marginLeft: 12,
    },
    followBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    followText: {
        fontWeight: 'bold',
    },
});