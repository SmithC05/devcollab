# Generated manually

from django.db import migrations, models

def repair_duplicate_owners(apps, schema_editor):
    Workspace = apps.get_model('workspaces', 'Workspace')
    WorkspaceMembership = apps.get_model('workspaces', 'WorkspaceMembership')
    
    for workspace in Workspace.objects.all():
        creator_user = workspace.owner
        
        # Ensure the creator is the true OWNER
        creator_membership, created = WorkspaceMembership.objects.get_or_create(
            workspace=workspace,
            user=creator_user,
            defaults={'role': 'OWNER'}
        )
        if not created and creator_membership.role != 'OWNER':
            creator_membership.role = 'OWNER'
            creator_membership.save()
            
        # Demote all other OWNERs to DEVELOPER
        duplicate_owners = WorkspaceMembership.objects.filter(workspace=workspace, role='OWNER').exclude(user=creator_user)
        for dup in duplicate_owners:
            dup.role = 'DEVELOPER'
            dup.save()

def reverse_repair(apps, schema_editor):
    pass # Cannot safely restore who used to be a duplicate owner

class Migration(migrations.Migration):

    dependencies = [
        ('workspaces', '0004_migrate_member_to_developer'),
    ]

    operations = [
        migrations.RunPython(repair_duplicate_owners, reverse_repair),
        migrations.AddConstraint(
            model_name='workspacemembership',
            constraint=models.UniqueConstraint(
                condition=models.Q(('role', 'OWNER')),
                fields=('workspace',),
                name='unique_workspace_owner'
            ),
        ),
    ]
