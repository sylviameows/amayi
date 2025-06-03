import { EmbedBuilder, EmbedFooterData, Guild, GuildBasedChannel, Message, User } from "discord.js";
import { boards, Action, Board } from "./boards";
import GuildSchema from "../../models/GuildSchema";
import { Colors } from "../../config";
import { getFiles } from "../getFiles";
import BoardSchema, { MessagesDoc } from "../../models/BoardSchema";
import mongoose from "mongoose";

export async function handleBoards(message: Message, causing_user: User) {
  boards.forEach(async board => {
    const [action, data, count] = await board.check(message);
    if (action == Action.NONE) return;
    if (action == Action.CREATE) {
      if (!message.guild) return;

      const channel = await getChannel(message.guild)
      if (!channel || !channel.isTextBased()) return;

      const [embed, files] = await makeEmbed(message, board, count, causing_user);
      if (!embed) return;

      const board_message = await channel.send({embeds: [embed], files: files ?? undefined})
      
      if (data == null) {
        await BoardSchema.create({message_id: message.id, boards: [{emoji: board.emoji, message_id: board_message.id}]})
      } else if ('boards' in data) {
        data.boards.push({message_id: board_message.id, emoji: board.emoji})
        data.save()
      }
    }

    if (action == Action.UPDATE) {
      if (board.solo()) return; // this type needs no updating.
      if (!data) return;

      if (!message.guild) return;

      const channel = await getChannel(message.guild)
      if (!channel || !channel.isTextBased()) return;

      const board_message = await channel.messages.fetch(data.message_id)

      if (board_message.editable) {
        const embed = board_message.embeds[0]
        if (!embed) return;

        const updated = new EmbedBuilder(embed.data).setFooter({
          text: `${board.emoji} x${count}`
        });

        await board_message.edit({embeds: [updated]})
      }
    }

    if (action == Action.REMOVE) {
      if (!data) return;

      if (!message.guild) return;

      const channel = await getChannel(message.guild)
      if (!channel || !channel.isTextBased()) return;

      try {
        const board_message = await channel.messages.fetch(data.message_id)
        if (board_message.deletable) await board_message.delete()
      } catch (e) {
        // do nothing
      } finally {
        const parent = data.$parent()
        if (parent && isMessageDoc(parent)) {
          parent.boards.pull({emoji: board.emoji})
          parent.save()
        }
      }
    }
  })
}

function isMessageDoc(doc: mongoose.Document): doc is MessagesDoc {
  return 'boards' in doc
}

async function makeEmbed(message: Message, board: Board, count: Number, causing_user: User): Promise<[embed: EmbedBuilder | null, files: { attachment: string; embed: boolean; }[] | null]> {
  let content = message.content;

  const files = getFiles(message)

  // make bot not able to quote content with nothing. (eg. bot embeds.)
  if (content == "" && files.length == 0) return [null, null];

  const reference = message.reference
  if (reference?.messageId) {
    try {
      const repliedTo = await message.channel.messages.fetch(reference.messageId)
      content = `> Replying to <@${repliedTo.author.id}>: ${repliedTo.content}\n${content}`
    } catch {
      content = `> *Original reply was deleted* \n${content}`
    }
  }

  var footer: EmbedFooterData;
  if (board.solo()) {
    footer = {
      text: `${board.emoji} by ${causing_user.globalName ? `${causing_user.globalName} (@${causing_user.username})` : `@${causing_user.username}`}`,
      iconURL: causing_user.avatarURL({ size: 128 }) ?? undefined
    }
  } else {
    footer = {
      text: `${board.emoji} x${count}`
    }
  }

  return [new EmbedBuilder({
    author: {
      name: message.author.globalName ? `${message.author.globalName}` : `${message.author.username}`,
      iconURL: message.author.avatarURL({ size: 128 }) ?? undefined,
      url: message.url
    },
    description: content.length > 0 ? content : undefined,
    footer: footer,
    image: (files.length == 1 && files[0].embed) ? { url: files[0].attachment } : undefined,
    timestamp: Date.now(),
    color: Colors.embed_dark
  }), files.length > 1 || (files.length == 1 && !files[0].embed) ? files : null]
}

async function getChannel(guild: Guild): Promise<GuildBasedChannel | null> {
  const config = (await GuildSchema.findOrCreate(guild.id)).config?.quotes;
  if (!config || !config.enabled) return null;

  const id = config.channel_id;
  if (!id) return null;
  return await guild.channels.fetch(id)

}