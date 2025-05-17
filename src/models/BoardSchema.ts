import mongoose from "mongoose";
import { Board } from "../modules/boards/boards";

const Schema = mongoose.Schema

export interface BoardDoc extends mongoose.Document {
  emoji: string;
  message_id: string
}

export const Boards = new Schema<BoardDoc>({
  emoji: {type: String, required: true},
  message_id: {type: String, required: true}
})

export interface MessagesDoc extends mongoose.Document {
  message_id: string

  boards: mongoose.Types.DocumentArray<BoardDoc>
}

export const Messages = new Schema<MessagesDoc>({
  message_id: { type: String, required: true },
  
  boards: [Boards]
})

// Create indexes for efficient lookups
Messages.index({ message_id: 1 });

export default mongoose.model("Messages", Messages)