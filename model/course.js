import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  lessonNumber: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  notesPdfLink: {
    type: String, // URL to PDF notes
  },
  videoLink: {
    type: String, // URL to video
  },
  liveClassLink: {
    type: String, // URL to live class (optional)
  },
}, { _id: true }); // Ensure lessons have their own _id

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
  },
  thumbnail: {
    type: String, // URL to the course thumbnail
    default: 'https://placehold.co/600x400/CCCCCC/000000?text=Course+Thumbnail'
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor', // Assuming you have a Mentor model
  },
  lessons: [lessonSchema], // Array of lessons, this is where new lessons are added
  price: {
    type: Number,
    default: 0,
  },
  duration:{
    type:String,
    required:true
  },
  category: {
    type: String,
    trim: true,
  },
  skillsCovered:{
    type:String,
    required:true
  },
  syllabusPdfLink: {
    type: String, // URL to PDF notes
    required:true
  },
//   isPublished: {
//     type: Boolean,
//     default: false,
//   }
}, {
  timestamps: true,
});

const Course = mongoose.model("Course",courseSchema);
const Lesson = mongoose.model("Lesson",lessonSchema)

export  {Course,Lesson}