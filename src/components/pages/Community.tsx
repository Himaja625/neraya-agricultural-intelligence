import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import {
  getCommunityPosts, createCommunityPost, getComments, addComment,
  toggleReaction, createReport, blockUser,
} from '@/lib/db';
import type { CommunityPost, CommunityComment } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import {
  Users, Plus, MessageSquare, HandHelping, Flag, ArrowLeft, Send,
  Sprout, MapPin, Clock, X, FlaskConical, Info, Search, Shield,
  TrendingUp, CheckCircle2, AlertCircle,
} from '@/components/ui/Icons';

const ROOMS = [
  { tag: null, label: 'All' },
  { tag: 'Tomato', label: 'Tomato' },
  { tag: 'Rice', label: 'Rice' },
  { tag: 'Chili', label: 'Chili' },
  { tag: 'Leaf Disease', label: 'Leaf Disease' },
  { tag: 'Pest Problems', label: 'Pest Problems' },
  { tag: 'Heavy Rainfall', label: 'Heavy Rainfall' },
  { tag: 'Water Management', label: 'Water Management' },
  { tag: 'Crop Recovery', label: 'Crop Recovery' },
  { tag: 'Irrigation', label: 'Irrigation' },
  { tag: 'Soil Health', label: 'Soil Health' },
];

const RECOVERY_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  still_dealing: { label: 'Still dealing with it', color: 'text-warning-600 bg-warning-50 border-warning-200', icon: <AlertCircle size={12} /> },
  improving: { label: 'Improving', color: 'text-success-600 bg-success-50 border-success-200', icon: <TrendingUp size={12} /> },
  resolved: { label: 'Resolved', color: 'text-forest-600 bg-forest-50 border-forest-200', icon: <CheckCircle2 size={12} /> },
};

export default function Community() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  // Create form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [cropTag, setCropTag] = useState('');
  const [regionTag, setRegionTag] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<'still_dealing' | 'improving' | 'resolved' | ''>('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    const p = await getCommunityPosts(50, 0, undefined, profile?.user_id);
    setPosts(p);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !title.trim() || !content.trim()) return;
    setCreating(true);
    const post = await createCommunityPost(profile.user_id, {
      title: title.trim(),
      content: content.trim(),
      crop_tag: cropTag || null,
      region_tag: regionTag || null,
      is_question: isQuestion,
      is_anonymous: isAnonymous,
      recovery_status: recoveryStatus || null,
    });
    if (post) {
      setPosts([post, ...posts]);
      setShowCreate(false);
      setTitle(''); setContent(''); setCropTag(''); setRegionTag('');
      setIsQuestion(false); setIsAnonymous(false); setRecoveryStatus('');
    }
    setCreating(false);
  }

  async function openPost(post: CommunityPost) {
    setSelectedPost(post);
    const c = await getComments(post.id, profile?.user_id);
    setComments(c);
  }

  async function handleAddComment() {
    if (!profile || !selectedPost || !newComment.trim()) return;
    setCommentLoading(true);
    const c = await addComment(selectedPost.id, profile.user_id, newComment.trim());
    if (c) {
      setComments([...comments, c]);
      setNewComment('');
    }
    setCommentLoading(false);
  }

  async function handleReaction(postId: string) {
    if (!profile) return;
    await toggleReaction(profile.user_id, postId);
    setPosts(posts.map(p => p.id === postId ? { ...p, helpful_count: p.helpful_count + (p.helpful_count % 2 === 0 ? 1 : -1) } : p));
  }

  async function handleReport() {
    if (!profile || !selectedPost || !reportReason) return;
    await createReport(profile.user_id, { post_id: selectedPost.id, reason: reportReason, description: reportDesc });
    setShowReport(false);
    setReportReason(''); setReportDesc('');
  }

  async function handleBlock() {
    if (!profile || !selectedPost) return;
    await blockUser(profile.user_id, selectedPost.user_id);
    setShowBlockConfirm(false);
    setSelectedPost(null);
    await loadPosts();
  }

  const filteredPosts = posts.filter(p => {
    if (activeRoom && p.crop_tag !== activeRoom) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        (p.crop_tag?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  if (loading) return <LoadingState label={t('common.loading')} />;

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-medium text-forest-950">{t('nav.community')}</h1>
          <p className="text-sm text-forest-500 mt-1">See what other farmers are experiencing. Share what you're seeing.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={18} /> Share
        </button>
      </div>

      {/* Room tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
        {ROOMS.map(room => (
          <button
            key={room.label}
            onClick={() => setActiveRoom(room.tag)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeRoom === room.tag
                ? 'bg-forest-700 text-white'
                : 'bg-white text-forest-600 border border-forest-100 hover:bg-forest-50'
            }`}
          >
            {room.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search posts by crop, symptom, or keyword..."
          className="input-field pl-10"
        />
      </div>

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <div className="card p-12">
          <EmptyState
            icon={<Users size={32} />}
            title={searchQuery ? "No posts found." : "You're early here."}
            description={searchQuery ? "Try a different search term." : "Share what you're seeing so other farmers can learn from your experience too."}
            action={!searchQuery && <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={18} /> Share what you're seeing</button>}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => (
            <div key={post.id} className="card p-5 hover:shadow-soft-md transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-100 text-forest-600 flex-shrink-0">
                  {post.is_anonymous ? <Shield size={18} /> : <Sprout size={18} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {post.is_anonymous && <span className="text-2xs font-medium text-forest-500">Anonymous Farmer</span>}
                    {post.is_question && <Badge variant="info">Question</Badge>}
                    {post.crop_tag && <Badge variant="neutral">{post.crop_tag}</Badge>}
                    {post.region_tag && <Badge variant="default">{post.region_tag}</Badge>}
                    {post.recovery_status && RECOVERY_LABELS[post.recovery_status] && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium border ${RECOVERY_LABELS[post.recovery_status].color}`}>
                        {RECOVERY_LABELS[post.recovery_status].icon}
                        {RECOVERY_LABELS[post.recovery_status].label}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-lg font-medium text-forest-900">{post.title}</h3>
                </div>
                <span className="text-2xs text-forest-400 flex items-center gap-1 flex-shrink-0">
                  <Clock size={12} /> {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-sm text-forest-600 leading-relaxed mb-4">{post.content}</p>
              <div className="flex items-center gap-4 pt-3 border-t border-forest-100">
                <button onClick={() => handleReaction(post.id)} className="flex items-center gap-1.5 text-sm text-forest-500 hover:text-forest-700 transition-colors">
                  <HandHelping size={16} /> {post.helpful_count} helpful
                </button>
                <button onClick={() => openPost(post)} className="flex items-center gap-1.5 text-sm text-forest-500 hover:text-forest-700 transition-colors">
                  <MessageSquare size={16} /> {post.comment_count} replies
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create post modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Share what you're seeing" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Brown spots on tomato leaves after rain" className="input-field" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">What are you seeing? *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} required placeholder="Describe what you're noticing. When did it start? How is it spreading?" className="input-field min-h-[120px] resize-y" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">Crop (optional)</label>
              <input type="text" value={cropTag} onChange={e => setCropTag(e.target.value)} placeholder="e.g. Tomato" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">Region (optional)</label>
              <input type="text" value={regionTag} onChange={e => setRegionTag(e.target.value)} placeholder="e.g. Andhra Pradesh" className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">Recovery status (optional)</label>
            <select value={recoveryStatus} onChange={e => setRecoveryStatus(e.target.value as '' | 'still_dealing' | 'improving' | 'resolved')} className="input-field">
              <option value="">Not set</option>
              <option value="still_dealing">Still dealing with it</option>
              <option value="improving">Improving</option>
              <option value="resolved">Resolved</option>
            </select>
            <p className="text-xs text-forest-400 mt-1">Share where you are in the process. Other farmers can learn from your journey.</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isQuestion} onChange={e => setIsQuestion(e.target.checked)} className="rounded border-forest-300 text-forest-600 focus:ring-forest-200" />
            <span className="text-sm text-forest-700">This is a question for other farmers</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="rounded border-forest-300 text-forest-600 focus:ring-forest-200" />
            <span className="text-sm text-forest-700">Post as Anonymous Farmer</span>
          </label>
          {isAnonymous && (
            <p className="text-xs text-forest-400 px-1">Your name and account will not be visible to others. Your identity remains known internally for safety and moderation.</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" disabled={creating} className="btn-primary">{creating ? 'Sharing...' : 'Share post'}</button>
          </div>
        </form>
      </Modal>

      {/* Post detail modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-forest-950/30 backdrop-blur-sm" onClick={() => setSelectedPost(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-soft-lg border border-forest-100 animate-scale-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-forest-100">
              <h2 className="font-serif text-lg font-medium text-forest-900">Discussion</h2>
              <button onClick={() => setSelectedPost(null)} className="p-1.5 rounded-lg text-forest-400 hover:bg-forest-50" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4">
              {/* Original post */}
              <div className="mb-6">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {selectedPost.is_anonymous && <span className="text-2xs font-medium text-forest-500">Anonymous Farmer</span>}
                  {selectedPost.is_question && <Badge variant="info">Question</Badge>}
                  {selectedPost.crop_tag && <Badge variant="neutral">{selectedPost.crop_tag}</Badge>}
                  {selectedPost.region_tag && <Badge variant="default">{selectedPost.region_tag}</Badge>}
                  {selectedPost.recovery_status && RECOVERY_LABELS[selectedPost.recovery_status] && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium border ${RECOVERY_LABELS[selectedPost.recovery_status].color}`}>
                      {RECOVERY_LABELS[selectedPost.recovery_status].icon}
                      {RECOVERY_LABELS[selectedPost.recovery_status].label}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-lg font-medium text-forest-900 mb-2">{selectedPost.title}</h3>
                <p className="text-sm text-forest-600 leading-relaxed">{selectedPost.content}</p>
                <p className="text-2xs text-forest-400 mt-3">{new Date(selectedPost.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
              </div>

              {/* Comments */}
              <div className="space-y-3 pt-4 border-t border-forest-100">
                <p className="text-sm font-medium text-forest-700 mb-2">{comments.length} {comments.length === 1 ? 'reply' : 'replies'}</p>
                {comments.length === 0 ? (
                  <p className="text-sm text-forest-400 py-2">No replies yet. Be the first to respond.</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="p-3 rounded-xl bg-forest-50/50 border border-forest-100">
                      <p className="text-sm text-forest-700 leading-relaxed">{c.content}</p>
                      <p className="text-2xs text-forest-400 mt-2">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Comment input */}
            <div className="px-6 py-4 border-t border-forest-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddComment(); }}
                  placeholder="Share your experience..."
                  className="input-field flex-1"
                />
                <button onClick={handleAddComment} disabled={!newComment.trim() || commentLoading} className="btn-primary">
                  <Send size={16} />
                </button>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <button onClick={() => setShowReport(true)} className="text-xs text-forest-400 hover:text-error-500 flex items-center gap-1">
                  <Flag size={12} /> Report this post
                </button>
                {!selectedPost.is_anonymous && (
                  <button onClick={() => setShowBlockConfirm(true)} className="text-xs text-forest-400 hover:text-error-500 flex items-center gap-1">
                    <Shield size={12} /> Block user
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      <Modal open={showReport} onClose={() => setShowReport(false)} title="Report this post" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">Reason</label>
            <select value={reportReason} onChange={e => setReportReason(e.target.value)} className="input-field">
              <option value="">Select a reason</option>
              <option value="misinformation">Misinformation</option>
              <option value="dangerous_advice">Dangerous advice</option>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="suspicious_activity">Suspicious activity</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">Details (optional)</label>
            <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="Tell us more about why you're reporting this..." className="input-field min-h-[80px] resize-y" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowReport(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button onClick={handleReport} disabled={!reportReason} className="btn-primary">Submit report</button>
          </div>
        </div>
      </Modal>

      {/* Block confirmation */}
      <Modal open={showBlockConfirm} onClose={() => setShowBlockConfirm(false)} title="Block this user" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-forest-600">Blocking this user will hide their posts from you. They will not be able to interact with you through community features.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowBlockConfirm(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button onClick={handleBlock} className="btn-primary bg-error-600 hover:bg-error-700">Block user</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
