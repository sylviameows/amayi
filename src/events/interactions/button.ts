import { Interaction } from "discord.js";
import Amayi from "../../structures/Amayi";
import { BotEvent } from "../../structures/Event";
import { alerts, pagination, select } from "../../modules/weather/buttons";
import { onClick } from "../../modules/anonymous_poll";

export default class ButtonEvent extends BotEvent {
  constructor(client: Amayi) {
    super(client, {
      name: "interactionCreate"
    })
  }

  async run(interaction: Interaction): Promise<void> {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    if (interaction.customId.startsWith("weather")) {
      const button = interaction.customId.split(".")[1]
      if (interaction.isStringSelectMenu() && button.startsWith("select")) 
        return await select.run(interaction);
      if (interaction.isButton() && button.startsWith("alerts"))
        return await alerts.run(interaction);
      if (interaction.isButton() && button.startsWith("pagination"))
        return await pagination.run(interaction);
    }
    else if (interaction.isButton() && interaction.customId.startsWith("anon_poll")) {
      return await onClick(interaction);
    }

    // interaction.reply({ content: `clicked \`${interaction.customId}\`!` })
  }
}