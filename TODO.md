# Fix 401 Unauthorized Errors for Listings API

## Tasks
- [x] Update IsLandlordOrReadOnly permission class to require authentication for write operations
- [x] Change ListingViewSet permission_classes to [IsLandlordOrReadOnly]
- [x] Modify ListingViewSet.get_queryset to handle unauthenticated users
- [x] Update dashboard_stats action to check authentication before role
- [x] Update stats action to check authentication before role
- [x] Update applications action to check authentication before role
- [x] Test the API endpoints for public read access and protected actions
