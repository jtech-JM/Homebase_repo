"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RoleProtectedLayout from '@/components/auth/RoleProtectedLayout';
import UserAvatar from '@/components/UserAvatar';
import { studentSidebarItems } from '../page';
import { Users, MessageSquare, Heart, Plus, Filter, TrendingUp, Calendar, MapPin, Star, ThumbsUp, Send, AlertTriangle, Trash2, Edit2, X } from 'lucide-react';

export default function StudentCommunityPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});

  const categories = [
    { id: 'all', name: 'All Posts', icon: <MessageSquare className="w-4 h-4" />, color: 'text-gray-600' },
    { id: 'roommates', name: 'Roommate Search', icon: <Users className="w-4 h-4" />, color: 'text-emerald-600' },
    { id: 'advice', name: 'Student Advice', icon: <Star className="w-4 h-4" />, color: 'text-blue-600' },
    { id: 'events', name: 'Events & Meetups', icon: <Calendar className="w-4 h-4" />, color: 'text-purple-600' },
    { id: 'general', name: 'General Discussion', icon: <MessageSquare className="w-4 h-4" />, color: 'text-gray-600' },
  ];

  useEffect(() => {
    if (session) {
      fetchPosts();
    }
  }, [session, selectedCategory]);

  const fetchPosts = async () => {
    try {
      const categoryParam = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${categoryParam}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(data);
      setError('');
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Unable to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.trim()) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          content: newPost,
          category: selectedCategory !== 'all' ? selectedCategory : 'general'
        }),
      });

      if (!response.ok) throw new Error('Failed to create post');
      setNewPost('');
      setSuccess('Post created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
    }
  };

  const updatePost = async (postId, content) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${postId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to update post');
      setEditingPost(null);
      setSuccess('Post updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      setError('Failed to update post. Please try again.');
    }
  };

  const deletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${postId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete post');
      setSuccess('Post deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post. Please try again.');
    }
  };

  const likePost = async (postId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${postId}/like/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to like post');
      fetchPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const toggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const addComment = async (postId) => {
    const content = newComment[postId];
    if (!content?.trim()) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/community/posts/${postId}/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to add comment');
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      fetchPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment. Please try again.');
    }
  };

  if (!session || loading) {
    return (
      <RoleProtectedLayout allowedRoles={['student']}>
        <DashboardLayout sidebarItems={studentSidebarItems}>
          <div className="text-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading community...</p>
          </div>
        </DashboardLayout>
      </RoleProtectedLayout>
    );
  }

  return (
    <RoleProtectedLayout allowedRoles={['student']}>
      <DashboardLayout sidebarItems={studentSidebarItems}>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Community</h1>
          <p className="text-gray-600 mt-1">Connect with fellow students, share experiences, and find roommates</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{posts.length} posts</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Star className="w-4 h-4 text-green-600" />
            </div>
            <p className="font-medium text-green-900">{success}</p>
          </div>
          <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-blue-50 border border-blue-200 text-blue-700 shadow-sm'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className={`p-1.5 rounded-md ${selectedCategory === category.id ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <div className={category.color}>
                      {category.icon}
                    </div>
                  </div>
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Create Post Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Share Something</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="What's on your mind? Ask for roommates, share advice, or discuss student life..."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-28 text-gray-900 placeholder-gray-500"
                />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {categories.filter(cat => cat.id !== 'all').map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={createPost}
                    disabled={!newPost.trim()}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    <Send className="w-4 h-4" />
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-6">Be the first to share something with the community!</p>
                <div className="flex justify-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>Find roommates</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Star className="w-4 h-4" />
                    <span>Share advice</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Plan events</span>
                  </div>
                </div>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <UserAvatar user={post.author} size="md" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-900">{post.author.name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              post.category === 'roommates' ? 'bg-emerald-100 text-emerald-800' :
                              post.category === 'advice' ? 'bg-blue-100 text-blue-800' :
                              post.category === 'events' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {categories.find(cat => cat.id === post.category)?.icon}
                              {categories.find(cat => cat.id === post.category)?.name || post.category}
                            </div>
                          </div>
                          {session?.user?.email === post.author.email && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingPost({ id: post.id, content: post.content })}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deletePost(post.id)}
                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {editingPost?.id === post.id ? (
                          <div className="mb-4">
                            <textarea
                              value={editingPost.content}
                              onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24 text-gray-900"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => updatePost(post.id, editingPost.content)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingPost(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 text-sm font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-900 mb-4 leading-relaxed">{post.content}</p>
                        )}
                        
                        <div className="flex items-center gap-6">
                          <button
                            onClick={() => likePost(post.id)}
                            className={`inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                              post.isLiked ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-red-600'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                            <span>{post.likes_count || 0}</span>
                          </button>
                          <button 
                            onClick={() => toggleComments(post.id)}
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-all duration-200"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.comments_count || 0}</span>
                          </button>
                        </div>

                        {/* Comments Section */}
                        {showComments[post.id] && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="space-y-3 mb-4">
                              {post.comments && post.comments.length > 0 ? (
                                post.comments.map((comment) => (
                                  <div key={comment.id} className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                                    <UserAvatar user={comment.author} size="sm" />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm text-gray-900">{comment.author.name}</span>
                                        <span className="text-xs text-gray-500">
                                          {new Date(comment.created_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-700">{comment.content}</p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500 text-center py-2">No comments yet</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newComment[post.id] || ''}
                                onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                placeholder="Write a comment..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                              />
                              <button
                                onClick={() => addComment(post.id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
    </RoleProtectedLayout>
  );
}
