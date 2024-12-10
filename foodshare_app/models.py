from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid
import datetime

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    email_verified = models.BooleanField(default=False)
    verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    token_created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

    class Meta:
        db_table = 'foodshare_app_userprofile'

# Signal to create UserProfile when a new User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created and not hasattr(instance, 'profile'):
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if not hasattr(instance, 'profile'):
        UserProfile.objects.create(user=instance)
    else:
        instance.profile.save()

class FoodDonation(models.Model):
    objects = models.Manager()

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]

    DELIVERY_CHOICES = [
        ('ngo', 'NGO Pickup'),
        ('self', 'Self Delivery'),
    ]

    donation_no = models.CharField(max_length=10, unique=True)
    donor = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    submission_date = models.DateTimeField(auto_now_add=True)
    
    # Donor Information
    contact = models.CharField(max_length=20)
    address = models.TextField()
    
    # Delivery Details
    delivery_method = models.CharField(max_length=4, choices=DELIVERY_CHOICES)
    preferred_date = models.DateField(null=True, blank=True)
    preferred_time = models.TimeField(null=True, blank=True)
    dropoff_location = models.CharField(max_length=255, null=True, blank=True)
    
    # Additional Information
    remarks = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.donation_no:
            # Get the latest donation number
            last_donation = FoodDonation.objects.order_by('-donation_no').first()
            if last_donation:
                last_number = int(last_donation.donation_no.split('-')[1])
                new_number = last_number + 1
            else:
                new_number = 1
            self.donation_no = f"DON-{new_number:03d}"
        super().save(*args, **kwargs)

class FoodItem(models.Model):
    CATEGORY_CHOICES = [
        ('packaged', 'Packaged Foods'),
        ('canned', 'Canned Foods'),
        ('beverages', 'Beverages'),
        ('snacks', 'Snacks'),
        ('other', 'Other'),
    ]

    CONDITION_CHOICES = [
        ('new', 'New/Unused'),
        ('near', 'Near Expiry'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('on_hold', 'On Hold'),
        ('redistributed', 'Redistributed'),
        ('discarded', 'Discarded'),
    ]

    donation = models.ForeignKey(FoodDonation, on_delete=models.CASCADE, related_name='food_items')
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES)
    quantity = models.IntegerField()
    condition = models.CharField(max_length=50, choices=CONDITION_CHOICES)
    expiration_date = models.DateField()
    photo = models.ImageField(upload_to='food_items/', null=True, blank=True, max_length=255)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
