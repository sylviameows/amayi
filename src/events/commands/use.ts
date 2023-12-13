import { Message } from "discord.js";
import Amayi from "../../structures/Amayi";
import ChatCommandEvent from "../../structures/ChatCommandEvent";
import MacroSchema from "../../models/MacroSchema";

export default class UseCommand extends ChatCommandEvent {
  constructor (client: Amayi) {
    super(client, "use")
  }

  async runCommand(message: Message<boolean>, args: string[]): Promise<void> {
    if (!message.guildId) return

    const macro = await MacroSchema.findOne({ guild_id: message.guildId, name: args})
    if (!macro) return void await message.reply({content: "no macro with that name exists", allowedMentions: {parse: []}})
    macro.uses = macro.uses + 1
    await macro.save()
    await message.reply({content: macro.content, allowedMentions: {parse: []}})
  }
}