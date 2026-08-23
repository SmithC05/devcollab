from django.db import models
from django.contrib.auth.models import User

class Workspace(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, null=True, blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_workspaces')
    plan = models.CharField(max_length=20, default='FREE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class WorkspaceMembership(models.Model):
    ROLE_CHOICES = (
        ('OWNER', 'Owner'),
        ('ADMIN', 'Admin'),
        ('LEAD', 'Lead'),
        ('DEVELOPER', 'Developer'),
    )
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workspace_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='DEVELOPER')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('workspace', 'user')

    def __str__(self):
        return f"{self.user.username} - {self.workspace.name} ({self.role})"

class Invitation(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('EXPIRED', 'Expired'),
    )
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('LEAD', 'Lead'),
        ('DEVELOPER', 'Developer'),
    )

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField()
    name = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='DEVELOPER')
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    token_hash = models.CharField(max_length=64, unique=True)
    invite_code = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # We don't want multiple pending invitations for the same email + workspace
        # We will enforce this at the view level or constrain it.
        pass

    def __str__(self):
        return f"Invite to {self.email} for {self.workspace.name}"

class PaymentTransaction(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='payments')
    razorpay_order_id = models.CharField(max_length=255, unique=True)
    razorpay_payment_id = models.CharField(max_length=255, null=True, blank=True)
    razorpay_signature = models.CharField(max_length=255, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, default='CREATED') # CREATED, SUCCESS, FAILED
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.workspace.name} - {self.amount} {self.currency} ({self.status})"
