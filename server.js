import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import studentRoutes from './routes/student.js';
import mentorRoutes from './routes/mentor.js'
import razorpayRoutes from './routes/razorpay.js'
import employerRoutes from './routes/employer.js'

// const corsOption = {
//     origin:[
//         'http://localhost:5173',
//         'http://localhost:4173',
//          process.env.CLIENT_URL
//         ],
//         methods:["GET","POST","PUT","DELETE","PATCH"],
//     credentials:true,
// };


const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_URL?.trim()  // Handle potential whitespace
].filter(Boolean); // Remove undefined values

//console.log("Allowed Origins:", allowedOrigins); // Debug log

const app = express();

const port = 3000;

dotenv.config();


const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS Blocked: ${origin} | Allowed: ${allowedOrigins}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
};

app.use(cors(corsOptions));


//app.use(cors(corsOption))

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser())


main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('database connected')

  // 
}


app.use('/api/student',studentRoutes);
app.use('/api/mentor',mentorRoutes);
app.use('/api/razorpay',razorpayRoutes);
app.use('/api/employer',employerRoutes);







app.listen(port,()=>{
    console.log(`server is listtening at port ${port}`)
})
