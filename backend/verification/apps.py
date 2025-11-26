from django.apps import AppConfig


class VerificationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "verification"
    
    def ready(self):
        """Import signal handlers when app is ready."""
        import verification.integration_signals  # noqa
