from django.db import migrations

def create_user_profiles(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    UserProfile = apps.get_model('foodshare_app', 'UserProfile')
    
    for user in User.objects.all():
        UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'email_verified': True  # Assume existing users are verified
            }
        )

class Migration(migrations.Migration):

    dependencies = [
        ('foodshare_app', '0005_userprofile'),
    ]

    operations = [
        migrations.RunPython(create_user_profiles),
    ] 