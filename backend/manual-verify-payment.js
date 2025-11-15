require('dotenv').config();

const mongoose = require('mongoose');
const Booking = require('./src/modules/bookings/booking.model');
const { instance: sePayClient } = require('./src/services/sepay.client');
const transactionMatcher = require('./src/services/transaction-matcher.service');
const paymentService = require('./src/services/payment.service');

const MONGODB_URI = process.env.MONGODB_URI;

async function manualVerifyPayment(bookingId) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // 1. Lấy booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.error('Booking not found!');
      process.exit(1);
    }

    console.log('=== Booking Info ===');
    console.log('ID:', booking._id);
    console.log('Payment Status:', booking.payment.status);
    console.log('Reference:', booking.payment.reference);
    console.log('Amount:', booking.pricing.totalAmount);
    console.log('');

    // 2. Lấy transactions từ SePay (24h gần nhất)
    console.log('Fetching transactions from SePay...');
    const transactions = await sePayClient.getRecentTransactions(24 * 60); // 24 hours
    console.log(`Found ${transactions.length} transactions\n`);
    
    // Debug: Show recent transactions
    console.log('=== Recent Transactions (last 5) ===');
    transactions.slice(0, 5).forEach((tx, i) => {
      console.log(`\n${i + 1}. Transaction:`);
      console.log('   ID:', tx.id);
      console.log('   Amount:', tx.amount_in);
      console.log('   Content:', tx.transaction_content);
      console.log('   Date:', tx.transaction_date);
    });
    console.log('');

    // 3. Tìm transaction khớp
    console.log('Matching transaction...');
    let matchedTransaction = null;
    
    for (const tx of transactions) {
      const parsed = transactionMatcher.parsePaymentReference(tx.transaction_content);
      if (parsed && parsed.bookingId === booking._id.toString()) {
        matchedTransaction = tx;
        break;
      }
    }

    if (!matchedTransaction) {
      console.error('❌ No matching transaction found!');
      console.log('\nRecent transactions:');
      transactions.slice(0, 5).forEach(tx => {
        console.log(`- ${tx.transaction_content} | ${tx.amount_in} VND | ${tx.transaction_date}`);
      });
      process.exit(1);
    }

    console.log('✅ Found matching transaction!');
    console.log('Transaction ID:', matchedTransaction.id);
    console.log('Amount:', matchedTransaction.amount_in);
    console.log('Content:', matchedTransaction.transaction_content);
    console.log('Date:', matchedTransaction.transaction_date);
    console.log('');

    // 4. Process payment
    console.log('Processing payment...');
    const result = await paymentService.processPayment(
      booking._id,
      matchedTransaction,
      'manual'
    );

    console.log('✅ Payment verified successfully!');
    console.log('Booking Status:', result.booking.status);
    console.log('Payment Status:', result.booking.payment.status);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Lấy bookingId từ command line
const bookingId = process.argv[2];
if (!bookingId) {
  console.error('Usage: node manual-verify-payment.js <bookingId>');
  process.exit(1);
}

manualVerifyPayment(bookingId);
