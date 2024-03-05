import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
// configuring the data that express should be able to receive
app.use(express.json({
    limit: "64kb"
}))

app.use(express.urlencoded())

app.use(express.static("public"))

//  for storing secure cookies on users browser
app.use(cookieParser())




//routes import
import userRouter from "./routes/user.routes.js"



//routes declaration
app.use("/api/v1/users", userRouter)



export { app }