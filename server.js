import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import studentRoutes from './routes/student.js';
import mentorRoutes from './routes/mentor.js'

const corsOption = {
    origin:[
        'http://localhost:5173',
        'http://localhost:4173',
         process.env.CLIENT_URL
        ],
        methods:["GET","POST","PUT","DELETE","PATCH"],
    credentials:true,
};


const app = express();

const port = 3000;

dotenv.config();

app.use(cors(corsOption))
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







app.listen(port,()=>{
    console.log(`server is listtening at port ${port}`)
})
