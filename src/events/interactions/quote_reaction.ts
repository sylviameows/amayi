import { EmbedBuilder, Interaction, Message, MessageReaction, PartialMessage, User } from "discord.js";
import Amayi from "../../structures/Amayi";
import { BotEvent } from "../../structures/Event";
import GuildSchema from "../../models/GuildSchema";
import { Colors } from "../../config";
import { getFiles } from "../../modules/getFiles";

export default class QuoteReactionEvent extends BotEvent {
  constructor(client: Amayi) {
    super(client, {
      name: "messageReactionAdd"
    })
  }

  async run(reaction: MessageReaction, user: User): Promise<void> {
    const message = reaction.message

    if (reaction.emoji.name != "📌" || reaction.count > 1) return // any reaction without the pin should be ignored. additionally ignores any reaction but the first.
    if (reaction.me) return; // ignore any reactions created by me or that have already been pinned.

    if (message.partial) await message.fetch().catch((e) => console.log(e))

    if (!message.guild) return;
    if ((!message.content && !message.attachments) || !message.channel.isTextBased()) return // ignores messages with nothing to pin/quote

    // get the settings for the guild, then check if the feature is enabled.
    const settings = (await GuildSchema.findOrCreate(message.guild.id)).config?.quotes
    if (!settings || !settings.enabled) return;

    // check if there is a channel set and that I can send messages in it.
    const channelId = settings.channel_id
    if (!channelId) return
    const channel = await this.client.channels.fetch(channelId)
    if (!channel || !channel.isTextBased()) return
    if (!message.guild.members.me?.permissionsIn(channelId).has(["SendMessages", "AttachFiles", "EmbedLinks"])) return

    if (!message.author) return
    let content = message.content ?? ""
    const files = getFiles(message as Message)

    const reference = message.reference
    if (reference?.messageId) {
      const repliedTo = await message.channel.messages.fetch(reference.messageId)
      content = `> Replying to <@${repliedTo.author.id}>: ${repliedTo.content}\n${content}`
    }

    const embed = new EmbedBuilder({
      author: {
        name: message.author.globalName ? `${message.author.globalName}` : `${message.author.username}`, 
        icon_url: message.author.avatarURL({size: 128}) ?? undefined,
        url: message.url
      },
      description: content.length > 0 ? content : undefined,
      footer: {
        text: `Pinned by ${user.globalName ? `${user.globalName} (@${user.username})` : `@${user.username}`}`,
        icon_url: user.avatarURL({size: 128}) ?? undefined
      },
      image: (files.length == 1 && files[0].embed) ? { url: files[0].attachment } : undefined,
      timestamp: Date.now(),
      color: Colors.embed_dark,
    })
    
    void message.react(reaction.emoji)
    return void await channel.send({ embeds: [embed], files: files.length > 1 || !files[0]?.embed ? files : undefined})
  }
}