/**
 * Integration tests for Manual Payment Verification API
 * 
 * Test coverage:
 * - Admin can verify payment manually
 * - Non-admin cannot verify payment
 * - Cannot verify already completed payment
 * - Cannot verify cancelled booking
 * - Transaction validation
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../app');
const Booking = require('../booking.model');
const User = require('../../users/user.model');
const Homestay = require('../../homestays/homestay.model');
const { BOOKING_STATUS, PAYMENT_STATUS, ROLES } = require('../../../config/constants');

// Mock SeePay client
jest.mock('../../../services/sepay.client');
const SePayClient = require('../../../services/sepay.client');

describe('POST /api/v1/bookings/:id/payment/verify - Manual Payment Verification', () => {
  let adminUser;
  let guestUser;
  let hostUser;
  let homestay;
  let booking;
  let adminToken;
  let guestToken;

  // Helper function to get error message from response
  const getErrorMessage = (response) => {
    return response.body.message || response.body.error || response.body.errors?.[0]?.msg || '';
  };

  beforeAll(async () => {
    // Load environment variables
    require('dotenv').config();
    
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      // Use test database or fallback to main database with test suffix
      const testUri = process.env.MONGODB_URI_TEST || 
                     (process.env.MONGODB_URI 
                       ? process.env.MONGODB_URI.replace('/BookingHomestay?', '/BookingHomestay-test?')
                       : 'mongodb://localhost:27017/homestay-test');
      
      console.log('Connecting to test database...');
      await mongoose.connect(testUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log('Connected to test database successfully');
    }
  }, 30000); // 30 second timeout

  afterAll(async () => {
    // Cleanup and close connection
    await User.deleteMany({});
    await Homestay.deleteMany({});
    await Booking.deleteMany({});
    await mongoose.connection.close();
  }, 30000); // 30 second timeout

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Homestay.deleteMany({});
    await Booking.deleteMany({});

    // Create test users
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      role: ROLES.ADMIN,
      profile: {
        firstName: 'Admin',
        lastName: 'User'
      }
    });

    guestUser = await User.create({
      email: 'guest@test.com',
      password: 'password123',
      role: ROLES.GUEST,
      profile: {
        firstName: 'Guest',
        lastName: 'User'
      }
    });

    hostUser = await User.create({
      email: 'host@test.com',
      password: 'password123',
      role: ROLES.HOST,
      profile: {
        firstName: 'Host',
        lastName: 'User'
      }
    });

    // Create test homestay
    homestay = await Homestay.create({
      title: 'Test Homestay',
      description: 'This is a test homestay for payment verification testing. It has all required fields and is used for integration tests.',
      propertyType: 'entire_place',
      hostId: hostUser._id,
      location: {
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
        coordinates: {
          type: 'Point',
          coordinates: [105.8342, 21.0278] // Hanoi coordinates
        }
      },
      capacity: {
        guests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 1
      },
      pricing: {
        basePrice: 1000000,
        cleaningFee: 100000,
        serviceFee: 50000,
        currency: 'VND'
      },
      status: 'active'
    });

    // Create test booking with pending payment
    booking = await Booking.create({
      homestayId: homestay._id,
      hostId: hostUser._id,
      guestId: guestUser._id,
      checkInDate: new Date('2025-12-01'),
      checkOutDate: new Date('2025-12-03'),
      numberOfGuests: 2,
      numberOfNights: 2,
      pricing: {
        basePrice: 1000000,
        numberOfNights: 2,
        cleaningFee: 100000,
        serviceFee: 50000,
        totalAmount: 2150000,
        currency: 'VND',
        hostAmount: 1935000,
        platformCommission: 215000,
        commissionRate: 0.1
      },
      status: BOOKING_STATUS.PENDING,
      payment: {
        status: PAYMENT_STATUS.PENDING,
        method: 'bank_transfer',
        reference: `BOOKING-${new Date().getTime()}-TEST`
      }
    });

    // Generate tokens
    const { generateTokenPair } = require('../../../utils/jwt.util');
    const adminTokens = generateTokenPair({
      userId: adminUser._id,
      email: adminUser.email,
      role: adminUser.role
    });
    const guestTokens = generateTokenPair({
      userId: guestUser._id,
      email: guestUser.email,
      role: guestUser.role
    });
    
    adminToken = adminTokens.accessToken;
    guestToken = guestTokens.accessToken;

    // Mock SeePay client response
    SePayClient.instance = {
      getTransactionDetail: jest.fn()
    };
  });

  describe('Success Cases', () => {
    it('should verify payment manually when admin provides valid transaction', async () => {
      // Mock SeePay response
      const mockTransaction = {
        transaction: {
          id: 'FT25318123456',
          amount_in: 2150000,
          transaction_content: booking.payment.reference,
          transaction_date: '2025-11-14 10:30:00',
          bank_brand_name: 'MB Bank',
          account_number: '0327207918',
          reference_number: 'FT25318123456'
        }
      };

      SePayClient.instance.getTransactionDetail.mockResolvedValue(mockTransaction);

      const response = await request(app)
        .post(`/api/v1/bookings/${booking._id}/payment/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId: 'FT25318123456',
          notes: 'Manual verification test'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.paymentStatus).toBe(PAYMENT_STATUS.COMPLETED);
      expect(response.body.data.booking.bookingStatus).toBe(BOOKING_STATUS.CONFIRMED);
      expect(response.body.data.transaction.id).toBe('FT25318123456');
      expect(response.body.data.verification.method).toBe('manual');
      expect(response.body.data.verification.verifiedBy).toBe(adminUser._id.toString());

      // Verify database updated
      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking.payment.status).toBe(PAYMENT_STATUS.COMPLETED);
      expect(updatedBooking.payment.verification.method).toBe('manual');
      expect(updatedBooking.payment.verification.verifiedBy.toString()).toBe(adminUser._id.toString());
    });

    it('should handle amount mismatch with tolerance', async () => {
      // Mock SeePay response with slightly different amount (within tolerance)
      const mockTransaction = {
        transaction: {
          id: 'FT25318123456',
          amount_in: 2150500, // 500 VND more (within ±1000 tolerance)
          transaction_content: booking.payment.reference,
          transaction_date: '2025-11-14 10:30:00',
          bank_brand_name: 'MB Bank',
          account_number: '0327207918',
          reference_number: 'FT25318123456'
        }
      };

      SePayClient.instance.getTransactionDetail.mockResolvedValue(mockTransaction);

      const response = await request(app)
        .post(`/api/v1/bookings/${booking._id}/payment/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId: 'FT25318123456',
          notes: 'Amount mismatch within tolerance'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amountValidation.isValid).toBe(true);
      expect(response.body.data.amountValidation.difference).toBe(500);
    });
  });

  describe('Authorization Tests', () => {
    it('should reject request without token', async () => {
      const response = await request(app)
        .post(`/api/v1/bookings/${booking._id}/payment/verify`)
        .send({
          transactionId: 'FT25318123456',
          notes: 'Test'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request from non-admin user', async () => {
      const response = await request(app)
        .post(`/api/v1/bookings/${booking._id}/payment/verify`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          transactionId: 'FT25318123456',
          notes: 'Test'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      // Message might be in different field depending on error middleware
      const message = response.body.message || response.body.error || '';
      expect(message.toLowerCase()).toMatch(/insufficient|permission|denied|forbidden/);
    });
  });

  describe('Validation Tests', () => {
    it('should reject request without transactionId', async () => {
      const response = await request(app)
        .post(`/api/v1/bookings/${booking._id}/payment/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Test'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      const message = response.body.message || response.body.error || '';
      expect(message.toLowerCase()).toMatch(/transaction.*id.*required/);
    });

    it('should reject request with invalid booking ID', async () => {
      const response = await request(app)
        .post('/api/v1/bookings/invalid-id/payment/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId: 'FT25318123456',
          notes: 'Test'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject request for non-existent booking', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/v1/bookings/${fakeId}/payment/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId: 'FT25318123456',
          notes: 'Test'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      const message = response.body.message || response.body.error || '';
      expect(message.toLowerCase()).toMatch(/booking.*not.*found/);
    });
  });

  describe('Business Logic Tests', () => {
    it('should reject verification for already completed payment', async () => {
      // Update booking to completed
      booking.payment.status = PAYMENT_STATUS.COMPLETED;
      booking.status = BOOKING_STATUS.CONFIRMED;
      await booking.save();

      const response = await request(app)
        .post(`/api/v1/bookings/${booking._id}/payment/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId: 'FT25318123456',
          notes: 'Test'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      const message = getErrorMessage(response);
      expect(message.toLowerCase()).toMatch(/payment.*already.*completed/);
    });

    it('should reject verification for cancelled booking', async () => {
      // Update booking to cancelled
      booking.status = BOOKING_STATUS.CANCELLED;
      await booking.save();

      const response = await request(app)
        .post(`/api/v1/bookings/${booking._id}/payment/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId: 'FT25318123456',
          notes: 'Test'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      const message = getErrorMessage(response);
      expect(message.toLowerCase()).toMatch(/cannot.*verify.*payment.*cancelled/);
    });

    it('should handle SeePay API error', async () => {
      // Mock SeePay error
      SePayClient.instance.getTransactionDetail.mockRejectedValue(
        new Error('SeePay API unavailable')
      );

      const response = await request(app)
        .post(`/api/v1/bookings/${booking._id}/payment/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId: 'FT25318123456',
          notes: 'Test'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      const message = getErrorMessage(response);
      expect(message.toLowerCase()).toMatch(/cannot.*retrieve.*transaction.*sepay/);
    });

    it('should handle invalid transaction data from SeePay', async () => {
      // Mock invalid SeePay response
      SePayClient.instance.getTransactionDetail.mockResolvedValue({
        transaction: null
      });

      const response = await request(app)
        .post(`/api/v1/bookings/${booking._id}/payment/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId: 'FT25318123456',
          notes: 'Test'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      const message = getErrorMessage(response);
      expect(message.toLowerCase()).toMatch(/invalid.*transaction.*data/);
    });
  });

  describe('Idempotency Tests', () => {
    it('should handle duplicate verification gracefully', async () => {
      // Mock SeePay response
      const mockTransaction = {
        transaction: {
          id: 'FT25318123456',
          amount_in: 2150000,
          transaction_content: booking.payment.reference,
          transaction_date: '2025-11-14 10:30:00',
          bank_brand_name: 'MB Bank',
          account_number: '0327207918',
          reference_number: 'FT25318123456'
        }
      };

      SePayClient.instance.getTransactionDetail.mockResolvedValue(mockTransaction);

      // First verification
      await request(app)
        .post(`/api/v1/bookings/${booking._id}/payment/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId: 'FT25318123456',
          notes: 'First verification'
        })
        .expect(200);

      // Second verification (should fail)
      const response = await request(app)
        .post(`/api/v1/bookings/${booking._id}/payment/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId: 'FT25318123456',
          notes: 'Second verification'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      const message = getErrorMessage(response);
      expect(message.toLowerCase()).toMatch(/payment.*already.*completed/);
    });
  });
});
