import { compare } from "bcrypt";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import userModel from "../models/userModel.js";
import nodemailer from 'nodemailer';
const JWT_Secret = '$JF0E92$';
import JWT from 'jsonwebtoken';
import dotenv from 'dotenv';

//import orderModel from "../models/orderModel.js";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "sameer@neuetrinostech.com", // your email address
    pass: "dtjwyxropsccpokv", // your email password
  },
});

export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer } = req.body;

    if (!name) {
      return res.send({ message: 'Name is required' });
    }
    if (!email) {
      return res.send({ message: 'Email is required' });
    }
    if (!password) {
      return res.send({ message: 'Password is required' });
    }
    if (!phone) {
      return res.send({ message: 'Phone is required' });
    }
    if (!address) {
      return res.send({ message: 'Address is required' });
    }
    if (!answer) {
      return res.send({ message: 'Answer is required' });
    }

    // Check if the user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: 'Already registered, please login',
      });
    }

    // Generate the verification token
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user with the hashed password and verification token
    const user = await new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      answer,
      otp,
    }).save();

    // Send the OTP to the user's email
    

    res.status(201).send({
      success: true,
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: 'Error in registration',
      error,
    });
  }
};

export const sendOTPController = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: 'Email not found',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: 'OTP for registration',
      text: `Your OTP: ${user.otp}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: 'Error sending OTP',
      error,
    });
  }
};

export const verifyOTPController = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: 'Email not found',
      });
    }

    // Check if the OTP is a string or a number
    if (user.otp && user.otp.toString() !== otp) {
      return res.status(200).send({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Clear the OTP after successful verification
    user.otp = undefined;
    user.verified = true; // Set the verified flag to true
    await user.save();

    res.status(200).send({
      success: true,
      message: 'OTP verification successful',
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: 'Error verifying OTP',
      error,
    });
  }
};


export const loginController = async(req,res) => {
    try{
        const {email,password} = req.body
        if(!email || !password) {
            return res.status(404).send({
                success:false,
                message:'Invalid email or password'
            })
        }
        //check user
        const user = await userModel.findOne({email})
        if(!user){
            return res.status(404).send({
                success:false,
                message:'Email is not registerd'
            })
        }
        const match = await comparePassword(password,user.password)
        if(!match){
            return res.status(200).send({
                success:false,
                message:'Invlid Password'
            })
        }
        const JWT_Secret = '$JF0E92$';
        //token
        const token = await JWT.sign({_id:user._id},JWT_Secret,{expiresIn:'7d'});
        res.status(200).send({
            success:true,
            message:'login successfully',
            user:{
                name:user.name,
                email:user.email,
                phone:user.phone,
                address:user.address,
                role:user.role
            },
            token
        })
    } catch(error) {

        console.log(error);
        res.status(500).send({
            success:false,
            message:'Error in login',
            error
        })
    }
};
//test controller
export const testController = (req,res) => {
   console.log('protected')
   res.send("Protected");
}
//forgotPasswordController
export const forgotPasswordController = async(req,res) => {
    try{
        const {email,answer,newPassword} = req.body
        if(!email){
            res.status(400).send({message:'email is required'})
        }
        if(!answer){
            res.status(400).send({message:'answer is required'})
        }
        if(!newPassword){
            res.status(400).send({message:'NewPassword is required'})
        }
        //check
        const user = await userModel.findOne({email,answer})
        //validation
        if(!user) {
            return res.status(404).send({
                success:false,
                message:"wrong answer or email"
            })
        }
        const hashed = await hashPassword(newPassword);
        await userModel.findByIdAndUpdate(user._id,{password:hashed});
        res.status(200).send({
            success:true,
            message:'Password reset successfully',
        })
    } catch(error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'something went wrong'
        })
    }
}
//update profile
export const updateProfileController = async (req, res) => {
    try {
      const { name, email, password, address, phone } = req.body;
      const user = await userModel.findById(req.user._id);
      //password
      if (password && password.length < 6) {
        return res.json({ error: "Passsword is required and 6 character long" });
      }
      const hashedPassword = password ? await hashPassword(password) : undefined;
      const updatedUser = await userModel.findByIdAndUpdate(
        req.user._id,
        {
          name: name || user.name,
          password: hashedPassword || user.password,
          phone: phone || user.phone,
          address: address || user.address,
        },
        { new: true }
      );
      res.status(200).send({
        success: true,
        message: "Profile Updated SUccessfully",
        updatedUser,
      });
    } catch (error) {
      console.log(error);
      res.status(400).send({
        success: false,
        message: "Error WHile Update profile",
        error,
      });
    }
  };

  //orders
  export const getOrdersController = async(req,res) => {
try{
const orders = await orderModel.find({buyer:req.user._id})
.populate("products","-photo")
.populate("buyer","name");
res.json(orders);


} catch(error) {
    console.log(error);
    res.status(500).send({
        success:false,
        message:"Error while getting orders",
        error
    })
}
  }

  //orders
export const getAllOrdersController = async (req, res) => {
    try {
      const orders = await orderModel
        .find({})
        .populate("products", "-photo")
        .populate("buyer", "name")
        .sort({ createdAt: "-1" });
      res.json(orders);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error WHile Geting Orders",
        error,
      });
    }
  };
  
  //order status
  export const orderStatusController = async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const orders = await orderModel.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      );
      res.json(orders);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error While Updateing Order",
        error,
      });
    }
  };