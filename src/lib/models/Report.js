import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    // Who is reporting?
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Who/What is being reported?
    reportedOn: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Context
    type: { 
      type: String, 
      enum: ['user', 'expert', 'organisation', 'message', 'other'], 
      required: true 
    },
    reason: { type: String, required: true },
    description: { type: String },
    
    // Evidence
    messageIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    screenshots: [{ type: String }],
    
    // Admin Resolution
    isResolved: { type: Boolean, default: false },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin ID
    resolutionNotes: { type: String },
  },
  { timestamps: true }
);

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
export default Report;