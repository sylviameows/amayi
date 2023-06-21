import mongoose from "mongoose";

const Schema = mongoose.Schema

const member = new Schema({
  id: { type: Number, unique: true, required: true },
  badges: [{ type: String }],
  premium: { type: Boolean, default: false},
  
  pronouns: [{ type: String }],
  bio: String,

  settings: {
    
  }
})

export default mongoose.model("Member", member)