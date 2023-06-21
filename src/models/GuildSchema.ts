import mongoose from "mongoose";

const Schema = mongoose.Schema

const guild = new Schema({
  id: { type: String, unique: true, required: true },
  prefix: { type: String, default: "ayi "},
  premium: { type: Boolean, default: false},
  // members: []
  config: {
    staff_roles: [{ type: String }],
    petitions: {
      enabled: { type: Boolean, default: false },
      channel_id: String,
      role: String,
    },
    quotes: {
      enabled: { type: Boolean, default: false },
      channel_id: String,
      role: String,
    },
    reporting: {
      enabled: { type: Boolean, default: false },
      channel_id: String,
      role: { type: String, },
    }
  }
},{
  statics: {
    async findOrCreate(id: string) {
      const model = mongoose.model("Guild", this.schema);
      const found = await model.findOne({id})
      if (found) return found;
      return await model.create({id: id})
    }
  }
})

export default mongoose.model("Guild", guild)