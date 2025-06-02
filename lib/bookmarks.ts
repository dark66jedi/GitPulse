import { supabase } from './supabase';
import type { Repository } from './github';

export async function getBookmarkedRepos(userId: string) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  return data.map((item) => ({
    id: Number(item.repo_id),
    full_name: item.repo_name,
    description: item.repo_desc,
    html_url: item.repo_url,
  }));
}

export async function addBookmark(userId: string, repo: Repository) {
  const { error } = await supabase.from('bookmarks').insert({
    user_id: userId,
    repo_id: repo.id.toString(),
    repo_name: repo.name,
    repo_desc: repo.description,
    repo_url: repo.html_url,
  });

  if (error) throw error;
}

export async function removeBookmark(userId: string, repoId: number) {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('repo_id', repoId.toString());

  if (error) throw error;
}

export async function isBookmarked(userId: string, repoId: number) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('repo_id', repoId.toString());

  if (error) throw error;

  return data.length > 0;
}
