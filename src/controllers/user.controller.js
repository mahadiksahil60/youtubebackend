import { asynchandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { users } from "../models/user.model.js";

const generateaccessandrefreshtokens = async (userId) => {
    try {
        const user = await users.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new apierror(500, "something went wrong while generating refresh and accesstokens")
    }
}


const registerUser = asynchandler(async (req, res,) => {
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

    const { fullname, email, username, password } = req.body
       console.log("fullname : ",  fullname)
       console.log("username: ", username)
       console.log("reqbody : ", req.body)

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new apierror(400, "All field are required")
    }


    const existinguser = await users.findOne({
        $or: [{ username }, { email }]
    })


    if (existinguser) {
        throw new apierror(409, "user with same name already exists")
    }
    // this is approach is used because avatar is mandatory
    const avatarlocalpath = req.files?.avatar[0]?.path;
    const coverimagelocalpath = req.files?.coverimage[0]?.path;
    // the coverimage can be missing thats why this approach is used so that appication can proceed without coverimage
    // let coverImageLocalPath;
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }





    if (!avatarlocalpath) {
        throw new apierror(400, "avatar is mandatory");
    }

    const avatar = await uploadOnCloudinary(avatarlocalpath)
    const coverimage = await uploadOnCloudinary(coverimagelocalpath)

    if (!avatar) {
        throw new apierror(400, "avatar is mandatory");
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

    if (!createduser) {
        throw new apierror(500, "user not created")
    }

    return res.status(200).json(
        new ApiResponse(200, createduser, "User registered successfully")
    )

})

const loginuser = asynchandler(async (req, res) => {
    //to do list
    
    // taking login credentials from the user.
    // validation.
    // check in the database for same credentials.
    // generated accesstoken and refreshtoken based on which login session is created.
    // send cookies .
    
    
    
    
    
    const { username, email, password } = req.body;
    console.log("reqbody: ", req.body)
    if (!username && !email) {
        throw new apierror(400, "Username or email is mandatory for login is missing.");
    }

    const user = await users.findOne({
        $or: [{ username, email }]
    })

    // console.log(user)

    if (!user) {
        throw new apierror(404, "user does not exist");
    }

    const isPassworValid = await user.isPasswordCorrect(password)
    console.log("password", password)
    console.log("checkpassword : ",isPassworValid)

    if (!isPassworValid) {
        throw new apierror(401, "Invalid user password");
    }

    const { accessToken, refreshToken } = await generateaccessandrefreshtokens(user._id)

    const loggedinuser = await users.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }


    res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
        new ApiResponse(200, {
            user: loggedinuser, accessToken, refreshToken
        }, "user logged in successfully")
    )

})


const logoutUser = asynchandler(async (req, res) => {
    //to do 
    await users.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        }, {
        new: true
    }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(200).clearCooikie("accessToken", options).clearCooikie("refreshToken", options).json(new ApiResponse(200, {}, "logged out successfully"))

})

export { registerUser, loginuser, logoutUser }