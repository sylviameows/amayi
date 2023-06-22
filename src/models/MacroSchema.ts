import mongoose from "mongoose";

const Schema = mongoose.Schema

const macro = new Schema({
  guild_id: { type: String, required: true },
  user_id: { type: String, required: true },

  name: { type: String, required: true},
  content: { type: String, required: true },
  uses: { type: Number, default: 0 }
})

export default mongoose.model("Macros", macro)