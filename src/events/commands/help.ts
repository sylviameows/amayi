import { Message } from "discord.js";
import Amayi from "../../structures/Amayi";
import ChatCommandEvent from "../../structures/ChatCommandEvent";
import GuildSchema from "../../models/GuildSchema";

export default class HelpCommand extends ChatCommandEvent {
  constructor (client: Amayi) {
    super(client, "help")
  }



  async runCommand(message: Message<boolean>, args: string[]): Promise<void> {
    let prefix = "ayi "
    if (message.guildId) prefix = (await GuildSchema.findOrCreate(message.guildId)).prefix ?? "ayi "

    const command = (command: string) => { return `\`${prefix}${command}\`` }

    await message.reply({content: [
      "### amayi legacy commands",
      command("help")+" shows this message.",
      command("now (...timezones)")+" get the time.",
      command("use <macro>")+" use a macro.",
      command("weather <location>")+ " wouldn't u like to know *weather boy*.",
      "",
      "> `<>` = required, `()` = optional",
    ].join("\n"), allowedMentions: {parse: []}})
  }
}