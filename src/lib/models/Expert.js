import mongoose from 'mongoose';

const expertSchema = new mongoose.Schema(
  {
    // Links back to the User identity
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      unique: true // One Expert Profile per Expert User
    },
    
    bio: { type: String },
    speciality: { type: [String], default: [] },
    
    // Stats
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    
    // Verification & Status
    documents: { type: [String], default: [] },
    underVerification: { type: Boolean, default: true },
    isListed: { type: Boolean, default: true }, // Can be toggled by Admin
    unlistedReason: { type: String },
    
    // For approval workflows (if they edit profile, it goes here first)
    pendingChanges: { type: Object },
  },
  { timestamps: true }
);

const Expert = mongoose.models.Expert || mongoose.model('Expert', expertSchema);
export default Expert;