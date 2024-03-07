import mongoose from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const commentSchema = new Schema({
        content: {
            type: String,
            required: true
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "videos"
        },
        owners: {
            type: Schema.Types.ObjectId,
            ref: "users"
        }
},{timestamps: true})

commentSchema.plugin(mongooseAggregatePaginate)

export const comments = mongoose.model("comments", commentSchema)