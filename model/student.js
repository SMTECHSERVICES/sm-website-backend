// Import Mongoose and bcrypt
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'




// --- Student Enrolled Course Sub-Schema (Student's Progress Only) ---
// This schema defines what a course looks like when a student is enrolled in it.
// It ONLY tracks which lessons the student has completed, NOT the full lesson details.
const studentEnrolledCourseSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course', // Reference to the main Course model
    required: true,
  },
  courseTitle: { // Denormalized for quick display without population
    type: String,
    required: true,
  },
  courseThumbnail: { // Denormalized for quick display without population
    type: String,
    default: 'https://placehold.co/600x400/CCCCCC/000000?text=Course+Thumbnail'
  },
  // This array stores ONLY the IDs of lessons the student has completed
  completedLessonIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      // No ref here, as we typically fetch the main Course lessons to display all
    },
  ],
}, { _id: false }); // Do not create a separate _id for each enrolled course sub-document


// --- Student Schema ---
const studentSchema = new mongoose.Schema({
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
  enrolledCourses: [studentEnrolledCourseSchema], // Array of enrolled courses for the student
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// --- Pre-save hook for password hashing (remains the same) ---
studentSchema.pre('save', async function (next) {
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
studentSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Student = mongoose.model("Student",studentSchema);
const StudentEnrolledModel = mongoose.model("StudentEnrolledSchema",studentEnrolledCourseSchema)

export  {Student,StudentEnrolledModel};