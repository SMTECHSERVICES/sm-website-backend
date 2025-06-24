import express from 'express';
import Mentor from '../model/mentor.js';
import {Course, Lesson} from '../model/course.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import upload from '../middleware/multer.js';
import uploadFileOnCloudinary from '../utils/uploadFileOnCloudinary.js';
import uploadOnCloudinaryBuffer from '../utils/uploadImageOnCloudinary.js';
import generateCookies from '../lib/generateCookies.js';
import { mentorProtectRoute } from '../middleware/mentor.js';
const router = express.Router();



dotenv.config();

// Secret key (should be in env file in real app)
const JWT_SECRET = process.env.JWT_SECRET;

// Registration route
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 1. Check if student already exists
    const mentorExist = await Mentor.findOne({ email });
    if (mentorExist) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // 2. Create new student
    const mentor = await Mentor.create({ fullName:name, email, password });

    // 3. Generate JWT token
    const token = jwt.sign({ id: mentor._id }, JWT_SECRET, {
      expiresIn: '7d', // 7 days expiry
    });

    // 4. Set cookie with token
    res.cookie('token', token, {
      httpOnly: true,       // prevents client-side JS access
      secure: false,        // set to true in production with HTTPS
      sameSite: 'strict',   // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // 5. Return success
    return res.status(201).json({
      message: 'mentor created successfully',
      mentor: {
        id: mentor._id,
        fullName: mentor.fullName,
        email: mentor.email,
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
    
    const user = await Mentor.findOne({email});
    if(!user){
        return res.status(404).json({
            msg:'user does not exist'
        })
    }
     if (user && (await user.comparePassword(password))) {
                const token = generateCookies(user._id);
                  res.cookie('token', token, {
      httpOnly: true,       // prevents client-side JS access
      secure: false,        // set to true in production with HTTPS
      sameSite: 'strict',   // CSRF protection
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

router.use(mentorProtectRoute);

router.post('/create-course', upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'syllabusPdf', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      title,
      description,
      duration,
      category,
      skills,
      price
    } = req.body;

    const thumbnailFile = req.files?.thumbnail?.[0];
    const syllabusPdfFile = req.files?.syllabusPdf?.[0];

    if (!thumbnailFile || !syllabusPdfFile) {
      return res.status(400).json({ msg: "Both thumbnail and syllabus PDF are required" });
    }

    // ✅ Upload thumbnail image from buffer
    const thumbnailUrl = await uploadOnCloudinaryBuffer(thumbnailFile.buffer);

    // ✅ Upload syllabus PDF from disk path (multer stores it temporarily)
    const syllabusUrl = await uploadFileOnCloudinary(syllabusPdfFile.buffer, syllabusPdfFile.originalname);


    console.log(thumbnailUrl)
    console.log('it is syllavbus',syllabusUrl)

    // ✅ Now you can save course to DB here (mocked example)
    // const courseData = {
    //   title,
    //   description,
    //   duration,
    //   category,
    //   skills,
    //   price,
    //   thumbnailUrl,
    //   syllabusUrl,
    //   createdBy: req.user._id // mentor from token
    // };

  const newCourse =   await Course.create({
      title,
      description,
      duration,
      category,
     skillsCovered: skills,
      price,
    thumbnail:  thumbnailUrl,
    syllabusPdfLink:  syllabusUrl,
      instructor: req.user._id})

    // console.log("Course created:", courseData);
    console.log('course created ' ,newCourse)

   return res.status(201).json({
      message: "Course created successfully",
      course: newCourse
    });

  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});


router.get('/myCourses',async(req,res)=>{
  const id = req.user._id;
  try {
    const allCourses = await Course.find({instructor:id});
    if(!allCourses){
      return res.status(404).json({
        msg:'No courses found'
      })
    }
    return res.status(200).json({
      courses:allCourses
    })
  } catch (error) {
     console.error("Error getting course:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

router.post('/create-session/:id',upload.single("pdf"),async(req,res)=>{
  const id = req.params.id;
  const {lesson,title,video,live} = req.body;
  const notesPdfLink = req.file;
  
  try {
     const course = await Course.findById(id);
      if(!course){
        return res.status(404).json({
          msg:'course not found'
        })
      }

      const notesPdfLinkCloudinary = await uploadFileOnCloudinary(notesPdfLink.buffer, notesPdfLink.originalname);

      const newLesson = await Lesson.create({
        lessonNumber:lesson,
        title,
        notesPdfLink:notesPdfLinkCloudinary,
        videoLink:video,
        liveClassLink:live
      })

      console.log('lesson created' ,newLesson);

     course.lessons.push(newLesson);
    await course.save();

      console.log('Lesson added to course:', newLesson);

    return res.status(200).json({
      msg: 'Session added successfully',
      lesson: newLesson
    });

  } catch (error) {
    
  }

})

router.get('/course/detail/:id',async(req,res)=>{
    const {id} = req.params;
    console.log(id)
    try {
      const course = await Course.findById(id);
      if(!course){
        return res.status(404).json({
          msg:'course not found'
        })
      }
      return res.status(200).json({
        course:course
      })
    } catch (error) {
       console.error("Error getting course:", error);
    res.status(500).json({ msg: "Internal Server Error" });
    }
})



export default router;
