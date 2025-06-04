import { supabase } from './supabase';

export async function isFollowing(userId: string, username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('user_id', userId)
    .eq('username', username)
    .single();

  return !!data && !error;
}

export async function followUser(userId: string, username: string) {
  const { error } = await supabase
    .from('follows')
    .insert([{ user_id: userId, username }]); // Match keys exactly

  if (error) {
    console.error('Error following user:', error.message);
    throw error;
  }
}


export async function unfollowUser(userId: string, username: string) {
  return supabase.from('follows')
    .delete()
    .eq('user_id', userId)
    .eq('username', username);
}
