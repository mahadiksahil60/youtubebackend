import dotenv from "dotenv";
import mongoose from "mongoose";
import connectdb from "./db/index.js";
import {app} from "./app.js"

dotenv.config({
    path: "./env"
})


connectdb()
.then(()=> {
    console.log("Database connection established now proceeding furthur")
    const port = process.env.PORT || 8000
    app.listen(port, ()=>{
        console.log("server is running on port")
    })
})
.catch((err)=> {
    console.log("MONGO connection failed", err)
})
.finally(()=>{
    console.log("to check for debugging")
})