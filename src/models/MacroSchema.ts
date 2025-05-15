import mongoose from "mongoose";

const Schema = mongoose.Schema

const macro = new Schema({
  guild_id: { type: String, required: true },
  user_id: { type: String, required: true },

  name: { type: String, required: true},
  content: { type: String, required: true },
  uses: { type: Number, default: 0 }
})

// Create indexes for efficient lookups
macro.index({ guild_id: 1, name: 1 });

export default mongoose.model("Macros", macro)