import { asynchandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { users } from "../models/user.model.js";

const registerUser = asynchandler(async(req, res,)=>{
   /*
   get user details from frontend
   validation - not empty
   check if user already exists: username email
   check for images, check for avatar
   upload them to cloudinary, avatar
   create user object - create entry in db
   remove password and refresh token in field from response
   check for user creation
   return res
   */

   const{fullname, email, username, password} = req.body
//    console.log(req.body)

   if(
    [fullname, email, username, password].some((field)=> field?.trim() === "")
   ){
    throw new apierror(400, "All field are required")
   }


   const existinguser = await users.findOne({
    $or: [{username}, {email}]
   })


   if(existinguser){
    throw new apierror(409, "user with same name already exists")
   }

  const avatarlocalpath =  req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path
  }
  



  if(!avatarlocalpath){
    throw new apierror(400,"avatar is mandatory");
  }

  const avatar = await uploadOnCloudinary(avatarlocalpath)
  const coverimage = await uploadOnCloudinary(coverimagelocalpath)

  if(!avatar){
    throw new apierror(400,"avatar is mandatory");
  }

  const user = await users.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverimage?.url || " ",
    email,
    password,
    username: username.toLowerCase()


  })

  const createduser = await users.findById(user._id).select(
    "-password -refreshToken"
  )

  console.log(createduser)

  if(!createduser) { 
    throw new apierror(500, "user not created")
  }

  return res.status(200).json(
    new ApiResponse(200, createduser, "User registered successfully")
  )

})

export {registerUser}