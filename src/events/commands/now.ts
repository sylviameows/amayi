import { Message, time } from "discord.js";
import Amayi from "../../structures/Amayi";
import ChatCommandEvent from "../../structures/ChatCommandEvent";
import timezones from "../../modules/timezones/timezones";

const aliases = {
  vae: {display: "Vae", tz: "America/Chicago"},
  apollo: {display: "Apollo", tz: "Europe/Bucharest"},
  vann: {display: "Vann", tz: "America/Chicago"},
  kit: {display: "KatKit", tz: "America/Edmonton"},
  res: {display: "Restitutor", tz: "America/Toronto"},
  primis: {display: "Primis", tz: "America/Chicago"},
  clixy: {display: "Clixy", tz: "America/Los_Angeles"},
  ari: {display: "Ari", tz: "Asia/Calcutta"},
  scrumps: {display: "Scrumps", tz: "Asia/Manila"}
}

export default class NowCommand extends ChatCommandEvent {
  constructor (client: Amayi) {
    super(client, "now", ["n"])
  }

  async runCommand(message: Message<boolean>, args: string[]): Promise<void> {
    const now = new Date();

    let full = false
    if (args.includes("-f")) full = true;

    const value = await Promise.all(args.map(async arg => {
      if (arg == "-f") return;

      let data: { display?: string, tz: string }
      if (arg == "me") {
        const tz = await timezones.fromId(message.author.id);
        const name = message.author.globalName ?? message.author.displayName

        if (!tz) return `**!** You dont have a valid timezone set.`
        
        data = {display: name, tz};
      } else {
        // @ts-ignore
        if (aliases[arg]) {
          data = aliases[arg as keyof typeof aliases];
        } else {
          if (arg.startsWith("<@")) {
            const id = arg.slice(2, arg.length - 1)
            const tz = await timezones.fromId(id)
            if (!tz) {
              return `**!** ${arg} does not have a valid timezone set.`
            }

            let name = await timezones.aliasFromUserId(id)
            if (!name) name = `<@${id}>`
            

            data = {display: name, tz};
          } else {
            const tz = await timezones.fromAlias(arg)

            if (tz) {
              data = {display: arg, tz};
            } else {
              data = {tz: arg}
            }
          }
        }
      }

      try {
        const time = now.toLocaleTimeString("en-US", {hour12: true, timeStyle: "long", timeZone: data.tz})
        const date = now.toLocaleDateString("en-US", {hour12: true, dateStyle: "full", timeZone: data.tz})
        return `${data.display ?? data.tz}: \`${full ? date+" "+time : time}\` (${data.tz})`
      } catch {
        return `**!** \`${data.display ?? data.tz}\` was not a valid timezone.`
      }
    }))

    const content = value.filter(i => i != undefined).join('\n')

    const timestamp = Math.floor(now.getTime()/1000)
    await message.reply({content: content+`\nYou: <t:${timestamp}${full ? ":F" : ":T"}>`, allowedMentions: {parse: []}})
  }
}