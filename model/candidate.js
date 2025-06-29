

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const candidateSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { 
    type: String, 
    required: true,
    unique: true 
  },
  password: { type: String, required: true },
  phone: { type: String, required: true,unique:true },
  dob: { type: String, required: true },
  qualification: { type: String, required: true },
  experience: { type: String, required: true },
  location: { type: String, required: true },
  resumeUrl: { type: String, required: true },
  profilePicUrl: { type: String, required: true },
  razorpayOrderId: { type: String,},
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'success', 'failed'], 
    default: 'pending',
    
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
   
  }
});

// Hash password before saving
candidateSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const Candidate = mongoose.model("Candidate",candidateSchema);

export default Candidate;


// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';

// const candidateSchema = new mongoose.Schema({
//   fullName: { type: String, required: true },
//   email: { 
//     type: String, 
//     required: true,
//     unique: true 
//   },
//   password: { type: String, required: true },
//   phone: { type: String, required: true,unique:true },
//   dob: { type: String, required: true },
//   qualification: { type: String, required: true },
//   experience: { type: String, required: true },
//   location: { type: String, required: true },
//   resumeUrl: { type: String, required: true },
//   profilePicUrl: { type: String, required: true },

//   razorpayOrderId: { type: String },
//   razorpayPaymentId: { type: String },         // ✅ NEW
//   razorpaySignature: { type: String },         // ✅ NEW
//   paymentStatus: { 
//     type: String, 
//     enum: ['pending', 'success', 'completed', 'failed'], 
//     default: 'pending'
//   },

//   createdAt: { type: Date, default: Date.now }
// });

// // 🔐 Hash password before saving
// candidateSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();

//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// const Candidate = mongoose.model("Candidate", candidateSchema);

// export default Candidate;
