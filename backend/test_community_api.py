"""
Quick test script to verify Community API is working
Run with: python backend/test_community_api.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'homebase_backend.settings')
django.setup()

from community.models import Post, Like, Comment
from users.models import User

def test_community():
    print("Testing Community API...")
    
    # Check if we have users
    user_count = User.objects.count()
    print(f"✓ Users in database: {user_count}")
    
    if user_count == 0:
        print("✗ No users found. Please create a user first.")
        return
    
    # Get first user
    user = User.objects.first()
    print(f"✓ Test user: {user.email}")
    
    # Create a test post
    post = Post.objects.create(
        author=user,
        content="This is a test post from the API!",
        category="general"
    )
    print(f"✓ Created test post: ID {post.id}")
    
    # Test like
    like, created = Like.objects.get_or_create(user=user, post=post)
    print(f"✓ Like created: {created}")
    
    # Test comment
    comment = Comment.objects.create(
        author=user,
        post=post,
        content="This is a test comment!"
    )
    print(f"✓ Created test comment: ID {comment.id}")
    
    # Check counts
    print(f"✓ Post likes: {post.likes_count}")
    print(f"✓ Post comments: {post.comments_count}")
    
    # List all posts
    posts = Post.objects.all()
    print(f"✓ Total posts in database: {posts.count()}")
    
    print("\n✅ All tests passed! Community API is working.")
    print(f"\nYou can view the post at: http://localhost:3000/dashboard/student/community")

if __name__ == "__main__":
    test_community()
