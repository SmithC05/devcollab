import requests
from allauth.socialaccount.models import SocialToken

class GitHubClient:
    def __init__(self, user):
        self.user = user
        token_obj = SocialToken.objects.filter(account__user=user, account__provider='github').first()
        self.token = token_obj.token if token_obj else None
        self.base_url = "https://api.github.com"

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github.v3+json"
        }

    def get(self, endpoint, params=None):
        if not self.token:
            raise ValueError("No GitHub token found for user")
        
        url = f"{self.base_url}{endpoint}"
        res = requests.get(url, headers=self._headers(), params=params)
        res.raise_for_status()
        return res.json()

    def fetch_user_profile(self):
        return self.get("/user")

    def fetch_repositories(self, limit=30):
        # Fetch repos accessible by user
        return self.get("/user/repos", params={"per_page": limit, "sort": "updated"})

    def fetch_languages(self, owner, repo):
        return self.get(f"/repos/{owner}/{repo}/languages")

    def fetch_contents(self, owner, repo, path=""):
        return self.get(f"/repos/{owner}/{repo}/contents/{path}")
