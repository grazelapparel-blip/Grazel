# Return Policy Implementation Guide

## Overview
This feature allows admins to set a return window (in days) for each product. Customers can only return a product if their purchase was made within that window. The return option is only visible if the return period is still active.

---

## How It Works

### 1. **Admin Sets Return Window Per Product**
- In the Admin Dashboard → Product Manager
- When creating or editing a product, there's a new field: **"Return Window (Days)"**
- Default is 30 days (customizable from 0-365)
- Example: If set to 14 days, customers have 14 days from purchase to return

### 2. **Customer Views Return Eligibility**
- On the Review Order Page (after purchase), each product shows:
  - **Return Eligibility Status** (blue box if eligible, red if expired)
  - **Days Left to Return** with deadline date
  - **"Request Return" button** (only shown if eligible)

### 3. **Return Window Logic**
- Purchase Date + Return Window Days = Return Deadline
- If today's date is BEFORE deadline → Return is eligible ✅
- If today's date is ON/AFTER deadline → Return is expired ❌

---

## Files Modified/Created

### Backend
1. **`server/models/Product.js`**
   - Added `returnWindowDays` field (Number, default: 30)
   - Stores return period in days for each product

### Frontend
1. **`src/types/product.ts`**
   - Added `returnWindowDays?: number;` to Product interface

2. **`src/lib/returnPolicy.ts`** (NEW)
   - `checkReturnEligibility()` - Calculates if return is allowed
   - `getReturnEligibilityMessage()` - Formats display message

3. **`src/components/admin/ProductManager.tsx`**
   - Added return window input field in product form
   - Default value: 30 days
   - Admin can set 0-365 days per product

4. **`src/pages/ReviewOrderPage.tsx`**
   - Imports return policy utilities
   - Calculates return eligibility for each order item
   - Displays return status with color-coded badges
   - Shows "Request Return" button only when eligible

---

## Admin Instructions

### To Set Return Window for a Product:

1. Go to **Admin Dashboard**
2. Click **"Add Product"** or edit existing product
3. Scroll to **"Return Window (Days)"** field
4. Enter number of days (e.g., 14, 30, 45)
5. Save product

### Examples:
- **0 days** → No returns allowed (one-time offer)
- **7 days** → One-week return policy
- **30 days** → Standard 30-day return window
- **90 days** → Extended return period

---

## Customer Experience

### After Placing Order:
1. Customer reviews order on Review Order Page
2. Each product shows return eligibility status:
   - ✅ **"Return Eligible"** - Blue box showing days left
   - ❌ **"Return Expired"** - Red box showing deadline passed
3. Can click **"Request Return"** button only if eligible

### Return Deadline Calculation:
- Order Date: May 20, 2024
- Return Window: 30 days
- Return Deadline: June 19, 2024
- Message: "25 days left to return (Deadline: 19 Jun 2024)"

---

## Future Enhancements (Optional)

Could extend with:
- [ ] Return request submission form
- [ ] Admin approval workflow
- [ ] Return tracking dashboard
- [ ] Automated refund processing
- [ ] Different return windows by product category
- [ ] Seasonal return policy changes

---

## Testing Checklist

✅ Admin can set return window when creating product
✅ Return window defaults to 30 days
✅ Return eligibility calculation is correct
✅ Return button shows only when eligible
✅ Days left count updates correctly
✅ Expired returns show proper message
✅ Works for products with different return windows in same order
