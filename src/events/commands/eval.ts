import { Message, codeBlock } from "discord.js";
import Amayi from "../../structures/Amayi";
import ChatCommandEvent from "../../structures/ChatCommandEvent";

export default class EvalCommand extends ChatCommandEvent {
  constructor (client: Amayi) {
    super(client, "eval")
  }

  async runCommand(message: Message<boolean>, args: string[]): Promise<void> {
    if (['195606057131704320', '951957003486519350'].includes(message.author.id)) {
      try {
        const response = await eval(args.join(' '))
        return void await message.reply({content: codeBlock('js', response)})
          .catch(async () => {
            var channel = message.channel;
            if (!channel || !channel.isTextBased() || channel.isDMBased()) return;
            await channel.send("Error occured trying to send feedback.")
          })
      } catch (err) {
        if (!(err instanceof Error)) return void await message.reply({content: "Unknown error occured."}).catch(async () => {
          var channel = message.channel;
          if (!channel || !channel.isTextBased() || channel.isDMBased()) return;
          await channel.send("Unknown error occured trying to send feedback.")
        })
        return void await message.reply({content: `An error occured: \`${err.name}: ${err.message}\`` + err.stack ? codeBlock('js', err.stack ?? "Could not fetch stacktrace.") : ''})
          .catch(async () => {
            var channel = message.channel;
            if (!channel || !channel.isTextBased() || channel.isDMBased()) return;
            await channel.send("Error occured trying to send feedback.")
          })
      }
    }
  }
  
  /*case "reload": {
  if (['195606057131704320'].includes(message.author.id))
    return void exec('pnpm build', async (error) => {
      if (error) return void await message.reply("An error occured reloading the bot D:")
      await build(this.client, "../commands")
      return void await message.reply(`Successfully reloaded the bots commands!`)
    })
  }*/
}