// user schema for project youtube.com 
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    watchHistory : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "video"
}],
    username : {
        type :String,
        required : true,
        unique: true, 
        lowercase: true,
        trim: true,
        index: true
    },
    email : {
        type :String,
        required : true,
        unique: true, 
        lowercase: true,
        trim: true,
        
    },
    fullname : {
        type :String,
        required : true,
        trim: true,
        index: true
        
    },
    avatar : {
        type :String,  // cloudinary url service -- provides url for uploaded images 
        required : true,
        
    },
    coverImage : {
        type :String,
        
    },
    password : {
        type :String,
        required:[true,"Password is Mandatory for auth"],



    },
    refreshToken : {
        type : String
    }
},{timestamps: true})

// middleware hook to hash the password just before saving
userSchema.pre("save",async function (next){
    if(!this.isModified("password")){
        return next();
    }
    const hashedpassword = await  bcrypt.hash(this.password, 10)
    this.password = hashedpassword
    next()
})

// method to check if the password is correct or not
userSchema.methods.isPasswordCorrect = async function (password){
   return await bcrypt.compare(password, this.password)
}


// jwt part ---->>> 
// jsonwebtoken is like a key for accessing data

//method for generating access tokens
userSchema.methods.generateAccessToken = function(){
      return  jwt.sign({
            _id:this._id,
            email:this.email,
            username : this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        })
}
//method for generating refresh tokens
userSchema.methods.generateRefreshToken = function(){
   return jwt.sign({
        _id:this._id,
       
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}

export const users = mongoose.model("users", userSchema)