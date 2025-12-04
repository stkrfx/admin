import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    // Identity
    email: { type: String, required: true, lowercase: true, trim: true },
    
    // Auto-generated unique identifier
    username: { type: String, unique: true, sparse: true, trim: true },
    
    // Optional mobile
    mobile: { type: String, unique: true, sparse: true },
    
    // Auth & Security
    password: { type: String, select: false },
    role: { 
      type: String, 
      enum: ['admin', 'user', 'expert', 'organisation'], 
      required: true,
      default: 'user' 
    },
    
    // OAuth Providers
    providers: { 
      google: { id: String, email: String },
      facebook: { id: String }
    },

    // Profile Data
    name: { type: String },
    photo: { type: String },
    bio: { type: String },

    // Status Flags
    isBanned: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    forcePasswordChange: { type: Boolean, default: false },
    
    // Settings
    settings: { type: Object, default: {} },

    // --- NEW: Verification Fields ---
    verificationOTP: { type: String, select: false }, // Hidden by default
    verificationOTPExpiry: { type: Date, select: false },
  },
  { timestamps: true }
);

// Compound Index for Role-based email uniqueness
userSchema.index({ email: 1, role: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;