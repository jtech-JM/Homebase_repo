"""Management command to check verification expirations."""

from django.core.management.base import BaseCommand
from verification.renewal_services import renewal_service


class Command(BaseCommand):
    help = 'Check verification expirations and send notifications'

    def add_arguments(self, parser):
        parser.add_argument(
            '--send-notifications',
            action='store_true',
            help='Send expiration notifications',
        )

    def handle(self, *args, **options):
        self.stdout.write('Checking verification expirations...')
        
        results = renewal_service.check_all_expirations()
        
        self.stdout.write(self.style.SUCCESS(
            f"\nExpiration check completed:"
        ))
        self.stdout.write(f"  - Checked: {results['checked']}")
        self.stdout.write(f"  - Expiring soon: {results['expiring_soon']}")
        self.stdout.write(f"  - Expired: {results['expired']}")
        self.stdout.write(f"  - Notifications sent: {results['notifications_sent']}")
        
        self.stdout.write(self.style.SUCCESS('\nDone!'))
