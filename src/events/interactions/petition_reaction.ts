import { MessageReaction, User } from "discord.js";
import Amayi from "../../structures/Amayi";
import { BotEvent } from "../../structures/Event";

export default class PetitionReactionEvent extends BotEvent {
  constructor(client: Amayi) {
    super(client, {
      name: "messageReactionAdd"
    })
  }

  async run(reaction: MessageReaction, user: User): Promise<void> {
    const message = reaction.message

    if (reaction.me) return; // ignore any reactions created by amayi (so already pinned!)
    if (message.partial) await message.fetch().catch((e) => console.log(e)) // we need full data for this
    if (!message.guild) return;
    
    const reactions = message.reactions.cache

    // const reactions = message.reactions.cache.map(reaction => {
    //   return {
    //     name: reaction.emoji.name,
    //     count: reaction.count,
    //     me: reaction.me
    //   }
    // })

    const upvote = reactions.find(val => val.emoji.name == "upvote")
    const downvote = reactions.find(val => val.emoji.name == "downvote")

    if (!upvote || !downvote) return; // we need BOTH

    if (upvote.count <= 2 && downvote.count <= 2) return; 
    if (upvote.me) {
      upvote.remove()
    }
    if (downvote.me) {
      downvote.remove()
    }
  }
}