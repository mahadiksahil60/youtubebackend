import jwt from "jsonwebtoken";
import { apierror } from "../utils/apierror.js";
import { asynchandler } from "../utils/asynchandler.js";
import { users } from "../models/user.model.js";

export const verifyjwt = asynchandler(async(req,_,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            throw new apierror(401, "unauthorized request ")
        }
    
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await users.findById(decodedtoken?._id).select("-password -refreshToken")
        if(!user){
            //discussion about frontend
            throw new apierror(401, "invalid access token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new apierror(401,error?.message || "invalid access token")
    }
    

}) 