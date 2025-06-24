// Import Mongoose and bcrypt
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'

// const lessonSchema = new mongoose.Schema({
//   lessonNumber: {
//     type: Number,
//     required: true,
//   },
//   title: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   notesPdfLink: {
//     type: String, // URL to PDF notes
//   },
//   videoLink: {
//     type: String, // URL to video
//   },
//   liveClassLink: {
//     type: String, // URL to live class (optional)
//   },
// }, { _id: true }); // Ensure lessons have their own _id

// --- Course Schema (Main Source of Truth for Mentors/Admin) ---
// This defines the main Course structure that mentors/admin will manage.
// Lessons are added here by mentors regularly.
// const courseSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: [true, 'Course title is required'],
//     trim: true,
//     unique: true,
//   },
//   description: {
//     type: String,
//     required: [true, 'Course description is required'],
//   },
//   thumbnail: {
//     type: String, // URL to the course thumbnail
//     default: 'https://placehold.co/600x400/CCCCCC/000000?text=Course+Thumbnail'
//   },
//   instructor: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Mentor', // Assuming you have a Mentor model
//   },
//   lessons: [lessonSchema], // Array of lessons, this is where new lessons are added
//   price: {
//     type: Number,
//     default: 0,
//   },
//   category: {
//     type: String,
//     trim: true,
//   },
//   isPublished: {
//     type: Boolean,
//     default: false,
//   }
// }, {
//   timestamps: true,
// });


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

export default Student;