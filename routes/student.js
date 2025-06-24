


import express from 'express';
import Student from '../model/student.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import generateCookies from '../lib/generateCookies.js';

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
      secure: false,        // set to true in production with HTTPS
      sameSite: 'strict',   // CSRF protection
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


})

export default router;
