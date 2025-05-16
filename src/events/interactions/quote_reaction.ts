import { EmbedBuilder, Message, MessageReaction, User } from "discord.js";
import Amayi from "../../structures/Amayi";
import { BotEvent } from "../../structures/Event";
import GuildSchema from "../../models/GuildSchema";
import { Colors } from "../../config";
import { getFiles } from "../../modules/getFiles";

const PIN_EMOJI = "📌";
// skull, star, star2
const STARBOARD_EMOJIS = new Set(['💀', '⭐', '🌟']);
const ALL_PIN_EMOJIS = new Set([PIN_EMOJI, ...STARBOARD_EMOJIS]);

export default class QuoteReactionEvent extends BotEvent {
  constructor(client: Amayi) {
    super(client, {
      name: "messageReactionAdd"
    })
  }

  async run(reaction: MessageReaction, user: User): Promise<void> {
    const message = reaction.message

    if (reaction.me || user.bot) return; // ignore any reactions created by me
    if (!reaction.emoji.name || !ALL_PIN_EMOJIS.has(reaction.emoji.name)) return;

    if (message.partial) await message.fetch().catch((e) => console.log(e))

    // Already reacted (pinned)
    if (message.reactions.resolve(PIN_EMOJI)?.me) return;

    // Pin if user reacted pushpin or 3 or more of the same starboard emoji
    let shouldPin = reaction.emoji.name === PIN_EMOJI;
    for (const emoji of STARBOARD_EMOJIS) {
      const manager = message.reactions.resolve(emoji);
      if (manager === null) continue;
      if (manager.count < 3) continue;
      shouldPin = true;
      break;
    }
    if (!shouldPin) return;

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
    if (channel.isDMBased()) return;
    if (!message.guild.members.me?.permissionsIn(channelId).has(["SendMessages", "AttachFiles", "EmbedLinks"])) return

    if (!message.author) return

    // make bot not able to pin quote messages (experimental)
    if (message.author.id == this.client.user?.id && channel.id == channelId) return

    let content = message.content ?? ""
    const files = getFiles(message as Message)

    // make bot not able to quote content with nothing. (eg. bot embeds.)
    if (content == "" && files.length == 0) return

    const reference = message.reference
    if (reference?.messageId) {
      try {
        const repliedTo = await message.channel.messages.fetch(reference.messageId)
        content = `> Replying to <@${repliedTo.author.id}>: ${repliedTo.content}\n${content}`
      } catch {
        content = `> *Original reply was deleted* \n${content}`
      }
    }

    const embed = new EmbedBuilder({
      author: {
        name: message.author.globalName ? `${message.author.globalName}` : `${message.author.username}`,
        icon_url: message.author.avatarURL({ size: 128 }) ?? undefined,
        url: message.url
      },
      description: content.length > 0 ? content : undefined,
      footer: {
        text: `Pinned by ${user.globalName ? `${user.globalName} (@${user.username})` : `@${user.username}`}`,
        icon_url: user.avatarURL({ size: 128 }) ?? undefined
      },
      image: (files.length == 1 && files[0].embed) ? { url: files[0].attachment } : undefined,
      timestamp: Date.now(),
      color: Colors.embed_dark,
    })

    void message.react(PIN_EMOJI);
    return void await channel.send({ embeds: [embed], files: files.length > 1 || !files[0]?.embed ? files : undefined })
  }
}
