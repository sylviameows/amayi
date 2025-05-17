import { MessageReaction, User } from "discord.js";
import Amayi from "../../../structures/Amayi";
import { BotEvent } from "../../../structures/Event";
import { handleBoards } from "../../../modules/boards/handle";

export default class RemoveReactionEvent extends BotEvent {
    constructor(client: Amayi) {
      super(client, {
        name: "messageReactionRemove"
      })
    }

    async run(reaction: MessageReaction, user: User) {
      var message = reaction.message;

      if (message.partial) return void message.fetch().then(message => handleBoards(message, user)).catch(console.log)

      handleBoards(message, user)
    }

}