# Product Image Management Guide

## Overview
Product images in Grazel must be hosted on external services or accessible via URLs. Direct file uploads are not supported to maintain database performance and image quality.

---

## How to Add Product Images

### Step 1: Get Image URLs
Choose one of the following options:

#### **Option A: Use Cloudinary (FREE & RECOMMENDED)**
1. Go to [cloudinary.com](https://cloudinary.com) and create a free account
2. Upload your product image
3. Click "Copy URL" to get the image link
4. Example URL: `https://res.cloudinary.com/yourusername/image/upload/v1234567890/product-image.jpg`

#### **Option B: Use Imgur**
1. Go to [imgur.com](https://imgur.com)
2. Drag and drop your image
3. Right-click image → "Copy Image Address"
4. Example URL: `https://i.imgur.com/abc123def.jpg`

#### **Option C: Use AWS S3**
1. Set up AWS S3 bucket with public access
2. Upload image to S3
3. Get the public URL
4. Example URL: `https://yourbucket.s3.amazonaws.com/product-image.jpg`

#### **Option D: Self-Hosted**
1. Host images on your own server
2. Make sure images are publicly accessible
3. Example URL: `https://yourdomain.com/uploads/product-image.jpg`

---

## Adding Images to a Product

1. **Open Admin Dashboard** → Product Manager
2. **Add New Product** or **Edit Existing Product**
3. **Scroll to "Product Images"** section
4. **Paste Image URL** in the input field (e.g., `https://res.cloudinary.com/yourusername/...`)
5. **Press Enter** to add the image
6. **Repeat** for multiple images (main image first)
7. **Save Product**

### Example URLs to Try:
```
https://via.placeholder.com/400x600?text=Product+Image
https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400
```

---

## Best Practices

✅ **DO:**
- Use HTTPS URLs (secure)
- Optimize images before uploading (300-500 KB max per image)
- Use 400x600px or higher resolution
- Test URLs work before adding
- Add 3-4 images per product (front, back, detail, lifestyle)

❌ **DON'T:**
- Use data URLs or file paths
- Use images larger than 2 MB
- Use broken or expired URLs
- Use low-resolution images
- Upload files directly (won't work)

---

## Troubleshooting

### Images Not Showing?
1. Check URL is accessible (paste in browser)
2. Ensure URL starts with `http://` or `https://`
3. Try a different image service
4. Check for CORS issues if using third-party domains

### Image URL Invalid?
- Must start with `http://`, `https://`, or `/`
- Cannot be a local file path
- Must be publicly accessible URL

### Image Quality Issues?
- Use higher resolution source images (2000x3000px+)
- Compress images before uploading to CDN
- Use modern formats (WebP when possible)

---

## Image Services Comparison

| Service | Free | Easy | Reliability | Notes |
|---------|------|------|-------------|-------|
| **Cloudinary** | ✅ | ✅ | ⭐⭐⭐⭐⭐ | Best option - great free tier |
| **Imgur** | ✅ | ✅ | ⭐⭐⭐⭐ | Simple, reliable |
| **AWS S3** | ❌ | ⚠️ | ⭐⭐⭐⭐⭐ | Paid but very reliable |
| **Self-Hosted** | ✅ | ❌ | ⚠️ | Complex setup, full control |

---

## Example Product with 3 Images

1. **Main Image**: `https://res.cloudinary.com/grazel/image/upload/v123/blazer-front.jpg`
2. **Detail Image**: `https://res.cloudinary.com/grazel/image/upload/v123/blazer-detail.jpg`
3. **Lifestyle Image**: `https://res.cloudinary.com/grazel/image/upload/v123/blazer-worn.jpg`

---

## Need Help?

If images still don't show:
1. Open Developer Console (F12 → Network tab)
2. Check if image URLs return 200 status
3. Verify CORS headers if needed
4. Contact support with the image URL

---

**Last Updated**: May 25, 2026
