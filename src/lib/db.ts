import { supabase } from './supabase';
import type { Field, CropAssessment, Conversation, ConversationMessage, CommunityPost, CommunityComment, Alert, FarmerProfile, CommunityReport } from '../types';

export async function getProfile(userId: string): Promise<FarmerProfile | null> {
  const { data } = await supabase
    .from('farmer_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data as FarmerProfile | null;
}

export async function upsertProfile(userId: string, updates: Partial<FarmerProfile>): Promise<FarmerProfile | null> {
  const { data } = await supabase
    .from('farmer_profiles')
    .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
    .select('*')
    .maybeSingle();
  return data as FarmerProfile | null;
}

export async function getFields(userId: string): Promise<Field[]> {
  const { data } = await supabase
    .from('fields')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []) as Field[];
}

export async function getField(fieldId: string): Promise<Field | null> {
  const { data } = await supabase
    .from('fields')
    .select('*')
    .eq('id', fieldId)
    .maybeSingle();
  return data as Field | null;
}

export async function createField(userId: string, fieldData: Partial<Field>): Promise<Field | null> {
  const { data } = await supabase
    .from('fields')
    .insert({ user_id: userId, ...fieldData })
    .select('*')
    .maybeSingle();
  return data as Field | null;
}

export async function updateField(fieldId: string, updates: Partial<Field>): Promise<void> {
  await supabase.from('fields').update(updates).eq('id', fieldId);
}

export async function deleteField(fieldId: string): Promise<void> {
  await supabase.from('fields').delete().eq('id', fieldId);
}

export async function getAssessments(userId: string, fieldId?: string): Promise<CropAssessment[]> {
  let query = supabase.from('crop_assessments').select('*').eq('user_id', userId);
  if (fieldId) query = query.eq('field_id', fieldId);
  const { data } = await query.order('created_at', { ascending: false });
  return (data ?? []) as CropAssessment[];
}

export async function createAssessment(userId: string, assessment: Partial<CropAssessment>): Promise<CropAssessment | null> {
  const { data } = await supabase
    .from('crop_assessments')
    .insert({
      user_id: userId,
      ...assessment,
      evidence_used: assessment.evidence_used ?? [],
      missing_evidence: assessment.missing_evidence ?? [],
    })
    .select('*')
    .maybeSingle();
  return data as CropAssessment | null;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  return (data ?? []) as Conversation[];
}

export async function getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
  const { data } = await supabase
    .from('conversation_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return (data ?? []) as ConversationMessage[];
}

export async function createConversation(userId: string, fieldId?: string | null, title?: string): Promise<Conversation | null> {
  const { data } = await supabase
    .from('conversations')
    .insert({ user_id: userId, field_id: fieldId ?? null, title: title ?? 'New conversation' })
    .select('*')
    .maybeSingle();
  return data as Conversation | null;
}

export async function addMessage(conversationId: string, userId: string, role: 'user' | 'assistant', content: string, metadata?: Record<string, unknown>): Promise<void> {
  await supabase.from('conversation_messages').insert({
    conversation_id: conversationId,
    user_id: userId,
    role,
    content,
    metadata: metadata ?? {},
  });
  if (role === 'user') {
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
  }
}

export async function getBlockedUserIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .eq('blocker_id', userId);
  return new Set((data ?? []).map(r => r.blocked_id));
}

export async function getCommunityPosts(limit = 20, offset = 0, cropTag?: string, currentUserId?: string): Promise<CommunityPost[]> {
  let query = supabase.from('community_posts').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (cropTag) query = query.eq('crop_tag', cropTag);
  const { data } = await query;
  let posts = (data ?? []) as CommunityPost[];
  if (currentUserId) {
    const blockedIds = await getBlockedUserIds(currentUserId);
    if (blockedIds.size > 0) {
      posts = posts.filter(p => !blockedIds.has(p.user_id));
    }
  }
  return posts;
}

export async function getSimilarCommunityPosts(
  cropType: string | null,
  possibleIssue: string | null,
  regionTag: string | null,
  currentUserId: string,
  limit = 5
): Promise<CommunityPost[]> {
  let query = supabase.from('community_posts').select('*').order('created_at', { ascending: false }).limit(limit * 3);
  if (cropType) {
    query = query.eq('crop_tag', cropType);
  }
  const { data } = await query;
  let posts = (data ?? []) as CommunityPost[];

  const blockedIds = await getBlockedUserIds(currentUserId);
  posts = posts.filter(p => p.user_id !== currentUserId && !blockedIds.has(p.user_id));

  if (possibleIssue) {
    const issueLower = possibleIssue.toLowerCase();
    const issueWords = issueLower.split(/\s+/).filter(w => w.length > 3);
    posts = posts.map(p => {
      let score = 0;
      const titleLower = p.title.toLowerCase();
      const contentLower = p.content.toLowerCase();
      if (titleLower.includes(issueLower)) score += 3;
      for (const word of issueWords) {
        if (titleLower.includes(word)) score += 1;
        if (contentLower.includes(word)) score += 1;
      }
      return { post: p, score };
    }).filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.post);
  }

  return posts.slice(0, limit);
}

export async function getCommunityPost(postId: string): Promise<CommunityPost | null> {
  const { data } = await supabase.from('community_posts').select('*').eq('id', postId).maybeSingle();
  return data as CommunityPost | null;
}

export async function createCommunityPost(userId: string, post: Partial<CommunityPost>): Promise<CommunityPost | null> {
  const { data } = await supabase
    .from('community_posts')
    .insert({ user_id: userId, ...post })
    .select('*')
    .maybeSingle();
  return data as CommunityPost | null;
}

export async function getComments(postId: string, currentUserId?: string): Promise<CommunityComment[]> {
  const { data } = await supabase
    .from('community_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  let comments = (data ?? []) as CommunityComment[];
  if (currentUserId) {
    const blockedIds = await getBlockedUserIds(currentUserId);
    if (blockedIds.size > 0) {
      comments = comments.filter(c => !blockedIds.has(c.user_id));
    }
  }
  return comments;
}

export async function addComment(postId: string, userId: string, content: string): Promise<CommunityComment | null> {
  const { data } = await supabase
    .from('community_comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select('*')
    .maybeSingle();
  return data as CommunityComment | null;
}

export async function toggleReaction(userId: string, postId?: string, commentId?: string): Promise<void> {
  const col = postId ? 'post_id' : 'comment_id';
  const val = postId ?? commentId;
  const { data: existing } = await supabase
    .from('community_reactions')
    .select('id')
    .eq('user_id', userId)
    .eq(col, val)
    .maybeSingle();

  if (existing) {
    await supabase.from('community_reactions').delete().eq('id', existing.id);
    if (postId) {
      await supabase.from('community_posts').update({ helpful_count: Math.max(0, (await supabase.from('community_posts').select('helpful_count').eq('id', postId).maybeSingle()).data?.helpful_count ?? 1) - 1 }).eq('id', postId);
    }
  } else {
    await supabase.from('community_reactions').insert({ user_id: userId, post_id: postId ?? null, comment_id: commentId ?? null });
  }
}

export async function createReport(reporterId: string, report: { post_id?: string; comment_id?: string; reason: string; description?: string }): Promise<void> {
  await supabase.from('community_reports').insert({
    reporter_id: reporterId,
    post_id: report.post_id ?? null,
    comment_id: report.comment_id ?? null,
    reason: report.reason,
    description: report.description ?? null,
  });
}

export async function getAlerts(userId: string): Promise<Alert[]> {
  const { data } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []) as Alert[];
}

export async function markAlertRead(alertId: string): Promise<void> {
  await supabase.from('alerts').update({ is_read: true }).eq('id', alertId);
}

export async function markAllAlertsRead(userId: string): Promise<void> {
  await supabase.from('alerts').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
}

export async function getReportCount(): Promise<number> {
  const { count } = await supabase.from('community_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending');
  return count ?? 0;
}

export async function getReports(): Promise<CommunityReport[]> {
  const { data } = await supabase.from('community_reports').select('*').order('created_at', { ascending: false }).limit(20);
  return (data ?? []) as CommunityReport[];
}

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  await supabase.from('user_blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
}

export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const { data } = await supabase.from('user_blocks').select('id').eq('blocker_id', blockerId).eq('blocked_id', blockedId).maybeSingle();
  return !!data;
}
