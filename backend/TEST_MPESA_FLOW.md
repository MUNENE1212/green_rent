# M-Pesa Integration Testing Guide

## Changes Made

### 1. Payment Model Updates (`src/models/Payment.model.js`)
Added the following fields to support M-Pesa wallet deposits:

- `walletId`: Reference to RentWallet model (line 31-35)
- `mpesaCheckoutRequestId`: STK Push checkout request ID (line 140-143)
- `mpesaMerchantRequestId`: STK Push merchant request ID (line 145-148)
- `mpesaReceiptNumber`: M-Pesa transaction receipt (line 150)
- `phoneNumber`: Customer phone number for payment (line 152)
- `errorMessage`: Error details if payment fails (line 154)

Added indexes for efficient queries:
- `walletId` index (line 225)
- `mpesaCheckoutRequestId` index (line 229)

## Testing the Complete Flow

### Step 1: Make a Deposit via Frontend
1. Log in to the application at `http://localhost:3000`
2. Navigate to the Wallet page
3. Enter amount (minimum KES 10)
4. Enter M-Pesa phone number (format: 254712345678)
5. Click "Deposit via M-Pesa"
6. You should see: "STK Push initiated. Please check your phone to complete payment"

### Step 2: Complete Payment on Phone
1. Check your phone for M-Pesa STK Push prompt
2. Enter your M-Pesa PIN
3. Confirm the payment

### Step 3: Verify Callback Processing
Since we're using webhook.site for testing, the automatic callback won't update the wallet.
To manually complete the payment:

```bash
# Get the payment ID from the response or check pending payments
curl http://localhost:5000/api/v1/mpesa/pending-payments

# Use the simulate-callback endpoint to manually complete it
curl -X POST http://localhost:5000/api/v1/mpesa/simulate-callback \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "YOUR_PAYMENT_ID_HERE"
  }'
```

### Step 4: Verify Wallet Balance Updated
```bash
# Login first to get auth token
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  | jq -r '.data.tokens.accessToken')

# Check wallet balance
curl http://localhost:5000/api/v1/rent-wallets/me \
  -H "Authorization: Bearer $TOKEN"
```

## Production Setup

For production, update the `.env` file:

```bash
# Change environment to production
MPESA_ENVIRONMENT=production

# Use your production credentials from Safaricom
MPESA_CONSUMER_KEY=your_production_key
MPESA_CONSUMER_SECRET=your_production_secret
MPESA_SHORTCODE=your_production_shortcode
MPESA_PASSKEY=your_production_passkey

# Set callback URL to your deployed backend
MPESA_CALLBACK_URL=https://your-domain.com/api/v1/mpesa/callback
```

## Key Points

✅ **New deposits will now work correctly** - The Payment model includes `walletId` field
✅ **Wallet balance updates on callback** - When M-Pesa callback is received, wallet.deposit() is called
✅ **STK Push working** - Successfully tested with Safaricom sandbox
✅ **Auto-wallet creation** - If user doesn't have a wallet, one is created automatically

## Debug Endpoints

```bash
# Test M-Pesa credentials
curl http://localhost:5000/api/v1/mpesa/test-credentials

# Check pending payments
curl http://localhost:5000/api/v1/mpesa/pending-payments

# Manually complete a payment (testing only)
curl -X POST http://localhost:5000/api/v1/mpesa/simulate-callback \
  -H "Content-Type: application/json" \
  -d '{"paymentId": "PAYMENT_ID"}'
```

## Troubleshooting

### Issue: Wallet balance not updating
- Check if payment has `walletId`: `curl http://localhost:5000/api/v1/mpesa/pending-payments`
- Verify wallet exists for user
- Check callback is being received (or use simulate-callback for testing)

### Issue: STK Push not received
- Verify phone number format (254XXXXXXXXX)
- Check M-Pesa credentials are correct
- Ensure shortcode and passkey match

### Issue: "Invalid CallBackURL" error
- M-Pesa sandbox may reject some domains (like ngrok free tier)
- Use webhook.site or paid ngrok/similar service
- For production, use your deployed domain
