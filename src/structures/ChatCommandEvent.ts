import { Message } from "discord.js";
import Amayi from "./Amayi";
import { BotEvent } from "./Event";
import GuildSchema from "../models/GuildSchema";

export default class ChatCommandEvent extends BotEvent {
  commandName: string;
  aliases: string[];

  constructor (client: Amayi, name: string, aliases: string[] = []) {
    super(client, {
      name: "messageCreate"
    })

    this.commandName = name;
    this.aliases = aliases;
  }

  async runCommand(message: Message, args: string[]): Promise<void> {
    throw new Error(`The command "${this.name}" does not provide a run method.`)
  }

  async run(message: Message): Promise<void> {
    let prefix = "ayi "
    if (message.guildId) prefix = (await GuildSchema.findOrCreate(message.guildId)).prefix ?? "ayi "
    if (!message.content.toLowerCase().startsWith(prefix)) return;
    const content = message.content.toLowerCase().replace(prefix, '');
    const args = content.trim().split(' ');
    const command = args.shift()

    if (!command) return;
    if (command == this.commandName || this.aliases.includes(command)) {
      return await this.runCommand(message, args)
    }
  }
}