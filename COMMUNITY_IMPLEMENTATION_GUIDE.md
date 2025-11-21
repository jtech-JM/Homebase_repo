# Community Feature - Complete Implementation Guide

## Overview
The Community feature is now fully implemented with backend API and enhanced frontend UI, allowing students to connect, share experiences, find roommates, and engage with the student housing community.

## Backend Implementation

### 1. Django App Structure
```
backend/community/
├── models.py          # Post, Like, Comment models
├── serializers.py     # DRF serializers
├── views.py           # ViewSets for CRUD operations
├── urls.py            # API endpoints
├── admin.py           # Django admin configuration
└── migrations/        # Database migrations
```

### 2. Database Models

#### Post Model
- `author`: ForeignKey to User
- `content`: TextField for post content
- `category`: CharField (roommates, advice, events, general)
- `created_at`, `updated_at`: Timestamps
- Properties: `likes_count`, `comments_count`

#### Like Model
- `user`: ForeignKey to User
- `post`: ForeignKey to Post
- `created_at`: Timestamp
- Unique constraint on (user, post)

#### Comment Model
- `author`: ForeignKey to User
- `post`: ForeignKey to Post
- `content`: TextField
- `created_at`, `updated_at`: Timestamps

### 3. API Endpoints

Base URL: `/api/community/`

#### Posts
- `GET /api/community/posts/` - List all posts (with optional `?category=` filter)
- `POST /api/community/posts/` - Create new post
- `GET /api/community/posts/{id}/` - Get specific post
- `PATCH /api/community/posts/{id}/` - Update post (author only)
- `DELETE /api/community/posts/{id}/` - Delete post (author only)
- `POST /api/community/posts/{id}/like/` - Toggle like on post
- `GET /api/community/posts/{id}/comments/` - Get post comments
- `POST /api/community/posts/{id}/comments/` - Add comment to post

#### Comments
- `GET /api/community/comments/` - List all comments
- `POST /api/community/comments/` - Create comment
- `PATCH /api/community/comments/{id}/` - Update comment (author only)
- `DELETE /api/community/comments/{id}/` - Delete comment (author only)

### 4. Permissions
- All endpoints require authentication (`IsAuthenticated`)
- Users can only edit/delete their own posts and comments
- Anyone can like posts and view content

## Frontend Implementation

### 1. Features

#### Category System
- **All Posts**: View all community posts
- **Roommate Search**: Find potential roommates
- **Student Advice**: Tips and guidance
- **Events & Meetups**: Social gatherings
- **General Discussion**: Open topics

#### Post Management
- Create posts with category selection
- Edit your own posts (inline editing)
- Delete your own posts (with confirmation)
- Rich text display with proper formatting

#### Social Interactions
- Like/unlike posts (heart icon with count)
- Comment on posts (expandable comment section)
- View comment threads
- Real-time updates after actions

#### UI/UX Features
- Role-based protection (students only)
- Loading states with spinner
- Success/error notifications (dismissible)
- Responsive design (mobile-friendly)
- Color-coded category badges
- Empty states with helpful prompts
- Hover effects and smooth transitions

### 2. Component Structure
```
frontend/app/dashboard/student/community/
└── page.js            # Main community page component
```

### 3. State Management
- `posts`: Array of community posts
- `newPost`: Content for new post creation
- `selectedCategory`: Current category filter
- `loading`: Loading state
- `error`: Error messages
- `success`: Success messages
- `editingPost`: Post being edited
- `showComments`: Toggle state for comments
- `newComment`: Comment content by post ID

## Setup Instructions

### Backend Setup

1. **Activate Virtual Environment**
```bash
.\venv\Scripts\Activate.ps1
cd backend
```

2. **Apply Migrations**
```bash
python manage.py migrate
```

3. **Create Superuser (if needed)**
```bash
python manage.py createsuperuser
```

4. **Run Development Server**
```bash
python manage.py runserver
```

### Frontend Setup

1. **Install Dependencies** (if not already done)
```bash
cd frontend
npm install
```

2. **Configure Environment Variables**
Ensure `.env.local` has:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. **Run Development Server**
```bash
npm run dev
```

## Testing the Feature

### 1. Access the Community Tab
- Login as a student user
- Navigate to Dashboard → Community

### 2. Test Post Creation
- Select a category
- Write content in the textarea
- Click "Post" button
- Verify post appears in feed

### 3. Test Post Interactions
- Click heart icon to like/unlike
- Click comment count to expand comments
- Add a comment and press Enter or click Send
- Verify comment appears

### 4. Test Post Management
- Find your own post
- Click edit icon (pencil)
- Modify content and save
- Click delete icon (trash) and confirm

### 5. Test Category Filtering
- Click different categories in sidebar
- Verify posts filter correctly
- Create posts in different categories

## Admin Panel

Access Django admin at `http://localhost:8000/admin/`

### Community Management
- **Posts**: View, edit, delete all posts
- **Likes**: Monitor like activity
- **Comments**: Moderate comments

### Useful Admin Features
- Filter posts by category and date
- Search posts by content and author
- View engagement metrics (likes, comments)
- Bulk actions for moderation

## Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **Authorization**: Users can only edit/delete their own content
3. **CORS Protection**: Configured for frontend origin
4. **Role Protection**: Frontend enforces student-only access
5. **Input Validation**: DRF serializers validate all inputs

## Performance Optimizations

1. **Database Queries**
   - `select_related()` for author relationships
   - `prefetch_related()` for likes and comments
   - Annotated counts to avoid N+1 queries

2. **Frontend**
   - Conditional rendering for comments
   - Optimistic UI updates
   - Debounced API calls

## Future Enhancements

### Potential Features
1. **Media Attachments**: Images and files in posts
2. **Post Search**: Full-text search functionality
3. **Notifications**: Real-time notifications for likes/comments
4. **User Profiles**: Click author name to view profile
5. **Hashtags**: Tag posts with hashtags
6. **Mentions**: @mention other users
7. **Reporting**: Report inappropriate content
8. **Pinned Posts**: Pin important announcements
9. **Post Reactions**: More reaction types beyond likes
10. **Pagination**: Load more posts on scroll

### Technical Improvements
1. **WebSocket Integration**: Real-time updates
2. **Caching**: Redis for frequently accessed data
3. **Image Optimization**: CDN for media files
4. **Rate Limiting**: Prevent spam
5. **Content Moderation**: AI-powered moderation
6. **Analytics**: Track engagement metrics

## Troubleshooting

### Common Issues

#### 1. Posts Not Loading
- Check backend server is running
- Verify API URL in `.env.local`
- Check browser console for errors
- Verify JWT token is valid

#### 2. Cannot Create Posts
- Ensure user is authenticated
- Check category is selected
- Verify content is not empty
- Check backend logs for errors

#### 3. Likes Not Working
- Verify user is authenticated
- Check network tab for API response
- Ensure database migrations are applied

#### 4. Comments Not Showing
- Click comment count to expand
- Verify comments exist in database
- Check API response in network tab

### Debug Commands

```bash
# Check migrations status
python manage.py showmigrations community

# Create test data
python manage.py shell
>>> from community.models import Post
>>> from users.models import User
>>> user = User.objects.first()
>>> Post.objects.create(author=user, content="Test post", category="general")

# View logs
python manage.py runserver --verbosity 2
```

## API Response Examples

### Get Posts
```json
[
  {
    "id": 1,
    "author": {
      "id": 1,
      "email": "student@example.com",
      "name": "John Doe",
      "avatar": null
    },
    "content": "Looking for a roommate near campus!",
    "category": "roommates",
    "created_at": "2024-11-21T10:30:00Z",
    "updated_at": "2024-11-21T10:30:00Z",
    "likes_count": 5,
    "comments_count": 2,
    "isLiked": false,
    "comments": []
  }
]
```

### Create Post
```json
{
  "content": "Anyone interested in a study group?",
  "category": "general"
}
```

### Add Comment
```json
{
  "content": "I'm interested! Let's connect."
}
```

## Conclusion

The Community feature is now fully functional with:
- ✅ Complete backend API with Django REST Framework
- ✅ Database models with proper relationships
- ✅ Enhanced frontend with full CRUD operations
- ✅ Social features (likes, comments)
- ✅ Category filtering
- ✅ Role-based access control
- ✅ Professional UI/UX
- ✅ Error handling and loading states
- ✅ Admin panel integration

The feature is production-ready and can be extended with additional functionality as needed.
