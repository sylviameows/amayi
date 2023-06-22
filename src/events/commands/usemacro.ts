import { Message, codeBlock } from "discord.js";
import Amayi from "../../structures/Amayi";
import { BotEvent } from "../../structures/Event";
import GuildSchema from "../../models/GuildSchema";
import MacroSchema from "../../models/MacroSchema";

export default class CreateEntry extends BotEvent {
  constructor (client: Amayi) {
    super(client, {
      name: "messageCreate"
    })
  }

  async run(message: Message): Promise<void> {
    let prefix = "ayi "
    if (message.guildId) prefix = (await GuildSchema.findOrCreate(message.guildId)).prefix ?? "ayi "
    if (!message.content.toLowerCase().startsWith(prefix)) return;
    const content = message.content.toLowerCase().replace(prefix, '');
    const command = "use"
    const args = content.replace(command, '').trim()

    if (!args || !command) return;
    if (command != "use") return;
    if (!message.guildId) return

    const macro = await MacroSchema.findOne({ guild_id: message.guildId, name: args})
    if (!macro) return void await message.reply({content: "no macro with that name exists", allowedMentions: {parse: []}})
    macro.uses = macro.uses + 1
    await macro.save
    await message.reply({content: macro.content, allowedMentions: {parse: []}})
  }
}