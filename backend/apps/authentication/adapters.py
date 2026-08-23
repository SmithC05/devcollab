from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    # BUG-04 FIX: get_connect_redirect_url only fires when *connecting* a social
    # account to an already-logged-in user.  get_login_redirect_url is the correct
    # hook that fires after a brand-new OAuth login, so the JWT is now issued.
    def get_login_redirect_url(self, request):
        return "/api/auth/oauth/callback/"

    # Keep connect redirect pointing to the same place for consistency.
    def get_connect_redirect_url(self, request, socialaccount):
        return "/api/auth/oauth/callback/"
