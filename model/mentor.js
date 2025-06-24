import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';


const mentorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, 'Please enter a valid email address'], // Email validation regex
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
   
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// --- Pre-save hook for password hashing (remains the same) ---
mentorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// --- Method to compare entered password with hashed password (remains the same) ---
mentorSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Mentor = mongoose.model("Mentor",mentorSchema);

export default Mentor;