# Subscription Feature - Mobile App

## Setup

### 1. Update Xendit Public Key

Edit file `screens/AddPaymentMethod.js` line ~150:

```javascript
Xendit.setPublishableKey("xnd_public_development_YOUR_KEY_HERE");
```

Ganti dengan Public Key dari Xendit Dashboard.

### 2. Backend API Endpoints Required

- `GET /api/subscriptions/plans` - Get subscription plans
- `GET /api/subscriptions/my-subscription` - Get user's active subscription
- `GET /api/subscriptions/payment-methods` - Check if user has payment method
- `POST /api/subscriptions/payment-method` - Add payment method (body: `{ type, tokenId }`)
- `POST /api/subscriptions` - Create subscription (body: `{ planId, amount }`)
- `DELETE /api/subscriptions` - Cancel subscription

## User Flow

### Subscribe Flow:

1. User navigates to **Subscription** tab
2. If no payment method → Shows "Add Payment Method" button
3. User clicks "Add Payment Method" → Opens WebView with card form
4. User fills card details → Xendit.js tokenizes card → Gets tokenId
5. tokenId sent to backend → Backend saves payment method ID to user
6. User returns to Subscription screen → Selects a plan
7. Clicks "Pilih Paket" → Confirms subscription
8. Backend creates recurring payment with Xendit
9. User sees "AKTIF" badge on subscription card

### Cancel Flow:

1. User has active subscription
2. Clicks "Batalkan Langganan" button
3. Confirms cancellation
4. Backend cancels recurring payment
5. Subscription status updated

## Screens

### 1. Subscription.js

- Shows subscription plans
- Displays active subscription (if any)
- Payment method status
- Benefits info

### 2. AddPaymentMethod.js

- WebView with HTML form
- Xendit.js card tokenization
- Sends tokenId to backend via postMessage

## Features

✅ View subscription plans with benefits
✅ Check payment method status
✅ Add credit/debit card securely (PCI compliant via Xendit)
✅ Subscribe to monthly plans
✅ View active subscription details
✅ Cancel subscription
✅ Pull to refresh
✅ Error handling & toast notifications

## Important Notes

1. **Security**: Card data never touches your server - tokenized by Xendit.js
2. **PCI Compliance**: Using Xendit's hosted tokenization
3. **Testing**: Use Xendit test cards for development
   - `4000000000000002` - Success
   - `4000000000000010` - Decline
4. **Public Key**: Must use correct environment key (development/production)

## Sample Test Card

```
Card Number: 4000 0000 0000 0002
Expiry: 12/25
CVV: 123
Name: TEST CARD
```

## Backend Integration

Ensure backend handles:

- Payment method creation with Xendit SDK
- Recurring payment setup
- Webhook for payment notifications
- Subscription status management

## UI/UX

- Green theme matching app design
- Material Icons for consistency
- Responsive card layouts
- Loading states
- Empty states
- Error messages via Toast
