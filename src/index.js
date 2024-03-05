import dotenv from "dotenv";
import mongoose from "mongoose";
import connectdb from "./db/index.js";

dotenv.config({
    path: "./env"
})


connectdb();
