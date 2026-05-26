# Grazel Admin & Auth Setup Guide

## 1. Admin Product Management ✅

### Add Product (Admin Only)
**Endpoint:** `POST /api/auth/products`  
**Auth:** Requires JWT token + Admin role

```json
{
  "name": "Premium Wool Blazer",
  "price": 495,
  "originalPrice": 495,
  "discount": 0,
  "category": "men",
  "subcategory": "blazers",
  "color": "Charcoal",
  "fabric": "Wool",
  "fit": "Tailored",
  "sizes": ["S", "M", "L", "XL"],
  "images": ["https://..."],
  "isNewProduct": true,
  "isBestseller": false,
  "description": "Elegant wool blazer...",
  "careInstructions": ["Dry clean only"],
  "composition": "100% Wool"
}
```

### Edit Product (Admin Only)
**Endpoint:** `PUT /api/products/:id`  
Update any fields above

### Delete Product (Admin Only)
**Endpoint:** `DELETE /api/products/:id`  
Removes product from database

### Database Storage
Products stored in MongoDB `products` collection:
```
{
  _id: ObjectId,
  name: String,
  price: Number,
  originalPrice: Number,
  discount: Number,
  category: String,
  subcategory: String,
  color: String,
  fabric: String,
  fit: String,
  sizes: [String],
  images: [String],
  isNewProduct: Boolean,
  isBestseller: Boolean,
  description: String,
  careInstructions: [String],
  composition: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 2. Google Login/Signup ✅

### Setup Steps

#### Step 1: Get Google Client ID
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **Credentials** → **Create OAuth 2.0 Client ID**
4. Choose **Web Application**
5. Add authorized redirect URIs:
   - `http://localhost:3000`
   - `http://localhost:8080`
   - Your production domain
6. Copy the **Client ID**

#### Step 2: Update Environment
```env
# .env
VITE_GOOGLE_CLIENT_ID=your_client_id_from_google_console
```

#### Step 3: Add Google Script to HTML
In `index.html`, add before closing `</body>`:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

#### Step 4: Use Google Auth Button
In your auth page or component:
```tsx
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

export function AuthPage() {
  return (
    <div>
      <h1>Login / Sign Up</h1>
      <GoogleAuthButton />
    </div>
  );
}
```

### Google Login/Signup Flow

```
User clicks "Continue with Google"
  ↓
Google opens sign-in dialog
  ↓
User selects Google account
  ↓
Frontend receives Google ID Token
  ↓
POST /api/auth/google with { googleId, email, name, avatar }
  ↓
Backend checks if user exists:
  - If yes: Link Google account & return JWT
  - If no: Create new user with Google data & return JWT
  ↓
Frontend stores JWT token
  ↓
User logged in ✅
```

### Database Storage - Users Collection

```json
{
  "_id": ObjectId,
  "name": "John Doe",
  "email": "john@gmail.com",
  "password": null,  // No password for OAuth users
  "role": "user",
  "authProvider": "google",  // or "email"
  "googleId": "1234567890...",
  "avatar": "https://lh3.googleusercontent.com/...",
  "createdAt": "2026-05-20T...",
  "updatedAt": "2026-05-20T..."
}
```

### Default Admin User (Email Auth)
```
Email: admin@grazel.com
Password: admin123
Role: admin
```

---

## 3. Data Flow Summary

### Product Management
```
Admin fills form
  ↓
POST /api/products
  ↓
Backend validates (admin check)
  ↓
MongoDB products collection
  ↓
Stored ✅
```

### User Registration (Google)
```
User clicks "Continue with Google"
  ↓
Google Sign-In dialog
  ↓
Frontend sends Google data to backend
  ↓
POST /api/auth/google
  ↓
Backend:
  - Finds or creates user
  - Links Google account
  - Generates JWT
  ↓
MongoDB users collection
  ↓
Frontend stores JWT
  ↓
User logged in ✅
```

### User Login (Email)
```
User enters email & password
  ↓
POST /api/auth/login
  ↓
Backend verifies credentials
  ↓
Generates JWT token
  ↓
Frontend stores JWT
  ↓
User logged in ✅
```

---

## 4. API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Email signup |
| POST | `/api/auth/login` | No | Email login |
| POST | `/api/auth/google` | No | Google login/signup |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/auth/users` | Admin | Get all users |

### Products (Admin)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | No | Get all products |
| GET | `/api/products/:id` | No | Get product |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

---

## 5. Testing Checklist

- [ ] Admin can add product via POST /api/products
- [ ] Product appears in MongoDB products collection
- [ ] Admin can edit product via PUT /api/products/:id
- [ ] Admin can delete product via DELETE /api/products/:id
- [ ] User can sign up with Google
- [ ] User appears in MongoDB users collection with authProvider=google
- [ ] User can log in with Google (existing account)
- [ ] JWT token is generated and stored
- [ ] Admin can see all users via GET /api/auth/users
