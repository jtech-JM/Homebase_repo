from django.apps import AppConfig


class CommunityConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'community'
    
    def ready(self):
        """Import signal handlers when app is ready."""
        import community.signals
