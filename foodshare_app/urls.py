"""
URL configuration for the FoodShare Connect application.
Defines the routing for all application views.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('donate/', views.donate, name='donate'),
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('logout/', views.logout_view, name='logout'),
    path('adminpage/', views.admin_page, name='adminpage'),
    path('update-profile/', views.update_profile, name='update_profile'),
    path('submit-donation/', views.submit_donation, name='submit_donation'),
    path('get-donation-details/<str:donation_no>/', views.get_donation_details, name='get_donation_details'),
    path('get-donation-history/', views.get_donation_history, name='get_donation_history'),
    path('get-pending-donations/', views.get_pending_donations, name='get_pending_donations'),
    path('get-completed-donations/', views.get_completed_donations, name='get_completed_donations'),
    path('get-rejected-donations/', views.get_rejected_donations, name='get_rejected_donations'),
    path('get-approved-donations/', views.get_approved_donations, name='get_approved_donations'),
    path('update-donation-status/', views.update_donation_status, name='update_donation_status'),
    path('admin_page/', views.admin_page, name='admin_page'),
    path('add_donor/', views.add_donor, name='add_donor'),
    path('get_donor/<int:donor_id>/', views.get_donor, name='get_donor'),
    path('update_donor/<int:donor_id>/', views.update_donor, name='update_donor'),
    path('delete_donor/<int:donor_id>/', views.delete_donor, name='delete_donor'),
    path('update-donation/<str:donation_no>/', views.update_donation, name='update_donation'),
    path('delete-donation/<str:donation_no>/', views.delete_donation, name='delete_donation'),
    path('get-all-food-items/', views.get_all_food_items, name='get_all_food_items'),
    path('update-food-item-status/', views.update_food_item_status, name='update_food_item_status'),
]
