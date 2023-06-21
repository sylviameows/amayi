import { ApplicationCommandType, MessageContextMenuCommandInteraction } from "discord.js";
import Amayi from "../structures/Amayi";
import { Command } from "../structures/Command";
import { UwU } from "../config";

export default class UwUifyContext extends Command {
  constructor (client: Amayi) {
    super(client, {
      name: "UwUify",
      type: ApplicationCommandType.Message
    })
  }

  async run(interaction: MessageContextMenuCommandInteraction): Promise<void> {
    const message = interaction.targetMessage;
    if (message.author.id == this.client.user?.id) {
      return void await interaction.reply({
        content: "uwu",
        ephemeral: true
      })
    }
    if (message.content == "") {
      return void await interaction.reply({
        content: UwU.uwuifyWords("There is no message content for me to uwu."),
        ephemeral: true
      });
    }

    const uwu = UwU.uwuifySentence(message.content)
    if (uwu == message.content) {
      return void await interaction.reply({
        content: UwU.uwuifyWords("The message didn't change!"),
        ephemeral: true,
      })
    }
    try {
      await message.reply({
        content: uwu,
        allowedMentions: {parse: []}
      });
      await interaction.reply({
        content: UwU.uwuifyWords("uwu'd"),
        ephemeral: true,
      })
      await interaction.deleteReply();
    } catch {
      await interaction.reply({
        content: UwU.uwuifyWords("I can't type here!"),
        ephemeral: true,
      })
    }
  }
}