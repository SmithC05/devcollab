from django.core.management.base import BaseCommand
from django.contrib.sites.models import Site
from allauth.socialaccount.models import SocialApp
from django.conf import settings
from decouple import config

class Command(BaseCommand):
    help = 'Sets up the Google OAuth SocialApp for django-allauth using environment variables'

    def handle(self, *args, **kwargs):
        client_id = config('GOOGLE_CLIENT_ID', default=None)
        client_secret = config('GOOGLE_CLIENT_SECRET', default=None)

        if not client_id or not client_secret:
            self.stdout.write(self.style.WARNING("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set in environment. Skipping Google OAuth setup."))
            return

        # Ensure Site 1 exists
        site, created = Site.objects.get_or_create(id=1, defaults={'domain': 'localhost', 'name': 'localhost'})
        if not created and site.domain == 'example.com':
            site.domain = 'localhost'
            site.name = 'localhost'
            site.save()

        # Create or update SocialApp
        app, created = SocialApp.objects.get_or_create(
            provider='google',
            defaults={
                'name': 'Google',
                'client_id': client_id,
                'secret': client_secret,
            }
        )

        if not created:
            app.client_id = client_id
            app.secret = client_secret
            app.save()

        app.sites.add(site)

        self.stdout.write(self.style.SUCCESS(f"Successfully configured Google OAuth SocialApp (client_id: {client_id})"))
