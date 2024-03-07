import { Router } from "express";
import { loginuser, logoutUser, registerUser } from "../controllers/user.controller.js";
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

export default  router