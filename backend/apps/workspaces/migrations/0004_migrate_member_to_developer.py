# Generated manually

from django.db import migrations

def migrate_roles(apps, schema_editor):
    WorkspaceMembership = apps.get_model('workspaces', 'WorkspaceMembership')
    WorkspaceMembership.objects.filter(role='MEMBER').update(role='DEVELOPER')

def reverse_migrate_roles(apps, schema_editor):
    WorkspaceMembership = apps.get_model('workspaces', 'WorkspaceMembership')
    WorkspaceMembership.objects.filter(role='DEVELOPER').update(role='MEMBER')

class Migration(migrations.Migration):

    dependencies = [
        ('workspaces', '0003_alter_workspacemembership_role_invitation'),
    ]

    operations = [
        migrations.RunPython(migrate_roles, reverse_migrate_roles),
    ]
