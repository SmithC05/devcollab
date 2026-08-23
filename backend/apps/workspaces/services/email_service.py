import json
import logging
from urllib import request as urllib_request
from urllib.error import URLError, HTTPError
from django.conf import settings

logger = logging.getLogger(__name__)

def send_workspace_invitation(
    recipient_email: str,
    recipient_name: str,
    workspace_name: str,
    inviter_name: str,
    role: str,
    invite_code: str,
    token: str,
    expires_at_str: str,
):
    """
    Sends a workspace invitation email using the Brevo HTTP API.
    """
    if not settings.BREVO_API_KEY:
        logger.error("BREVO_API_KEY is not set. Cannot send invitation email.")
        return False
        
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    accept_url = f"{frontend_url}/invitations/{token}"
    reject_url = f"{frontend_url}/invitations/{token}?action=reject"
    
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #000;">DevCollab</h2>
        <hr style="border: 1px solid #eee;" />
        <p><strong>{inviter_name}</strong> invited you to join <strong>{workspace_name}</strong></p>
        <p>Role: <strong>{role.capitalize()}</strong></p>
        <p>You've been invited to collaborate with the team on DevCollab.</p>
        
        <div style="margin: 30px 0;">
            <a href="{accept_url}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 15px;">Accept Invitation</a>
            <a href="{reject_url}" style="display: inline-block; padding: 12px 24px; background-color: #f5f5f5; color: #333; text-decoration: none; border-radius: 6px; font-weight: bold; border: 1px solid #ddd;">Reject Invitation</a>
        </div>
        
        <p>Invitation Code: <strong>{invite_code}</strong></p>
        <p style="font-size: 12px; color: #777;">This invitation expires on: {expires_at_str}</p>
        <p style="font-size: 12px; color: #777;">If you did not expect this invitation, you can safely ignore this email.</p>
    </div>
    """

    payload = {
        "sender": {
            "name": settings.BREVO_SENDER_NAME,
            "email": settings.BREVO_SENDER_EMAIL
        },
        "to": [
            {
                "email": recipient_email,
                "name": recipient_name if recipient_name else recipient_email
            }
        ],
        "subject": f"You've been invited to join {workspace_name} on DevCollab",
        "htmlContent": html_content,
    }

    req = urllib_request.Request(
        f"{settings.BREVO_API_BASE_URL.rstrip('/')}/smtp/email",
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            "api-key": settings.BREVO_API_KEY,
            "Accept": "application/json"
        },
        method="POST"
    )

    try:
        response = urllib_request.urlopen(req)
        if response.status in (200, 201, 202):
            return True
        else:
            logger.error(f"Brevo API error: {response.status} {response.read().decode('utf-8')}")
            return False
    except HTTPError as e:
        logger.error(f"Brevo HTTP error: {e.code} {e.read().decode('utf-8')}")
        return False
    except URLError as e:
        logger.error(f"Brevo URL error: {e.reason}")
        return False
    except Exception as e:
        logger.error(f"Failed to send email via Brevo: {str(e)}")
        return False
