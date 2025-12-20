# Payment Backend Integration with Razorpay

## Overview
Implemented complete payment integration connecting the frontend payment system with Django backend and Razorpay payment gateway. This provides real payment processing capabilities with proper database persistence and transaction management.

## Backend Implementation

### 1. Database Models

#### CustomerInvoice Model
```python
class CustomerInvoice(models.Model):
    order = models.ForeignKey(SaleOrder, on_delete=models.PROTECT)
    invoice_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
```

#### Payment Model
```python
class Payment(models.Model):
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateTimeField()
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    customer_invoice = models.ForeignKey(CustomerInvoice, on_delete=models.PROTECT)
    razorpay_order_id = models.CharField(max_length=255)
    razorpay_payment_id = models.CharField(max_length=255)
    razorpay_signature = models.CharField(max_length=512)
```

### 2. API Endpoints

#### Invoice Endpoints
- `GET /api/products/invoices/` - List user invoices
- `GET /api/products/invoices/{id}/` - Get invoice details

#### Payment Endpoints
- `POST /api/products/payments/create-order/` - Create Razorpay payment order
- `POST /api/products/payments/verify/` - Verify Razorpay payment
- `GET /api/products/payments/{id}/` - Get payment details

### 3. PaymentService Class

#### Create Razorpay Order
```python
@staticmethod
@transaction.atomic
def create_razorpay_order(invoice_id=None, bill_id=None, amount=None):
    # Validates invoice exists and belongs to user
    # Creates Razorpay order via API
    # Creates Payment record in database
    # Returns (Payment instance, razorpay_order_data)
```

#### Verify Payment
```python
@staticmethod
@transaction.atomic
def verify_razorpay_payment(payment_id, razorpay_payment_id, razorpay_signature):
    # Verifies Razorpay signature
    # Updates Payment record with payment details
    # Returns updated Payment instance
```

### 4. Serializers

#### CreatePaymentOrderSerializer
- Validates invoice_id belongs to current user
- Supports optional custom amount
- Returns payment order details for frontend

#### VerifyPaymentSerializer
- Validates payment_id belongs to current user
- Processes Razorpay verification data
- Returns payment verification result

#### InvoiceListSerializer
- Transforms database invoices to frontend format
- Calculates payment status and amount due
- Generates invoice numbers (INV/XXXX format)

## Frontend Integration

### 1. API Utilities

#### Invoice API Functions
```javascript
export const invoicesAPI = {
  getUserInvoices: async () => {
    const response = await api.get('/products/invoices/');
    return response.data;
  },
  
  getInvoice: async (invoiceId) => {
    const response = await api.get(`/products/invoices/${invoiceId}/`);
    return response.data;
  },
};
```

#### Payment API Functions
```javascript
export const paymentsAPI = {
  createPaymentOrder: async (invoiceId, amount = null) => {
    const response = await api.post('/products/payments/create-order/', {
      invoice_id: invoiceId,
      ...(amount && { amount })
    });
    return response.data;
  },
  
  verifyPayment: async (paymentId, razorpayPaymentId, razorpaySignature) => {
    const response = await api.post('/products/payments/verify/', {
      payment_id: paymentId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    });
    return response.data;
  },
};
```

### 2. Real Data Integration

#### MyAccount Component
- Replaced mock data with real API calls
- Uses `invoicesAPI.getUserInvoices()` to fetch user invoices
- Transforms API response to match UI requirements
- Handles loading states and error scenarios

#### Payment Component
- Integrates with Razorpay Checkout
- Creates payment orders via backend API
- Handles Razorpay payment flow
- Verifies payments through backend
- Updates invoice status after successful payment

### 3. Razorpay Integration

#### Payment Flow
1. **Create Order**: Backend creates Razorpay order and Payment record
2. **Open Checkout**: Frontend opens Razorpay checkout with order details
3. **Process Payment**: User completes payment through Razorpay
4. **Verify Payment**: Backend verifies payment signature
5. **Update Status**: Payment record updated, invoice marked as paid

#### Razorpay Configuration
```javascript
const options = {
  key: orderData.razorpay_key,
  amount: orderData.amount * 100, // Amount in paise
  currency: orderData.currency,
  name: 'ApparelDesk',
  description: `Payment for Invoice ${invoiceData.invoiceNumber}`,
  order_id: orderData.razorpay_order_id,
  handler: async function (response) {
    // Verify payment with backend
    await paymentsAPI.verifyPayment(
      orderData.payment_id,
      response.razorpay_payment_id,
      response.razorpay_signature
    );
  },
  // ... other options
};
```

## Configuration

### 1. Environment Variables
```env
# Razorpay Test Credentials
RAZORPAY_API_KEY=rzp_test_RtqzLjqLxzOjqC
RAZORPAY_API_SECRET=FX5iZ97nhL6Mb5wcUZpyoZ8A
RAZORPAY_TEST_MODE=True
```

### 2. Django Settings
```python
# Razorpay Configuration
RAZORPAY_API_KEY = config('RAZORPAY_API_KEY', default='')
RAZORPAY_API_SECRET = config('RAZORPAY_API_SECRET', default='')
RAZORPAY_TEST_MODE = config('RAZORPAY_TEST_MODE', default=True, cast=bool)
```

### 3. Frontend Dependencies
- Razorpay Checkout script loaded dynamically
- No additional npm packages required
- Uses existing API utility functions

## Security Features

### 1. Authentication & Authorization
- All payment endpoints require authentication
- Users can only access their own invoices and payments
- Payment verification includes signature validation

### 2. Data Validation
- Invoice ownership validation
- Payment amount validation
- Razorpay signature verification
- Transaction atomicity with database rollback

### 3. Error Handling
- Comprehensive error messages
- Graceful fallbacks for API failures
- Secure error logging without exposing sensitive data

## Testing

### 1. Sample Data Setup
```bash
# Create sample invoices for testing
python setup_sample_invoices.py
```

### 2. API Testing
```bash
# Test payment API endpoints
python test_payment_api.py
```

### 3. Test Credentials
- **User**: test@example.com / testpassword123
- **Razorpay**: Test mode with test API keys
- **Test Cards**: Use Razorpay test card numbers

## Payment Flow Diagram

```
Frontend                Backend                 Razorpay
   |                       |                       |
   |-- Create Order ------>|                       |
   |                       |-- Create Order ----->|
   |                       |<-- Order Details ----|
   |<-- Order Details -----|                       |
   |                       |                       |
   |-- Open Checkout ----->|                       |
   |                       |                       |
   |<-- Payment Success ---|                       |
   |                       |                       |
   |-- Verify Payment ---->|                       |
   |                       |-- Verify Signature ->|
   |                       |<-- Verification -----|
   |<-- Success Response --|                       |
```

## Error Scenarios

### 1. Payment Creation Errors
- Invalid invoice ID
- Invoice doesn't belong to user
- Razorpay API failure
- Database transaction failure

### 2. Payment Verification Errors
- Invalid payment ID
- Signature verification failure
- Payment already verified
- Database update failure

### 3. Frontend Error Handling
- Network connectivity issues
- API timeout errors
- Razorpay checkout cancellation
- Invalid payment responses

## Benefits

### 1. Real Payment Processing
- Actual money transactions (in test mode)
- Industry-standard payment gateway
- Multiple payment methods support
- Automatic payment verification

### 2. Database Persistence
- Complete payment audit trail
- Transaction history tracking
- Invoice status management
- Payment reconciliation support

### 3. Security & Compliance
- PCI DSS compliant payment processing
- Secure signature verification
- Encrypted payment data
- Audit logging capabilities

### 4. User Experience
- Seamless payment flow
- Real-time status updates
- Professional payment interface
- Mobile-responsive design

## Production Deployment

### 1. Razorpay Production Setup
1. Create Razorpay production account
2. Get production API keys
3. Update environment variables
4. Configure webhook endpoints

### 2. Security Checklist
- [ ] Use HTTPS in production
- [ ] Secure API key storage
- [ ] Enable webhook signature verification
- [ ] Implement rate limiting
- [ ] Add payment logging and monitoring

### 3. Testing Checklist
- [ ] Test with real Razorpay test cards
- [ ] Verify payment verification flow
- [ ] Test error scenarios
- [ ] Validate invoice status updates
- [ ] Check payment audit trail

## Future Enhancements

### 1. Advanced Features
- Partial payment support
- Refund processing
- Recurring payments
- Payment reminders

### 2. Integration Improvements
- Webhook handling for payment updates
- Real-time payment status sync
- Advanced payment analytics
- Multi-currency support

### 3. User Experience
- Saved payment methods
- Payment history export
- Payment receipt generation
- SMS/Email payment notifications