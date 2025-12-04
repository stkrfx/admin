import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    // --- Links ---
    appointmentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Appointment',
      required: true,
      index: true
    },
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    expert: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Expert' // Useful for payouts
    },
    organisation: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Organisation' // Useful for payouts if expert belongs to org
    },

    // --- Transaction Details ---
    amount: { type: Number, required: true }, // Total charged to user (e.g. 100.00)
    currency: { type: String, default: 'AUD', uppercase: true },
    
    // Gateway Info (Stripe/Razorpay)
    gatewayId: { type: String, required: true, unique: true }, // Payment Intent ID
    method: { type: String, default: 'card' },
    receiptUrl: { type: String },

    // --- Status ---
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
      index: true
    },

    // --- The Money Split (Snapshot) ---
    // Critical: Calculate and save these values WHEN the payment is created.
    // Do not calculate on the fly for historical data.
    breakdown: {
      expertAmount: { type: Number, default: 0 }, // e.g. 60.00
      orgAmount: { type: Number, default: 0 },    // e.g. 20.00
      adminFee: { type: Number, default: 0 },     // e.g. 10.00 (Your Profit)
      tax: { type: Number, default: 0 },          // e.g. 10.00 (GST/VAT)
    },

    // --- Settlement (Payouts) ---
    settled: { type: Boolean, default: false, index: true }, // True = We paid the expert
    settlementDate: { type: Date },
    settlementReference: { type: String }, // Batch ID of the payout

    // --- Refunds ---
    refundedAmount: { type: Number, default: 0 },
    refundReason: { type: String },
    refundedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for Dashboard Performance
paymentSchema.index({ createdAt: -1 }); // Recent transactions
paymentSchema.index({ settled: 1, status: 1 }); // "Unsettled Funds" query

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export default Payment;