import jwt from 'jsonwebtoken'
import Mentor from "../model/mentor.js"

const JWT_SECRET = process.env.JWT_SECRET;

export const mentorProtectRoute  = async(req,res,next)=>{
   // console.log("hi")
    const accessToken = req.cookies.token;
   // console.log(accessToken)
   

    if(!accessToken){
        return res.status(401).json({
            message:'please login to access '
        })
    }
    try {
        const decodedData = jwt.verify(accessToken,JWT_SECRET);
       const user  = await Mentor.findById(decodedData.id).select("-password");
        if(!user){
            return res.status(404).json({
                message:'User not found'
            })
        }
        req.user = user
        next();
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message:'Interna server error'
        })
    }

  

    
};

export const adminRoute = async(req,res,next)=>{
    if(req.user && req.user.role === "admin"){
        next();
    }else{
        return res.status(401).json({
            message:'only admin can access this route'
        })
    }
}