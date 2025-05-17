import { MessageReaction, User } from "discord.js";
import Amayi from "../../../structures/Amayi";
import { BotEvent } from "../../../structures/Event";
import { handleBoards } from "../../../modules/boards/handle";

export default class AddReactionEvent extends BotEvent {
    constructor(client: Amayi) {
      super(client, {
        name: "messageReactionAdd"
      })
    }

    async run(reaction: MessageReaction, user: User): Promise<void> { 
      var message = reaction.message;

      if (message.partial) return void message.fetch().then(message => handleBoards(message, user)).catch(console.log)

      handleBoards(message, user)
    }



}