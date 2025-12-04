import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    // --- Relationships ---
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    expertId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Expert', 
      required: true,
      index: true 
    },

    // --- Scheduling ---
    appointmentDate: { 
      type: Date, 
      required: true 
    },
    appointmentTime: { 
      type: String, // Format: "HH:MM"
      required: true 
    },

    // --- Service Snapshot ---
    serviceName: { type: String, required: true },
    appointmentType: { 
      type: String, 
      enum: ['Video Call', 'Clinic Visit'], 
      required: true 
    },
    duration: { type: Number, required: true }, // Minutes
    price: { type: Number, required: true },

    // --- Status ---
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
      default: 'pending',
      index: true,
    },
    
    // --- Payment Tracking ---
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentId: { type: String }, // Stripe/Razorpay ID

    // --- Session Meta ---
    meetingLink: { type: String },
    whiteboardUrl: { type: String },
    notes: { type: String, maxlength: 1000 },

    // --- Cancellation Logic ---
    cancelledBy: {
      type: String,
      enum: ['user', 'expert', 'admin', null],
      default: null,
    },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

// Prevent double-booking: Expert cannot be 'pending' or 'confirmed' at same time slot
// Note: We use 'sparse' or 'partialFilterExpression' to ignore cancelled/completed slots
appointmentSchema.index(
  { expertId: 1, appointmentDate: 1, appointmentTime: 1 },
  { 
    unique: true, 
    partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } } 
  }
);

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
export default Appointment;