

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const employerSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    fullName: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: { type: String, required: true },
    phone: { type: String, required: true,unique:true },
    companyWebsite: { type: String, required: true },
    companyLogoUrl: { type: String, required: true },
    companyDocUrl: { type: String, required: true },
    createdAt: {
        type: Date,
        default: Date.now,

    }
});

// Hash password before saving
employerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const Employer = mongoose.model("Employer", employerSchema);

export default Employer;

