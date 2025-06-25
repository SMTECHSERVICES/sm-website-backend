


import express from 'express';
import mongoose from 'mongoose';

import {Student,StudentEnrolledModel} from '../model/student.js';
import {Course, Lesson} from '../model/course.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import generateCookies from '../lib/generateCookies.js';
import {studentProtectRoute} from '../middleware/student.js'


const router = express.Router();

dotenv.config();

// Secret key (should be in env file in real app)
const JWT_SECRET = process.env.JWT_SECRET;

// Registration route
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  //console.log(name,email,password);

  try {
    // 1. Check if student already exists
    const studentExist = await Student.findOne({ email });
    if (studentExist) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // 2. Create new student
    const student = await Student.create({ fullName:name, email, password });

    // 3. Generate JWT token
    const token = jwt.sign({ id: student._id }, JWT_SECRET, {
      expiresIn: '7d', // 7 days expiry
    });

    // 4. Set cookie with token
    res.cookie('token', token, {
      httpOnly: true,       // prevents client-side JS access
      secure: true,        // set to true in production with HTTPS
      sameSite: 'none',     // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // 5. Return success
    return res.status(201).json({
      message: 'User created successfully',
      student: {
        id: student._id,
        fullName: student.fullName,
        email: student.email,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ msg: 'Server error' });
  }
});


router.post('/login',async(req,res)=>{
    const {email,password} = req.body;
try {
    
    const user = await Student.findOne({email});
    if(!user){
        return res.status(404).json({
            msg:'user does not exist'
        })
    }
     if (user && (await user.comparePassword(password))) {
                const token = generateCookies(user._id);
                  res.cookie('token', token, {
      httpOnly: true,       // prevents client-side JS access
       secure: true,        // set to true in production with HTTPS
      sameSite: 'none',      // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
            
    
                res.json({
                    msg:'login successfull',
                    _id: user._id,
                    email: user.email,
                    
                });
            }else{
                return res.status(401).json({
                    msg:'invalid email or password'
                })
            }
} catch (error) {
      console.error("login error:", error);
    return res.status(500).json({ msg: 'Server error' });
}


});

router.get('/get-allCourses', async (req, res) => {
  try {
    //console.log('inside get all courses')
    const allCourses = await Course.find().select('title duration description thumbnail skillsCovered category').populate("instructor","fullName");
    res.status(200).json(allCourses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch courses', error });
  }
});

//this route will be used to fetch the individual course detail based on the id it get from the params

router.get('/course-details/:id',async(req,res)=>{
    const id = req.params.id;
    try {
      const courseDetail = await Course.findById(id).select("-lessons").populate('instructor',"fullName");
      if(!courseDetail){
        return res.status(404).json({
          msg:'Course does not exist'
        })
      }

      return res.status(200).json({
        courseDetail
      })
      
    } catch (error) {
      
    }
})

router.use(studentProtectRoute);

//This route is created to get all the courses a student is enrolled in

router.get('/getMyCourses', studentProtectRoute, async (req, res) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Get course IDs from enrolled courses
    const courseIds = student.enrolledCourses.map(ec => ec.courseId);

    // Get basic course information for enrolled courses
    const courses = await Course.find(
      { _id: { $in: courseIds } },
      { _id: 1, title: 1, thumbnail: 1, lessons: 1 }
    ).lean();

    // Create a map for quick course lookup
    const courseMap = {};
    courses.forEach(course => {
      courseMap[course._id.toString()] = {
        title: course.title,
        thumbnail: course.thumbnail,
        totalLessons: course.lessons.length
      };
    });

    // Prepare response with progress information
    const enrolledCourses = student.enrolledCourses.map(enrollment => {
      const courseInfo = courseMap[enrollment.courseId.toString()] || {};
      
      return {
        courseId: enrollment.courseId,
        title: enrollment.courseTitle,
        thumbnail: enrollment.courseThumbnail,
        progress: {
          completed: enrollment.completedLessonIds.length,
          total: courseInfo.totalLessons || 0,
          percentage: courseInfo.totalLessons 
            ? Math.round((enrollment.completedLessonIds.length / courseInfo.totalLessons) * 100)
            : 0
        },
        available: !!courseInfo.title // Flag if course still exists
      };
    });

    res.status(200).json({ enrolledCourses });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
});

//This route is created for the student to enroll in the course



router.post('/enroll/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ msg: 'Student does not exist' });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ msg: 'Course does not exist' });
    }

    // Check if already enrolled
    const alreadyEnrolled = student.enrolledCourses.some(
      c => c.courseId.toString() === id
    );
    
    if (alreadyEnrolled) {
      return res.status(400).json({ msg: 'Already enrolled in this course' });
    }

    // Create enrollment object (no need for separate model)
    const enrollment = {
      courseId: id,
      courseTitle: course.title,
      courseThumbnail: course.thumbnail,
      completedLessonIds: [] // Initialize empty lessons
    };

    student.enrolledCourses.push(enrollment);
    await student.save();

    return res.status(200).json({
      msg: 'Successfully enrolled in course',
      course: {
        _id: course._id,
        title: course.title,
        thumbnail: course.thumbnail
      }
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    return res.status(500).json({ msg: 'Internal server error' });
  }
});


//this route will fetch all the lesson and tittle of the course

router.get('/myCourse/:id', async (req, res) => {
  const courseId = req.params.id;
  const studentId = req.user._id; // Assuming authenticated student ID from middleware

  try {
    // 1. Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course does not exist' });
    }

    // 2. Find the student and their enrollment for this course
    const student = await Student.findOne({
      _id: studentId,
      'enrolledCourses.courseId': courseId
    }, {
      'enrolledCourses.$': 1 // Project only the matching enrolled course
    });

    if (!student) {
      return res.status(403).json({ msg: 'You are not enrolled in this course' });
    }

    const enrollment = student.enrolledCourses[0];

    // 3. Prepare lesson data with completion status
    const lessonsWithStatus = course.lessons.map(lesson => ({
      _id: lesson._id,
      lessonNumber: lesson.lessonNumber,
      title: lesson.title,
      notesPdfLink: lesson.notesPdfLink,
      videoLink: lesson.videoLink,
      liveClassLink: lesson.liveClassLink,
      isCompleted: enrollment.completedLessonIds.some(
        completedId => completedId.equals(lesson._id)
      )
    }));

    // 4. Send the response
    res.json({
      _id: course._id,
      title: course.title,
      lessons: lessonsWithStatus,
      completedLessons: enrollment.completedLessonIds,
      progress: `${enrollment.completedLessonIds.length}/${course.lessons.length}`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});


//this route will be used to mark the lesson as complete or false

router.patch('/lesson/:id', async (req, res) => {
  const lessonId = req.params.id;
  const studentId = req.user._id; // From authentication middleware
  const { completed } = req.body; // Expects { completed: true/false }

  // Validate input
  if (!mongoose.Types.ObjectId.isValid(lessonId)) {
    return res.status(400).json({ msg: 'Invalid lesson ID' });
  }

  if (typeof completed !== 'boolean') {
    return res.status(400).json({ msg: 'Missing completion status' });
  }

  try {
    // 1. Find the course containing the lesson
    const course = await Course.findOne({ "lessons._id": lessonId });
    
    if (!course) {
      return res.status(404).json({ msg: 'Lesson not found in any course' });
    }

    // 2. Find student and their enrollment for this course
    const student = await Student.findOne({
      _id: studentId,
      'enrolledCourses.courseId': course._id
    });

    if (!student) {
      return res.status(403).json({ msg: 'Student not enrolled in this course' });
    }

    // 3. Update the completedLessonIds array
    const updateOperation = completed
      ? { $addToSet: { "enrolledCourses.$.completedLessonIds": lessonId } }
      : { $pull: { "enrolledCourses.$.completedLessonIds": lessonId } };

    // 4. Apply the update
    const result = await Student.updateOne(
      {
        _id: studentId,
        'enrolledCourses.courseId': course._id
      },
      updateOperation
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ 
        msg: completed 
          ? 'Lesson already marked as completed' 
          : 'Lesson was not completed'
      });
    }

    res.json({ 
      msg: `Lesson ${completed ? 'marked as complete' : 'marked as incomplete'}`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    // Get all cookies from the request
    const cookies = req.cookies;
    
    // Clear each cookie individually with proper options
    Object.keys(cookies).forEach(cookieName => {
      res.clearCookie(cookieName, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined
      });
    });

    // Additional security measures
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    
    // Send successful logout response
    res.status(200).json({ 
      success: true,
      message: 'Successfully logged out. All cookies cleared.' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

export default router;
