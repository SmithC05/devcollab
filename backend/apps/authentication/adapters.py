from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def get_connect_redirect_url(self, request, socialaccount):
        # Redirect to our custom OAuth callback instead of the default connections page
        return "/api/auth/oauth/callback/"
