import { Message, codeBlock } from "discord.js";
import Amayi from "../../structures/Amayi";
import { BotEvent } from "../../structures/Event";
import GuildSchema from "../../models/GuildSchema";
import { exec } from "child_process";
import build from "../../handlers/CommandHandler";

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
    const command = content.split(' ')[0]
    const args = content.replace(command, '').trim()

    switch (command) {
      case "eval": {
        if (['195606057131704320', '951957003486519350'].includes(message.author.id))
        try {
          const response = await eval(args)
          return void await message.reply({content: codeBlock('js', response)})
            .catch(async () => await message.channel.send("Error occured trying to send feedback."))
        } catch (err) {
          if (!(err instanceof Error)) return void await message.reply({content: "Unknown error occured."}).catch(async () => await message.channel.send("Unknown error occured trying to send feedback."))
          return void await message.reply({content: `An error occured: \`${err.name}: ${err.message}\`` + err.stack ? codeBlock('js', err.stack ?? "Could not fetch stacktrace.") : ''})
            .catch(async () => await message.channel.send("Error occured trying to send feedback."))
        }
        break;
      };
      /*case "reload": {
        if (['195606057131704320'].includes(message.author.id))
        return void exec('pnpm build', async (error) => {
          if (error) return void await message.reply("An error occured reloading the bot D:")
          await build(this.client, "../commands")
          return void await message.reply(`Successfully reloaded the bots commands!`)
        })
      }*/
    }
  }
}