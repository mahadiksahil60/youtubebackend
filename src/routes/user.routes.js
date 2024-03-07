import { Router } from "express";
import { changeCurrentPassword, getUserChannelProfile, getcurrentuser, getwatchhistory, loginuser, logoutUser, refreshAccessToken, registerUser, updateaccountdeatail, updatecoverimage, updateuseravatar } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyjwt } from "../middlewares/auth.middleware.js";

const router = Router()


router.route("/register").post(
   upload.fields([{
    name: "avatar",
    maxCount: 1

   },
{
    name: "coverimage",
    maxCount: 1
}]), 
    registerUser)


router.route("/login").post(loginuser)


//secured routes
router.route("/logout").post(verifyjwt, logoutUser)

router.route("/refreshtoken").post(refreshAccessToken)
router.route("/changepassword").post(verifyjwt, changeCurrentPassword)
router.route("/getcurrentuser").get(verifyjwt, getcurrentuser)
router.route("/updateaccountdetails").patch(verifyjwt,updateaccountdeatail)
router.route("/avatar").patch(verifyjwt, upload.single("avatar"), updateuseravatar)
router.route("/cover-image").patch(verifyjwt, upload.single("coverImage"), updatecoverimage)
router.route("/c/:username").get(verifyjwt, getUserChannelProfile)
router.route("/history").get(verifyjwt, getwatchhistory)
export default  router