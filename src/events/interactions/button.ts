import { Interaction } from "discord.js";
import Amayi from "../../structures/Amayi";
import { BotEvent } from "../../structures/Event";

export default class ButtonEvent extends BotEvent {
  constructor(client: Amayi) {
    super(client, {
      name: "interactionCreate"
    })
  }

  async run(interaction: Interaction): Promise<void> {
    if (!interaction.isButton()) return;
    // interaction.reply({ content: `clicked \`${interaction.customId}\`!` })
  }
}