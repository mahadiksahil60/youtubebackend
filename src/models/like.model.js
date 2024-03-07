import mongoose, { Schema, mongo } from "mongoose";
const likeschema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "videos"
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "comments"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "tweets"
    },
    likedby: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
}, {timestamps: true})


export const likes = mongoose.model("likes", likeschema)