import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, Interaction } from "discord.js";
import Amayi from "../../structures/Amayi";
import { Command } from "../../structures/Command";
import { Colors } from "../../config";
import { formatDuration } from "../../modules/formatTime";

export default class HelpCommand extends Command {
  constructor(client: Amayi) {
    super(client, {
      name: "help",
      description: "Get information about me and my functions.",
      options: [
        {
          name: "visibility", 
          description: "should others see the output of this command?", 
          type: ApplicationCommandOptionType.String,
          choices: [{name: "public", value: "public"},{name:"hidden", value:"hidden"}]
        }
      ]
    })
  }

  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    const args = {
      visibility: interaction.options.getString("visibility") ?? "public",
    }
    const ephemeral: boolean = args.visibility == "hidden";

    const avatar = this.client.user?.avatarURL({size:512})
    const uptime = this.client.uptime ? formatDuration(this.client.uptime) : undefined

    const embed = new EmbedBuilder({
      title: "About Amayi",
      description: [
        "Amayi is developed by `@vulpic`, icons created by [Danu](https://discord.gg/9AtkECMX2P)",
        "I was created to help bring together people in communities with a variety of commands like petitions and macros.", // replace with </petitions:id> later
        "",
        "**Additional Information**",
        "Macros can be used with the prefix `ayi ` by default.", // fix to show server prefix later
        "If you need help setting up the bot feel free to join our [support server](https://discord.gg/DXJX7kyFgH).",
      ].join('\n'),
      color: Colors.amayi_pink,
      thumbnail: avatar ? { url: avatar } : undefined,
      footer: uptime ? {text: `Online for ${uptime}.`} : undefined
    })

    await interaction.reply({ embeds: [embed], ephemeral })
  }
}