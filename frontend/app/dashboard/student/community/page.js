"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { studentSidebarItems } from '../page';

export default function StudentCommunityPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categories = [
    { id: 'all', name: 'All Posts', icon: '📝' },
    { id: 'roommates', name: 'Roommate Search', icon: '👥' },
    { id: 'advice', name: 'Student Advice', icon: '💡' },
    { id: 'events', name: 'Events & Meetups', icon: '🎉' },
    { id: 'general', name: 'General Discussion', icon: '💬' },
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
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(error.message);
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
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.message);
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

  if (!session || loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <DashboardLayout sidebarItems={studentSidebarItems}>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Student Community</h1>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-medium mb-4">Categories</h2>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left p-2 rounded flex items-center space-x-2 ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span className="text-sm">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Create Post */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-medium mb-4">Share Something</h2>
              <div className="space-y-4">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="What's on your mind? Ask for roommates, share advice, or discuss student life..."
                  className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 h-24"
                />
                <div className="flex justify-between items-center">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="p-2 border rounded"
                  >
                    {categories.filter(cat => cat.id !== 'all').map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={createPost}
                    disabled={!newPost.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                  No posts yet. Be the first to share something!
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-start space-x-3">
                      <img
                        src={post.author.avatar || '/default-avatar.png'}
                        alt={post.author.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">{post.author.name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            post.category === 'roommates' ? 'bg-green-100 text-green-800' :
                            post.category === 'advice' ? 'bg-blue-100 text-blue-800' :
                            post.category === 'events' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {categories.find(cat => cat.id === post.category)?.name || post.category}
                          </span>
                        </div>
                        <p className="text-gray-900 mb-3">{post.content}</p>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => likePost(post.id)}
                            className={`flex items-center space-x-1 text-sm ${
                              post.isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                            }`}
                          >
                            <span>❤️</span>
                            <span>{post.likes_count || 0}</span>
                          </button>
                          <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600">
                            <span>💬</span>
                            <span>{post.comments_count || 0}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
