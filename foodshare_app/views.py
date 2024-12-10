"""
Views for the FoodShare Connect application.
Handles user authentication, donation management, and page rendering.
"""
import logging
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db import IntegrityError, transaction
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.core.files.base import ContentFile
import json
import base64
from .models import FoodDonation, FoodItem, UserProfile
from django.db.models import Count, Sum
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.hashers import check_password
from django.db.models import F
from django.utils import timezone
import datetime
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

def is_admin(user):
    return user.is_staff or user.is_superuser

@ensure_csrf_cookie
def index(request):
    """Render the home page."""
    # Check if user is admin and the request is directly for the homepage
    if (request.user.is_authenticated and 
        (request.user.is_staff or request.user.is_superuser) and 
        request.path == '/' and 
        not request.META.get('HTTP_REFERER')):  # Only redirect if not coming from another page
        return redirect('adminpage')
    return render(request, 'index.html')

@login_required
def donate(request):
    # Get donation statistics
    user_donations = FoodDonation.objects.filter(donor=request.user)
    total_donations = user_donations.count()
    pending_donations = user_donations.filter(status='pending').count()
    completed_donations = user_donations.filter(status='completed').count()
    
    # Get recent donations (last 5)
    recent_donations = user_donations.order_by('-submission_date')[:5]
    
    context = {
        'total_donations': total_donations,
        'pending_donations': pending_donations,
        'completed_donations': completed_donations,
        'recent_donations': recent_donations,
    }
    
    return render(request, 'donate.html', context)

@login_required
def get_donation_details(request, donation_no):
    try:
        if request.user.is_staff:
            donation = FoodDonation.objects.get(donation_no=donation_no)
        else:
            donation = FoodDonation.objects.get(donation_no=donation_no, donor=request.user)
        
        food_items = donation.food_items.all()
        
        donation_data = {
            'donation_no': donation.donation_no,
            'status': donation.status,
            'submission_date': donation.submission_date.strftime('%Y-%m-%d %H:%M'),
            'contact': donation.contact,
            'address': donation.address,
            'delivery_method': donation.get_delivery_method_display(),
            'preferred_date': donation.preferred_date.strftime('%Y-%m-%d') if donation.preferred_date else None,
            'preferred_time': donation.preferred_time.strftime('%H:%M') if donation.preferred_time else None,
            'dropoff_location': donation.dropoff_location if donation.delivery_method == 'self' else None,
            'remarks': donation.remarks,
            'food_items': [{
                'name': item.name,
                'category': item.get_category_display(),
                'quantity': item.quantity,
                'condition': 'New/Unused' if item.condition == 'new' else 'Near Expiry',
                'expiration_date': item.expiration_date.strftime('%Y-%m-%d'),
                'photo': request.build_absolute_uri(item.photo.url) if item.photo else None
            } for item in food_items]
        }
        
        return JsonResponse({'success': True, 'data': donation_data})
    except FoodDonation.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Donation not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@require_http_methods(["POST"])
@ensure_csrf_cookie
def login_view(request):
    """Handle user login with email verification check."""
    email = request.POST.get('email')
    password = request.POST.get('password')
    next_url = request.POST.get('next', None)

    # Validate input
    if not email or not password:
        return JsonResponse({
            'success': False,
            'error': 'Please enter both email and password.'
        }, status=400)

    try:
        # First find the user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'No account found with this email. Please check your email or sign up.'
            }, status=401)

        # Authenticate user
        authenticated_user = authenticate(username=user.username, password=password)
        
        if authenticated_user is None:
            return JsonResponse({
                'success': False,
                'error': 'Invalid email or password. Please try again.'
            }, status=401)

        # Check if email is verified
        try:
            profile = UserProfile.objects.get(user=authenticated_user)
            if not profile.email_verified:
                return JsonResponse({
                    'success': False,
                    'error': 'Please verify your email before logging in. Check your inbox for the verification link.'
                }, status=403)
        except UserProfile.DoesNotExist:
            # Create profile if it doesn't exist (for existing users)
            UserProfile.objects.create(user=authenticated_user, email_verified=True)
        
        # Check if account is active
        if not authenticated_user.is_active:
            return JsonResponse({
                'success': False,
                'error': 'Your account has been disabled. Please contact support.'
            }, status=403)

        # Login successful
        login(request, authenticated_user)
        request.session['fresh_login'] = True
        
        # Determine redirect URL
        if authenticated_user.is_staff or authenticated_user.is_superuser:
            redirect_url = '/adminpage/'
        else:
            redirect_url = next_url if next_url else '/donate/'

        return JsonResponse({
            'success': True,
            'redirect': redirect_url
        })

    except Exception as e:
        logger.error(f'Login error: {str(e)}')
        return JsonResponse({
            'success': False,
            'error': 'An error occurred. Please try again later.'
        }, status=500)

@require_http_methods(["POST"])
@ensure_csrf_cookie
def signup_view(request):
    """Handle user registration with email verification."""
    username = request.POST.get('username')
    email = request.POST.get('email')
    password = request.POST.get('password')
    confirm_password = request.POST.get('confirmPassword')

    logger.info('Signup attempt for user %s with email %s', username, email)

    try:
        # Validate required fields
        if not all([username, email, password, confirm_password]):
            return JsonResponse({
                'success': False,
                'error': 'All fields are required.'
            }, status=400)

        # Validate passwords match
        if password != confirm_password:
            return JsonResponse({
                'success': False,
                'error': 'Passwords do not match.'
            }, status=400)

        # Validate username length
        if len(username) < 3:
            return JsonResponse({
                'success': False,
                'error': 'Username must be at least 3 characters long.'
            }, status=400)

        # Validate username characters
        if not username.isalnum():
            return JsonResponse({
                'success': False,
                'error': 'Username can only contain letters and numbers.'
            }, status=400)

        # Validate email format
        if '@' not in email or '.' not in email:
            return JsonResponse({
                'success': False,
                'error': 'Please enter a valid email address.'
            }, status=400)

        # Validate password strength
        if len(password) < 8:
            return JsonResponse({
                'success': False,
                'error': 'Password must be at least 8 characters long.'
            }, status=400)

        if not any(c.isupper() for c in password):
            return JsonResponse({
                'success': False,
                'error': 'Password must contain at least one uppercase letter.'
            }, status=400)

        if not any(c.islower() for c in password):
            return JsonResponse({
                'success': False,
                'error': 'Password must contain at least one lowercase letter.'
            }, status=400)

        if not any(c.isdigit() for c in password):
            return JsonResponse({
                'success': False,
                'error': 'Password must contain at least one number.'
            }, status=400)

        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            return JsonResponse({
                'success': False,
                'error': 'Password must contain at least one special character.'
            }, status=400)

        # Use select_for_update() to lock the rows we're checking to prevent race conditions
        with transaction.atomic():
            # Check if user already exists - case insensitive check
            if User.objects.filter(username__iexact=username).select_for_update().exists():
                return JsonResponse({
                    'success': False,
                    'error': 'This username is already taken. Please choose another.'
                }, status=409)

            if User.objects.filter(email__iexact=email).select_for_update().exists():
                return JsonResponse({
                    'success': False,
                    'error': 'An account with this email already exists.'
                }, status=409)

            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_active=True  # Keep user active but require email verification
            )
            
            # Profile will be created by the signal handler
            profile = user.profile
            
            try:
                # Generate verification URL
                verification_url = request.build_absolute_uri(
                    reverse('verify_email', args=[str(profile.verification_token)])
                )
                
                # Prepare email content
                subject = 'Verify your FoodShare Connect account'
                html_message = render_to_string('email/verification_email.html', {
                    'user': user,
                    'verification_url': verification_url
                })
                plain_message = f'Hi {user.username},\n\nPlease verify your email by clicking this link: {verification_url}'
                
                # Send verification email
                send_mail(
                    subject=subject,
                    message=plain_message,
                    html_message=html_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )

                return JsonResponse({
                    'success': True,
                    'message': 'Account created successfully! Please check your email for verification instructions.'
                })

            except Exception as e:
                logger.error('Error sending verification email: %s', str(e))
                # Don't delete the user if email fails, just notify them
                return JsonResponse({
                    'success': True,
                    'message': 'Account created successfully, but there was an issue sending the verification email. Please contact support.'
                }, status=201)

    except Exception as e:
        logger.error('Registration error: %s', str(e))
        return JsonResponse({
            'success': False,
            'error': 'An error occurred during registration. Please try again later.'
        }, status=500)

def verify_email(request, token):
    """Handle email verification."""
    try:
        profile = UserProfile.objects.get(verification_token=token)
        
        # Check if token is expired (24 hours)
        if timezone.now() > profile.token_created_at + timezone.timedelta(hours=24):
            return render(request, 'verification_failed.html', {
                'message': 'Verification link has expired. Please request a new one.'
            })
        
        # Mark email as verified
        profile.email_verified = True
        profile.save()
        
        # Log the user in
        login(request, profile.user)
        
        # Redirect to donate page with success parameter
        return redirect(f'/donate/?verification=success')
        
    except UserProfile.DoesNotExist:
        return render(request, 'verification_failed.html', {
            'message': 'Invalid verification link.'
        })

def logout_view(request):
    """Handle user logout."""
    # Clear all session data
    request.session.flush()
    logout(request)
    # Force redirect to homepage
    response = redirect('/')
    response.delete_cookie('sessionid')
    # Add a flag to indicate logout
    response.set_cookie('just_logged_out', 'true', max_age=1)  # Cookie expires in 1 second
    return response

@user_passes_test(is_admin, login_url='/')
def admin_page(request):
    """Render the admin dashboard page."""
    if not request.user.is_staff:
        return redirect('index')

    # Get basic stats
    total_admins = User.objects.filter(is_staff=True).count()
    total_donors = User.objects.filter(is_staff=False).count()
    pending_count = FoodDonation.objects.filter(status='pending').count()

    # Get food waste reduction metrics
    total_food_items = FoodItem.objects.count()
    redistributed_count = FoodItem.objects.filter(status='redistributed').count()
    redistributed_percentage = round((redistributed_count / total_food_items * 100) if total_food_items > 0 else 0, 1)
    total_quantity = FoodItem.objects.aggregate(total=Sum('quantity'))['total'] or 0

    # Get category distribution
    categories = FoodItem.objects.values('category').annotate(
        count=Count('id')
    ).order_by('-count')
    
    total_items = sum(cat['count'] for cat in categories)
    category_distribution = []
    for cat in categories:
        percentage = round((cat['count'] / total_items * 100) if total_items > 0 else 0, 1)
        name = dict(FoodItem.CATEGORY_CHOICES).get(cat['category'], cat['category'])
        category_distribution.append({
            'name': name,
            'count': cat['count'],
            'percentage': percentage
        })

    # Get monthly donation trends
    current_month = timezone.now().month
    monthly_donations = []
    for i in range(6):  # Last 6 months
        month = (current_month - i) if (current_month - i) > 0 else (current_month - i + 12)
        year = timezone.now().year if month <= current_month else timezone.now().year - 1
        
        count = FoodDonation.objects.filter(
            submission_date__month=month,
            submission_date__year=year
        ).count()
        
        monthly_donations.append({
            'month': month,
            'year': year,
            'count': count
        })
    
    # Calculate percentages for monthly trends
    max_monthly = max(m['count'] for m in monthly_donations) if monthly_donations else 1
    monthly_trends = []
    for donation in reversed(monthly_donations):
        month_name = datetime.date(2000, donation['month'], 1).strftime('%B')
        percentage = round((donation['count'] / max_monthly * 100) if max_monthly > 0 else 0, 1)
        monthly_trends.append({
            'name': f"{month_name} {donation['year']}",
            'count': donation['count'],
            'percentage': percentage
        })

    # Get all donations with pagination
    try:
        page = request.GET.get('page', '1')
        try:
            page = int(page)
        except (TypeError, ValueError):
            page = 1
        
        # Get all donations
        donations = FoodDonation.objects.all().order_by('-submission_date')
        
        # Create paginator
        paginator = Paginator(donations, 5)  # Show 5 donations per page
        total_pages = paginator.num_pages
        
        # Validate page number
        if page < 1:
            page = 1
        elif page > total_pages and total_pages > 0:
            page = total_pages
        
        # Get the page
        try:
            current_page = paginator.page(page)
        except EmptyPage:
            current_page = paginator.page(paginator.num_pages)
        
        # Calculate page range
        if total_pages <= 3:
            page_range = list(range(1, total_pages + 1))
        else:
            if page <= 2:
                page_range = list(range(1, 4))
            elif page >= total_pages - 1:
                page_range = list(range(total_pages - 2, total_pages + 1))
            else:
                page_range = list(range(page - 1, page + 2))
    except Exception as e:
        logger.error(f'Error in pagination: {str(e)}')
        current_page = []
        page_range = []
        total_pages = 0
        page = 1

    context = {
        'total_admins': total_admins,
        'total_donors': total_donors,
        'pending_count': pending_count,
        'total_food_items': total_food_items,
        'redistributed_count': redistributed_count,
        'redistributed_percentage': redistributed_percentage,
        'total_quantity': total_quantity,
        'category_distribution': category_distribution,
        'monthly_trends': monthly_trends,
        'donations': current_page,
        'page_range': page_range,
        'total_pages': total_pages,
        'current_page': page,
    }

    return render(request, 'adminpage.html', context)

@user_passes_test(is_admin, login_url='/')
def get_all_food_items(request):
    """Get all food items with their donation information."""
    food_items = FoodItem.objects.select_related('donation__donor').all().order_by('-donation__submission_date')
    
    # Paginate results
    paginator = Paginator(food_items, 10)  # Show 10 items per page
    page = request.GET.get('page', 1)
    
    try:
        page = int(page)
        current_page = paginator.page(page)
    except (EmptyPage, PageNotAnInteger):
        current_page = paginator.page(paginator.num_pages)
    
    items = []
    for item in current_page:
        items.append({
            'id': item.id,
            'name': item.name,
            'category': item.category,  # Use raw category value for AI processing
            'quantity': item.quantity,
            'condition': item.condition,  # Use raw condition value for AI processing
            'expiration_date': item.expiration_date.isoformat() if item.expiration_date else None,
            'photo_url': item.photo.url if item.photo else None,
            'donation_no': item.donation.donation_no,
            'donor_name': item.donation.donor.username,
            'status': item.status
        })
    
    return JsonResponse({
        'success': True,
        'items': items,
        'current_page': page,
        'total_pages': paginator.num_pages
    })

@user_passes_test(is_admin, login_url='/')
@require_http_methods(['POST'])
def update_food_item_status(request):
    """Update the status of a food item."""
    try:
        data = json.loads(request.body)
        item_id = data.get('item_id')
        new_status = data.get('status')

        if not item_id or not new_status:
            return JsonResponse({'error': 'Missing required fields'}, status=400)

        food_item = FoodItem.objects.get(id=item_id)
        food_item.status = new_status
        food_item.save()

        return JsonResponse({
            'success': True,
            'status': food_item.status
        })
    except FoodItem.DoesNotExist:
        return JsonResponse({'error': 'Food item not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_http_methods(['POST'])
def add_donor(request):
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists'}, status=400)
        
        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'Email already exists'}, status=400)
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        return JsonResponse({'message': 'Donor added successfully'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
def get_donor(request, donor_id):
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        donor = User.objects.get(id=donor_id, is_staff=False)
        return JsonResponse({
            'id': donor.id,
            'username': donor.username,
            'email': donor.email
        })
    except User.DoesNotExist:
        return JsonResponse({'error': 'Donor not found'}, status=404)

@login_required
@require_http_methods(['POST'])
def update_donor(request, donor_id):
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        donor = User.objects.get(id=donor_id, is_staff=False)
        username = request.POST.get('username')
        email = request.POST.get('email')
        
        # Check if username is taken by another user
        if User.objects.exclude(id=donor_id).filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists'}, status=400)
        
        # Check if email is taken by another user
        if User.objects.exclude(id=donor_id).filter(email=email).exists():
            return JsonResponse({'error': 'Email already exists'}, status=400)
        
        donor.username = username
        donor.email = email
        donor.save()
        
        return JsonResponse({'message': 'Donor updated successfully'})
    except User.DoesNotExist:
        return JsonResponse({'error': 'Donor not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
@require_http_methods(['POST'])
def delete_donor(request, donor_id):
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        donor = User.objects.get(id=donor_id, is_staff=False)
        donor.delete()
        return JsonResponse({'message': 'Donor deleted successfully'})
    except User.DoesNotExist:
        return JsonResponse({'error': 'Donor not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
@require_http_methods(['POST'])
def update_profile(request):
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        username = request.POST.get('username')
        email = request.POST.get('email')
        current_password = request.POST.get('current_password')
        new_password = request.POST.get('new_password')
        
        # Verify current password
        if not check_password(current_password, request.user.password):
            return JsonResponse({'error': 'Current password is incorrect'}, status=400)
        
        # Check if username is taken by another user
        if User.objects.exclude(id=request.user.id).filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists'}, status=400)
        
        # Check if email is taken by another user
        if User.objects.exclude(id=request.user.id).filter(email=email).exists():
            return JsonResponse({'error': 'Email already exists'}, status=400)
        
        # Update user information
        request.user.username = username
        request.user.email = email
        
        # Update password if provided
        if new_password:
            request.user.set_password(new_password)
        
        request.user.save()
        return JsonResponse({'success': True})
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
def submit_donation(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Invalid request method'})
    
    try:
        # Parse the JSON data from the request body
        body_unicode = request.body.decode('utf-8')
        body_data = json.loads(body_unicode)
        data = json.loads(body_data.get('donation_data'))
        
        logger.debug('Received donation data: %s', data)  # Add debug logging
        
        # Basic validation
        required_fields = ['contact', 'address', 'delivery_method']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({
                    'success': False,
                    'error': f'{field.replace("_", " ").title()} is required'
                })
        
        # Create donation
        donation = FoodDonation(
            donor=request.user,
            contact=data['contact'],
            address=data['address'],
            delivery_method=data['delivery_method'],
            remarks=data.get('remarks', '')
        )
        
        # Add delivery details based on method
        if data['delivery_method'] == 'ngo':
            if not data.get('preferred_date') or not data.get('preferred_time'):
                return JsonResponse({
                    'success': False,
                    'error': 'Pickup date and time are required'
                })
            donation.preferred_date = data['preferred_date']
            donation.preferred_time = data['preferred_time']
        else:
            if not data.get('dropoff_location'):
                return JsonResponse({
                    'success': False,
                    'error': 'Dropoff location is required'
                })
            donation.dropoff_location = data['dropoff_location']
        
        donation.save()
        
        # Process food items
        food_items = data.get('food_items', [])
        if not food_items:
            return JsonResponse({
                'success': False,
                'error': 'At least one food item is required'
            })
        
        for item in food_items:
            food_item = FoodItem(
                donation=donation,
                name=item['name'],
                category=item['category'],
                quantity=item['quantity'],
                condition=item['condition'],
                expiration_date=item['expiration_date']
            )
            
            # Handle photo if provided
            if 'photo' in item and item['photo']:
                try:
                    # Save food_item first to get an ID
                    food_item.save()
                    
                    # Now handle the photo
                    format, imgstr = item['photo'].split(';base64,')
                    ext = format.split('/')[-1]
                    # Generate a shorter unique filename
                    filename = f'food_{food_item.pk}.{ext}'
                    photo_data = ContentFile(base64.b64decode(imgstr), name=filename)
                    food_item.photo = photo_data
                    food_item.save()
                except Exception as e:
                    logger.error('Error processing photo: %s', str(e))
            
            food_item.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Donation submitted successfully',
            'donation_no': donation.donation_no
        })
        
    except Exception as e:
        logger.error('Error submitting donation: %s', str(e))
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

@login_required
def get_donation_history(request):
    try:
        page_number = request.GET.get('page', 1)
        donations = FoodDonation.objects.filter(donor=request.user).order_by('-submission_date')
        
        # Create a paginator object with 5 items per page
        paginator = Paginator(donations, 5)
        page_obj = paginator.get_page(page_number)
        
        donation_list = [{
            'donation_no': donation.donation_no,
            'submission_date': donation.submission_date.strftime('%Y-%m-%d %H:%M'),
            'status': donation.status,
        } for donation in page_obj]
        
        return JsonResponse({
            'success': True,
            'donations': donation_list,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

@login_required
def get_pending_donations(request):
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    page = request.GET.get('page', 1)
    donations = FoodDonation.objects.filter(status='pending').order_by('-submission_date')
    paginator = Paginator(donations, 5)
    
    try:
        donations_page = paginator.page(page)
    except (PageNotAnInteger, EmptyPage):
        donations_page = paginator.page(1)
    
    donations_data = [{
        'donation_no': donation.donation_no,
        'donor_name': donation.donor.username,
        'date_created': donation.submission_date.strftime('%Y-%m-%d'),
        'status': donation.status
    } for donation in donations_page]
    
    return JsonResponse({
        'donations': donations_data,
        'current_page': donations_page.number,
        'total_pages': paginator.num_pages
    })

@login_required
def get_completed_donations(request):
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    page = request.GET.get('page', 1)
    donations = FoodDonation.objects.filter(status='completed').order_by('-submission_date')
    paginator = Paginator(donations, 5)
    
    try:
        donations_page = paginator.page(page)
    except (PageNotAnInteger, EmptyPage):
        donations_page = paginator.page(1)
    
    donations_data = [{
        'donation_no': donation.donation_no,
        'donor_name': donation.donor.username,
        'date_created': donation.submission_date.strftime('%Y-%m-%d'),
        'status': donation.status
    } for donation in donations_page]
    
    return JsonResponse({
        'donations': donations_data,
        'current_page': donations_page.number,
        'total_pages': paginator.num_pages
    })

@login_required
def get_rejected_donations(request):
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    page = request.GET.get('page', 1)
    donations = FoodDonation.objects.filter(status='rejected').order_by('-submission_date')
    paginator = Paginator(donations, 5)
    
    try:
        donations_page = paginator.page(page)
    except (PageNotAnInteger, EmptyPage):
        donations_page = paginator.page(1)
    
    donations_data = [{
        'donation_no': donation.donation_no,
        'donor_name': donation.donor.username,
        'date_created': donation.submission_date.strftime('%Y-%m-%d'),
        'status': donation.status
    } for donation in donations_page]
    
    return JsonResponse({
        'donations': donations_data,
        'current_page': donations_page.number,
        'total_pages': paginator.num_pages
    })

@login_required
def get_approved_donations(request):
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    page = request.GET.get('page', 1)
    donations = FoodDonation.objects.filter(status='approved').order_by('-submission_date')
    paginator = Paginator(donations, 5)
    
    try:
        donations_page = paginator.page(page)
    except (PageNotAnInteger, EmptyPage):
        donations_page = paginator.page(1)
    
    donations_data = [{
        'donation_no': donation.donation_no,
        'donor_name': donation.donor.username,
        'date_created': donation.submission_date.strftime('%Y-%m-%d'),
        'status': donation.status
    } for donation in donations_page]
    
    return JsonResponse({
        'donations': donations_data,
        'current_page': donations_page.number,
        'total_pages': paginator.num_pages
    })

@login_required
@require_http_methods(['POST'])
def update_donation_status(request):
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        data = json.loads(request.body)
        donation_no = data.get('donation_no')
        new_status = data.get('status')
        
        if not donation_no or not new_status:
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        
        if new_status not in ['pending', 'approved', 'rejected', 'completed']:
            return JsonResponse({'error': 'Invalid status'}, status=400)
        
        donation = FoodDonation.objects.get(donation_no=donation_no)
        donation.status = new_status
        donation.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Donation status updated to {new_status}'
        })
        
    except FoodDonation.DoesNotExist:
        return JsonResponse({'error': 'Donation not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
@require_http_methods(['POST'])
def update_donation(request, donation_no):
    logger.debug(f'Attempting to update donation: {donation_no}')
    if not request.user.is_staff:
        logger.warning('Unauthorized update attempt')
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        data = json.loads(request.body)
        logger.debug(f'Received update data: {data}')
        
        donation = FoodDonation.objects.get(donation_no=donation_no)
        
        # Update basic fields
        donation.contact = data.get('contact', donation.contact)
        donation.address = data.get('address', donation.address)
        donation.delivery_method = data.get('delivery_method', donation.delivery_method)
        donation.dropoff_location = data.get('dropoff_location', donation.dropoff_location)
        donation.remarks = data.get('remarks', donation.remarks)
        
        # Update food items
        if 'food_items' in data:
            # First, delete existing food items
            donation.food_items.all().delete()
            
            # Create new food items
            for item_data in data['food_items']:
                FoodItem.objects.create(
                    donation=donation,
                    name=item_data['name'],
                    category=item_data['category'],
                    quantity=item_data['quantity'],
                    condition=item_data['condition'],
                    expiration_date=item_data['expiration_date']
                )
        
        donation.save()
        logger.info(f'Successfully updated donation: {donation_no}')
        return JsonResponse({'success': True})
        
    except FoodDonation.DoesNotExist:
        logger.error(f'Donation not found: {donation_no}')
        return JsonResponse({'error': 'Donation not found'}, status=404)
    except Exception as e:
        logger.error(f'Error updating donation: {str(e)}')
        return JsonResponse({'error': str(e)}, status=400)

@login_required
@require_http_methods(['POST'])
def delete_donation(request, donation_no):
    logger.debug(f'Attempting to delete donation: {donation_no}')
    if not request.user.is_staff:
        logger.warning('Unauthorized deletion attempt')
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        donation = FoodDonation.objects.get(donation_no=donation_no)
        logger.info(f'Deleting donation: {donation}')
        donation.delete()
        logger.info('Donation deleted successfully')
        return JsonResponse({'success': True})
    except FoodDonation.DoesNotExist:
        logger.error(f'Donation not found: {donation_no}')
        return JsonResponse({'error': 'Donation not found'}, status=404)
    except Exception as e:
        logger.error(f'Error deleting donation: {str(e)}')
        return JsonResponse({'error': str(e)}, status=400)

@login_required
def get_all_donors(request):
    """Get all users who are regular donors (not staff and not superusers)"""
    try:
        donors = User.objects.filter(is_staff=False, is_superuser=False).values(
            'id', 'username', 'email', 'is_active', 'date_joined'
        )
        return JsonResponse({
            'success': True,
            'donors': list(donors)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
def get_donor_donations(request, donor_id):
    """Get all donations made by a specific donor"""
    try:
        donations = FoodDonation.objects.filter(donor_id=donor_id).values(
            'donation_no',
            'submission_date',
            'status'
        ).order_by('-submission_date')
        
        return JsonResponse({
            'success': True,
            'donations': list(donations)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@login_required
def toggle_donor_status(request, donor_id):
    """Toggle a donor's account status (active/inactive)"""
    if request.method != 'POST':
        return JsonResponse({
            'success': False,
            'error': 'Method not allowed'
        }, status=405)
    
    try:
        data = json.loads(request.body)
        is_active = data.get('is_active', False)
        
        donor = User.objects.get(id=donor_id)
        donor.is_active = is_active
        donor.save()
        
        return JsonResponse({
            'success': True,
            'is_active': donor.is_active
        })
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Donor not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)