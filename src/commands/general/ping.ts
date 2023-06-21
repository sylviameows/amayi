import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../structures/Command";
import Amayi from "../../structures/Amayi";

export default class PingCommand extends Command {
  constructor (client: Amayi) {
    super(client, {
      name: "ping",
      description: "get the bots ping"
    })
  }

  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    interaction.reply({ content: "Pong!" })
  }
}