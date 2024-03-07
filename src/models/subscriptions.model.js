import mongoose, { Schema } from "mongoose";

const subscriptionschema = new Schema({

    subscriber: {
        type: Schema.Types.ObjectId,  /// one who is subscribing
        ref: "users"

    },

    channel : {
        type: Schema.Types.ObjectId, // one to whom subscriber is subscribing 
        ref: "users"
    },



}, {timestamps: true})




export const subscription = mongoose.model("subscription", subscriptionschema)