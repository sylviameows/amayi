import { Message } from "discord.js";
import BoardSchema, { BoardDoc, MessagesDoc } from "../../models/BoardSchema";

type ReturnData = BoardDoc | MessagesDoc | null

export class Board {
  emoji: string;
  private count: number;

  constructor(emoji: string, count: number) {
    this.emoji = emoji;
    this.count = count;
  }

  solo(): boolean {
    return this.count == 1;
  }

  async check(message: Message): Promise<[action: Action, board: ReturnData, count: Number]> {
    const reactions = message.reactions.resolve(this.emoji);
    
    if (this.emoji == '📌' && reactions?.me) return [Action.NONE, null, 0]; // we want to ignore past pins using the legacy system

    const stored_data = await BoardSchema.findOne({
      message_id: message.id
    })
  

    const stored_board = stored_data?.boards.find(board => board.emoji == this.emoji)

    if (!reactions || reactions.count < this.count) {
      const count = reactions?.count ?? 0;
      if (stored_board) return [Action.REMOVE, stored_board, count];
      return [Action.NONE, null, count];
    }

    if (stored_board && reactions.count >= this.count) return [Action.UPDATE, stored_board, reactions.count]
    else if (stored_board) return [Action.REMOVE, stored_board, reactions.count]

    return [Action.CREATE, stored_data, reactions.count]
  }
}

export const boards = new Set([
  new Board("📌", 1),
  new Board("💀", 3),
  new Board("⭐", 3)
])

export enum Action {
  NONE,
  REMOVE,
  UPDATE,
  CREATE
}