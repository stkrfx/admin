import mongoose from 'mongoose';

const orgSchema = new mongoose.Schema(
  {
    // Links back to the User identity
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      unique: true 
    },
    
    name: { type: String, required: true },
    address: { type: String },
    contactEmail: { type: String }, // Public contact email (can differ from login email)
    
    // Specific credentials for their own sub-users or API access if needed
    publicCredentials: {
      username: { type: String },
      password: { type: String },
    },
    
    // Verification & Status
    isVerified: { type: Boolean, default: false },
    underVerification: { type: Boolean, default: true },
    isListed: { type: Boolean, default: true },
    pendingChanges: { type: Object },
  },
  { timestamps: true }
);

const Organisation = mongoose.models.Organisation || mongoose.model('Organisation', orgSchema);
export default Organisation;