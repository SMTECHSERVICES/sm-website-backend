import express from 'express';
import Employer from '../model/employer.js';
import jwt from 'jsonwebtoken';
import upload from '../middleware/multer.js';
import uploadFileOnCloudinary from '../utils/uploadFileOnCloudinary.js';
import uploadOnCloudinaryBuffer from '../utils/uploadImageOnCloudinary.js';


const router = express.Router();

router.post('/register', upload.fields([
    { name: "companyLogo", maxCount: 1 },
    { name: "companyDoc", maxCount: 1 },]), async (req, res) => {

        try {

            const employer = JSON.parse(req.body.employer);

            const companyLogoBuffer = req.files?.companyLogo?.[0]?.buffer;
            const companyDocBuffer = req.files?.companyDoc?.[0]?.buffer;



            let companyLogoUrl = "";
            let companyDocUrl = "";

            if (companyDocBuffer) {
                companyDocUrl = await uploadFileOnCloudinary(companyDocBuffer, "companyDoc.pdf");
            }

            if (companyLogoBuffer) {
                companyLogoUrl = await uploadOnCloudinaryBuffer(companyLogoBuffer);
            }

            const newEmployer = await Employer.create({
                ...employer,
                companyLogoUrl,
                companyDocUrl
            })

            const token = jwt.sign({ id: newEmployer._id }, process.env.JWT_SECRET, {
                expiresIn: '7d', // 7 days expiry
            });

            // 4. Set cookie with token
            res.cookie('token', token, {
                httpOnly: true,       // prevents client-side JS access
                secure: true,        // set to true in production with HTTPS
                sameSite: 'none',     // CSRF protection
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            return res.status(200).json({
                message: `Registraion successfull! Welcome abroad ${newEmployer.companyName} `,
                employer: {
                    id: newEmployer._id,
                    fullName: newEmployer.fullName,
                    email: newEmployer.email,
                }, token
            })




        } catch (error) {
            console.log(error);
            return res.status(500).json('Inernal server error')
        }
    })



export default router;