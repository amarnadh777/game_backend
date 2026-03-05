const User = require("../models/UserModel")
const jwt = require("jsonwebtoken")
exports.register = async (req, res) => {

    try {
        const {firstName, lastName, email, password, country, city, phoneNumber} = req.body;
        if(!firstName || !email){
            return res.status(400).json({message: "Please fill all required fields"})
        }
        const isEmailExist = await User.findOne({email})
        if(isEmailExist){
            return res.status(400).json({message: "Email already exists"})
        }
        const user = new User({
            firstName,
            lastName,
            email,
            password,
            country,
            city,
            phoneNumber
        })
        await user.save()

        res.status(201).json({message: "User registered successfully", user})

    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

exports.login = async(req,res) =>{
    try {
        const {email} = req.body;
        if(!email){
            return res.status(400).json({message: "Please fill all required fields"})   
        }

        const user = await User.findOne({email})
        if(!user){
            return res.status(400).json({message: "Invalid email or password"})
        }
        const token = jwt.sign({userId:user._id}, process.env.JWT_SECRET)


        

     res.status(200).json({message: "User logged in successfully", user,
        token:token
     })
    } catch (error) {
        res.status(500).json({message: error.message})  
    }
}