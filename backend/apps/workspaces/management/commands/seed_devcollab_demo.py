from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.workspaces.models import Workspace, WorkspaceMembership
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the DevCollab Engineering demo workspace with the foundational roles and users.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting demo seed..."))

        try:
            with transaction.atomic():
                # 1. Define demo users
                seeded_users = [
                    {
                        "email": "admin@gmail.com",
                        "password": "admin123",
                        "first_name": "Admin",
                        "last_name": "",
                        "role": "OWNER"
                    },
                    {
                        "email": "lead@gmail.com",
                        "password": "lead123",
                        "first_name": "Team",
                        "last_name": "Lead",
                        "role": "LEAD"
                    },
                    {
                        "email": "libin@gmail.com",
                        "password": "libin123",
                        "first_name": "Libin",
                        "last_name": "",
                        "role": "DEVELOPER"
                    },
                    {
                        "email": "balaji@gmail.com",
                        "password": "balaji123",
                        "first_name": "Balaji",
                        "last_name": "",
                        "role": "DEVELOPER"
                    },
                ]

                # 2. Ensure users exist
                demo_user_emails = [u["email"] for u in seeded_users]
                created_users = {}

                for user_data in seeded_users:
                    user, created = User.objects.get_or_create(
                        email=user_data["email"],
                        defaults={
                            "username": user_data["email"].split("@")[0] + "_demo",
                            "first_name": user_data["first_name"],
                            "last_name": user_data["last_name"]
                        }
                    )
                    
                    # Update password using set_password to hash it properly
                    user.set_password(user_data["password"])
                    user.save()
                    created_users[user.email] = user
                    
                    if created:
                        self.stdout.write(f"  + Created {user.email}")
                    else:
                        self.stdout.write(f"  ~ Updated {user.email}")

                # 3. Create or get the Workspace
                admin_user = created_users["admin@gmail.com"]
                workspace, created = Workspace.objects.get_or_create(
                    name="DevCollab Engineering",
                    defaults={"owner": admin_user}
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f"  + Created Workspace: {workspace.name}"))
                else:
                    self.stdout.write(f"  ~ Found Workspace: {workspace.name}")

                # 4. Attach memberships for seeded users
                for user_data in seeded_users:
                    user = created_users[user_data["email"]]
                    role = user_data["role"]
                    membership, mem_created = WorkspaceMembership.objects.update_or_create(
                        workspace=workspace,
                        user=user,
                        defaults={"role": role}
                    )
                    if mem_created:
                        self.stdout.write(f"  + Added {user.email} as {role}")
                    else:
                        self.stdout.write(f"  ~ Verified {user.email} as {role}")

                # 5. Attach real Smith user(s) if they exist
                # Find all users NOT in our seeded list (which should include Smith)
                real_users = User.objects.exclude(email__in=demo_user_emails)
                for real_user in real_users:
                    membership, mem_created = WorkspaceMembership.objects.get_or_create(
                        workspace=workspace,
                        user=real_user,
                        defaults={"role": "DEVELOPER"}
                    )
                    if mem_created:
                        self.stdout.write(self.style.SUCCESS(f"  + Attached real user {real_user.email} ({real_user.get_full_name()}) as DEVELOPER"))
                    else:
                        self.stdout.write(f"  ~ Verified real user {real_user.email} as {membership.role}")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Seed failed: {str(e)}"))
            raise

        self.stdout.write(self.style.SUCCESS("Demo seed completed successfully."))
