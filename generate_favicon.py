from PIL import Image, ImageDraw, ImageFont
import os

def create_favicon():
    # Create base sizes for different favicon versions
    sizes = {
        'favicon-16x16.png': (16, 16),
        'favicon-32x32.png': (32, 32),
        'apple-touch-icon.png': (180, 180),
        'android-chrome-192x192.png': (192, 192),
        'android-chrome-512x512.png': (512, 512)
    }
    
    # Create directory if it doesn't exist
    output_dir = 'foodshare_app/static/images/favicon'
    os.makedirs(output_dir, exist_ok=True)
    
    # Create base image with transparency (RGBA mode)
    size = 512
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0))  # Transparent background
    draw = ImageDraw.Draw(image)
    
    # Make circle bigger by reducing margin
    circle_color = '#3498db'  # Blue color
    circle_margin = size // 20  # Reduced from size // 10 to make circle bigger
    draw.ellipse([circle_margin, circle_margin, size - circle_margin, size - circle_margin], 
                 fill=circle_color)
    
    # Draw text
    text = "FC"
    text_color = '#FFFFFF'  # White color
    
    # Try to load a font with larger size
    try:
        # Increased font size and made it bold
        font_size = int(size * 0.4)  # Increased from size // 2
        try:
            font = ImageFont.truetype("arialbd.ttf", font_size)  # Try Arial Bold first
        except:
            font = ImageFont.truetype("arial.ttf", font_size)  # Fall back to regular Arial
    except:
        font = ImageFont.load_default()
    
    # Center the text with slight adjustments
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    # Calculate center position with a slight vertical adjustment
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2 - (size // 40)  # Slight upward adjustment
    
    # Draw the text
    draw.text((text_x, text_y), text, font=font, fill=text_color)
    
    # Save in different sizes
    for filename, dimensions in sizes.items():
        resized = image.resize(dimensions, Image.Resampling.LANCZOS)
        # For PNG files, keep transparency
        if filename.endswith('.png'):
            resized.save(os.path.join(output_dir, filename), 'PNG')
        # For other formats that don't support transparency, use white background
        else:
            # Create a white background image
            bg = Image.new('RGB', resized.size, '#FFFFFF')
            # Paste the icon onto the white background using alpha channel
            bg.paste(resized, (0, 0), resized)
            bg.save(os.path.join(output_dir, filename))

if __name__ == '__main__':
    create_favicon() 