from django.contrib import admin
from .models import FoodDonation, FoodItem, UserProfile

# Register UserProfile model
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'email_verified', 'token_created_at')
    search_fields = ('user__username', 'user__email')
    list_filter = ('email_verified',)

# Register your models here.
admin.site.register(FoodDonation)
admin.site.register(FoodItem)
