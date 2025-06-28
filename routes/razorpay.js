import express from 'express';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer'
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Candidate from '../model/candidate.js';
import upload from '../middleware/multer.js';
import uploadFileOnCloudinary from '../utils/uploadFileOnCloudinary.js';
import uploadOnCloudinaryBuffer from '../utils/uploadImageOnCloudinary.js';
import jwt from 'jsonwebtoken';
const router = express.Router();

dotenv.config();


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});



// router.post("/create-order", async (req, res) => {
//   try {
//     const { user, amount } = req.body;

//     const options = {
//       amount: amount * 100, // INR in paisa
//       currency: "INR",
//       receipt: `receipt_${Date.now()}`,
//     };

//     const order = await razorpay.orders.create(options);

//     const newCandidate = await Candidate.create({
//       ...user,
//       razorpayOrderId: order.id,
//       paymentStatus: "pending",
//     });

//     res.status(200).json({ orderId: order.id, candidateId: newCandidate._id });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Order creation failed" });
//   }
// });


router.post(
  "/create-order",
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "profilePic", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { amount } = req.body;
      console.log(amount);
      const user = JSON.parse(req.body.user); // Since it's multipart/form-data

      // Upload files to Cloudinary
      const resumeBuffer = req.files?.resume?.[0]?.buffer;
      const profilePicBuffer = req.files?.profilePic?.[0]?.buffer;

      let resumeUrl = "";
      let profilePicUrl = "";

      if (resumeBuffer) {
        resumeUrl = await uploadFileOnCloudinary(resumeBuffer, "resume.pdf");
      }

      if (profilePicBuffer) {
        profilePicUrl = await uploadOnCloudinaryBuffer(profilePicBuffer);
      }

      const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);

      const newCandidate = await Candidate.create({
        ...user,
        resumeUrl,
        profilePicUrl,
        razorpayOrderId: order.id,
        paymentStatus: "success",
      });

      const token = jwt.sign({ id: newCandidate._id }, process.env.JWT_SECRET, {
            expiresIn: '7d', // 7 days expiry
          });
      
          // 4. Set cookie with token
          res.cookie('token', token, {
            httpOnly: true,       // prevents client-side JS access
            secure: true,        // set to true in production with HTTPS
            sameSite: 'none',     // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });

      res.status(200).json({ orderId: order.id,  candidate: {
        id: newCandidate._id,
        fullName: newCandidate.fullName,
        email: newCandidate.email,
      },token });
    } catch (error) {
      console.error("Create Order Error:", error);
      res.status(500).json({ message: "Order creation failed" });
    }
  }
);



router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const bodyString = req.body.toString();

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(bodyString)
    .digest('hex');

  if (signature === expectedSignature) {
    const payload = JSON.parse(bodyString);

    if (payload.event === 'payment.captured') {
      const payment = payload.payload.payment.entity;

      const candidate = await Candidate.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        {
          paymentStatus: 'success',
        },
        { new: true }
      );

      if (candidate) {
        // 🎯 Send confirmation email
       const transporter = nodemailer.createTransport({
  host: "smtp.zoho.in", // or smtp.zoho.com if you're not on India domain
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});
        await transporter.sendMail({
          from: `SM Services <${process.env.MAIL_USER}>`,
          to: candidate.email,
          subject: "🎉 Registration & Payment Confirmed - SM Services",
          html: `<h3>Hello ${candidate.fullName},</h3><p>Your registration and payment have been successfully processed.</p><p>We look forward to helping you in your career journey.</p>`,
        });
      }
    }

    return res.status(200).json({ status: 'ok' });
  } else {
    return res.status(400).json({ status: 'invalid signature' });
  }
});



export default router