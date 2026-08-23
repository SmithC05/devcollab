from django.db import migrations


class Migration(migrations.Migration):
    """
    Removes the `unique_workspace_owner` partial index.
    On SQLite + Django 6.x the partial index (WHERE role='OWNER') was being
    applied as a full UNIQUE on workspace_id, blocking all non-first membership
    rows from being inserted.  Single-owner enforcement is handled at the
    view/service layer instead.
    """

    dependencies = [
        ('workspaces', '0005_enforce_single_owner'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='workspacemembership',
            name='unique_workspace_owner',
        ),
    ]
