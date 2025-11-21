# Admin Dashboard - Model Conflict Fix

## Issue
The admin_api app was creating duplicate `SupportTicket` and `TicketMessage` models that conflicted with the existing `support` app models, causing a Django system check error.

## Solution
Instead of duplicating models, we now use the existing models from the `support` app:
- `support.SupportTicket` - Existing support ticket model
- `support.SupportMessage` - Existing support message model

## Changes Made

### 1. Updated `backend/admin_api/models.py`
- **Removed**: `SupportTicket` and `TicketMessage` models
- **Kept**: `PlatformSettings` and `AdminActivityLog` models

### 2. Updated `backend/support/models.py`
- **Added**: `assigned_to` field to `SupportTicket` for admin assignment

### 3. Updated `backend/admin_api/serializers.py`
- Changed imports to use `support.models`
- Updated `TicketMessageSerializer` to work with `SupportMessage`

### 4. Updated `backend/admin_api/views.py`
- Changed imports to use `support.models`
- Updated message creation to use `SupportMessage` with `sender='admin'`

### 5. Updated `backend/admin_api/admin.py`
- Removed duplicate admin configurations for support models

### 6. Updated `backend/setup_admin.py`
- Changed imports to use `support.models`
- Updated message creation syntax

## Migration Required

After these changes, you need to create and run migrations:

```bash
cd backend

# Create migration for the new assigned_to field in support app
python manage.py makemigrations support

# Create migration for admin_api (PlatformSettings and AdminActivityLog)
python manage.py makemigrations admin_api

# Run all migrations
python manage.py migrate
```

## Testing

After running migrations, test the setup:

```bash
# Run the setup script
python manage.py shell < setup_admin.py

# Start the server
python manage.py runserver
```

The server should now start without errors!

## API Compatibility

The API endpoints remain the same. The support ticket endpoints now use the existing support models:

```
GET    /api/admin/support/tickets/
GET    /api/admin/support/tickets/{id}/
POST   /api/admin/support/tickets/{id}/update_status/
POST   /api/admin/support/tickets/{id}/messages/
```

## Benefits of This Approach

1. **No Duplication**: Single source of truth for support tickets
2. **Consistency**: Support tickets work the same across all apps
3. **Data Integrity**: All support data in one place
4. **Easier Maintenance**: Only one model to update

## Next Steps

1. Run migrations (see above)
2. Create admin user with setup script
3. Test the admin dashboard
4. Verify support ticket functionality works in both admin and user interfaces
