import { Message, time } from "discord.js";
import Amayi from "../../structures/Amayi";
import ChatCommandEvent from "../../structures/ChatCommandEvent";

const aliases = {
  vae: {display: "Vae", tz: "America/Chicago"},
  apollo: {display: "Apollo", tz: "Europe/Bucharest"},
  vann: {display: "Vann", tz: "America/Chicago"},
  kit: {display: "KatKit", tz: "America/Edmonton"},
  res: {display: "Restitutor", tz: "America/Toronto"},
  primis: {display: "Primis", tz: "America/Chicago"},
  clixy: {display: "Clixy", tz: "America/Los_Angeles"},
}

export default class NowCommand extends ChatCommandEvent {
  constructor (client: Amayi) {
    super(client, "now")
  }

  async runCommand(message: Message<boolean>, args: string[]): Promise<void> {
    const now = new Date();
    let content: string = "";

    args.forEach(arg => {
      const alias = arg as keyof typeof aliases;
      let data: { display?: string, tz: string } = aliases[alias];

      if (!data) data = { tz: arg};

      try {
        const time = now.toLocaleTimeString("en-US", {hour12: true, timeStyle: "long", timeZone: data.tz})
        const string = `${data.display ?? data.tz}: \`${time}\` (${data.tz})`
        content = content+string+'\n';
      } catch {
        content = content+`**!** \`${data.display ?? data.tz}\` was not a valid timezone.`+'\n'
      }
      
      
    })

    const timestamp = Math.floor(now.getTime()/1000)
    await message.reply(content+`You: <t:${timestamp}:T>`)
  }
}