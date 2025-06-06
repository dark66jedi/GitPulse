import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import type { ContributorStats } from '../lib/github';
import { followUser, unfollowUser, isFollowing } from '../lib/follows';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import Card from './Card'; // Adjust the import path as needed

export default function ContributorCard({ contributor }: { contributor: ContributorStats }) {
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
                    <Text style={styles.username}>@{contributor.username}</Text>
                    {contributor.name && <Text style={styles.name}>{contributor.name}</Text>}
                </View>

                <Pressable onPress={handleToggleFollow} style={styles.followBtn}>
                    <Text style={styles.followText}>
                        {following ? 'Unfollow' : 'Follow'}
                    </Text>
                </Pressable>
            </View>

            <Text style={styles.stats}>🧮 {contributor.totalCommitsLastMonth} commits in the last 30 days</Text>
            <Text style={styles.subheading}>Most Active Repos:</Text>
            {contributor.topRepos ? (
                contributor.topRepos.map((repo, idx) => (
                    <Text key={idx} style={styles.repoItem}>
                        • {repo.name} ({repo.commits} commits)
                    </Text>
                ))
            ) : (
                <Text style={styles.repoItem}>Loading activity...</Text>
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
        color: '#666',
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
        color: '#333',
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
        backgroundColor: '#003366',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    followText: {
        color: 'white',
        fontWeight: 'bold',
    },
});