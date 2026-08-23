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
                smith_user = None
                for real_user in real_users:
                    if real_user.email != "test@example.com":
                        smith_user = real_user
                    membership, mem_created = WorkspaceMembership.objects.get_or_create(
                        workspace=workspace,
                        user=real_user,
                        defaults={"role": "DEVELOPER"}
                    )
                    if mem_created:
                        self.stdout.write(self.style.SUCCESS(f"  + Attached real user {real_user.email} ({real_user.get_full_name()}) as DEVELOPER"))
                    else:
                        self.stdout.write(f"  ~ Verified real user {real_user.email} as {membership.role}")

                # ---------------------------------------------------------
                # PHASE 1: PROJECTS & TASKS
                # ---------------------------------------------------------
                from apps.projects.models import Project
                from apps.tasks.models import Task

                smith = smith_user if smith_user else created_users["libin@gmail.com"] # Fallback if Smith doesn't exist
                libin = created_users["libin@gmail.com"]
                balaji = created_users["balaji@gmail.com"]

                def get_or_create_project(name):
                    p, c = Project.objects.get_or_create(name=name, workspace=workspace)
                    status_str = "Created" if c else "Found"
                    self.stdout.write(self.style.SUCCESS(f"  + {status_str} Project: {name}"))
                    return p

                def get_or_create_task(project, title, assignee, priority, status):
                    t, c = Task.objects.update_or_create(
                        project=project,
                        title=title,
                        defaults={
                            "assignee": assignee,
                            "priority": priority,
                            "status": status
                        }
                    )
                    status_str = "Created" if c else "Updated"
                    self.stdout.write(f"    - {status_str} Task: {title} ({status})")
                    return t

                # PROJECTS
                payments_proj = get_or_create_project("Payments Platform")
                platform_proj = get_or_create_project("Platform Services")
                analytics_proj = get_or_create_project("Analytics")

                # TASKS: Payments Platform
                payment_api = get_or_create_task(payments_proj, "Payment API", smith, Task.PriorityChoices.P0, Task.StatusChoices.IN_PROGRESS)
                gateway_int = get_or_create_task(payments_proj, "Gateway Integration", smith, Task.PriorityChoices.P1, Task.StatusChoices.IN_PROGRESS)
                tx_valid = get_or_create_task(payments_proj, "Transaction Validation", libin, Task.PriorityChoices.P1, Task.StatusChoices.IN_PROGRESS)
                sec_review = get_or_create_task(payments_proj, "Security Review", balaji, Task.PriorityChoices.P0, Task.StatusChoices.IN_PROGRESS)
                payment_tests = get_or_create_task(payments_proj, "Payment Tests", libin, Task.PriorityChoices.P1, Task.StatusChoices.TODO)
                deployment = get_or_create_task(payments_proj, "Deployment", balaji, Task.PriorityChoices.P0, Task.StatusChoices.TODO)

                # DEPENDENCY CHAIN
                # task.dependencies.add(X) means "this task depends on X" (X must finish before this task)
                gateway_int.dependencies.add(payment_api)
                tx_valid.dependencies.add(gateway_int)
                sec_review.dependencies.add(tx_valid)
                payment_tests.dependencies.add(sec_review)
                deployment.dependencies.add(payment_tests)
                self.stdout.write(self.style.SUCCESS(f"  + Configured Dependency Chain for Payments Platform"))

                # ASSERTIONS (Safeguard)
                assert gateway_int in payment_api.blocking_tasks.all(), "Dependency Direction Error: payment_api is not blocking gateway_int"
                assert payment_api in gateway_int.dependencies.all(), "Dependency Direction Error: gateway_int does not depend on payment_api"
                assert payment_tests in deployment.dependencies.all(), "Dependency Direction Error: deployment does not depend on payment_tests"

                # TASKS: Platform Services
                get_or_create_task(platform_proj, "Auth Service", libin, Task.PriorityChoices.P1, Task.StatusChoices.IN_PROGRESS)
                get_or_create_task(platform_proj, "Core DB", smith, Task.PriorityChoices.P0, Task.StatusChoices.IN_PROGRESS)
                get_or_create_task(platform_proj, "API Gateway", balaji, Task.PriorityChoices.P1, Task.StatusChoices.IN_PROGRESS)

                # TASKS: Analytics
                get_or_create_task(analytics_proj, "Data Pipeline", balaji, Task.PriorityChoices.P1, Task.StatusChoices.IN_PROGRESS)
                get_or_create_task(analytics_proj, "Reporting", libin, Task.PriorityChoices.P2, Task.StatusChoices.TODO)


        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Seed failed: {str(e)}"))
            raise

        self.stdout.write(self.style.SUCCESS("Demo seed completed successfully."))
