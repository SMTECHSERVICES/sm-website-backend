import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

 const generateCookies = (userId)=>{
        const token = jwt.sign({ id: userId }, JWT_SECRET, {
      expiresIn: '7d', // 7 days expiry
    });
    return token;
    }


    export default generateCookies;

    