import jwt from "jsonwebtoken";
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
    //    console.log("fullname : ",  fullname)
    //    console.log("username: ", username)
    //    console.log("reqbody : ", req.body)

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

    // console.log(createduser)

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
    // console.log("password", password)
    // console.log("checkpassword : ",isPassworValid)

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

    res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged out successfully"))

})

const refreshAccessToken = asynchandler(async (req, res) => {
    const incomingrefreshtoken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingrefreshtoken) {
        throw new apierror(401, "unauthorized request")
    }


    try {
        const decodedtoken = jwt.verify(incomingrefreshtoken, process.env.REFRESH_TOKEN_SECRET)
        const user = await users.findById(decodedtoken._id)
        if (!user) {
            throw new apierror(401, "invalid refresh token")
        }

        if (incomingrefreshtoken !== user?.refreshToken) {
            throw new apierror(401, "invalid refresh token doesnt match might be used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newrefreshToken } = await generateaccessandrefreshtokens(user._id)
        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newrefreshToken, options).json(new ApiResponse(200, {
            accessToken, refreshToken: newrefreshToken
        }, "Access token refreshed"))
    } catch (error) {
        throw new apierror(401, error?.message || "invalid refresh token")
    }


})

const changeCurrentPassword = asynchandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await users.findById(req.user?._id)

    const isOldPasswordcorrect = await user.isPasswordCorrect(oldPassword)
    if (!isOldPasswordcorrect) {
        throw new apierror(400, "invalid old password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    res.status(200).json(new ApiResponse(200, {}, "password has been changed"))
})

const getcurrentuser = asynchandler(async (req, res) => {
    return res.status(200).json(200, req.user, "current user has been fetched")
})

const updateaccountdeatail = asynchandler(async (req, res) => {
    const { fullname, email } = req.body
    if (!fullname || !email) {
        throw new apierror(400, "all fields are mandatory")
    }

    const user = await users.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullname: fullname,
                email
            }
        }, {
        new: true
    }



    ).select("-password")


    return res.status(200).json(new ApiResponse(200, user, "account details updated"))





})

const updateuseravatar = asynchandler(async (req, res) => {
    const avatarlocalpath = req.file?.path
    if (!avatarlocalpath) {
        throw new apierror(400, "avatar image is missing")

    }

    const avatar = await uploadOnCloudinary(avatarlocalpath)
    if (!avatar.url) {
        throw new apierror(400, "error while uploading to cloudinary")
    }

    const user = await users.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, { new: true }).select("-password")


    return res.status(200).json(new ApiResponse(200, user, "avatar has been updated"))
})

const updatecoverimage = asynchandler(async (req, res) => {
    const coverimagelocalpath = req.file?.path

    if (!coverimagelocalpath) {
        throw new apierror(400, "coverimage not selected")
    }
    const coverImage = await uploadOnCloudinary(coverimagelocalpath)
    if (!coverImage.url) {
        throw new apierror(400, "error while uploading to cloudinary")
    }
    const user = await users.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImage.url
        }
    }, { new: true }).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "coverimage has been updated"))


})

const getUserChannelProfile = asynchandler(async (req, res) => {
    const { username } = req.params
    if (!username?.trim()) {
        throw new apierror(400, "username is missing")
    }
    const channel = await users.aggregate([
        {
            $match: {
                username: username?.toLowerCase()

            },

        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"

            }
        }, {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subsribedto"
            }
        }, {
            $addFields: {
                subsriberscount: {
                    $size: "$subscribers"

                },
                channelsubscribedto: {
                    $size: "$subscribedto"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }


        }, {
            $project: {
                fullname: 1,
                username: 1,
                subsriberscount: 1,
                channelsubscribedto: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1


            }
        }
    ])

    if (!channel?.length) {
        throw new apierror(404, "channel does not exists")
    }

    return res.status(200).json(new ApiResponse(200, channel[0], "user channel fetched successfully"))

})

const getwatchhistory = asynchandler(async (req, res) => {
    const user = await users.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        }, {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project :{
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1

                                    }
                                }
                            ]
                        }
                    },{
                        $addFields:{
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, user[0].watchHistory,"watch history has been fetched ..."))
})

export { registerUser, loginuser, logoutUser, refreshAccessToken, changeCurrentPassword, getcurrentuser, updateaccountdeatail, updateuseravatar, updatecoverimage, getUserChannelProfile, getwatchhistory }