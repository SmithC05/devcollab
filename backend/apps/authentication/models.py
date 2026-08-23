from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=500, blank=True)
    github_url = models.URLField(max_length=255, blank=True)
    avatar_url = models.URLField(max_length=1024, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"
