import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, Interaction, codeBlock } from "discord.js";
import Amayi from "../../structures/Amayi";
import { Command } from "../../structures/Command";
import { Colors } from "../../config";
import { formatDuration } from "../../modules/formatTime";

export default class HelpCommand extends Command {
  constructor(client: Amayi) {
    super(client, {
      name: "info",
      description: "Get information about a user.",
      options: [
        {
          name: "user", 
          description: "what user do you want to learn more about?", 
          type: ApplicationCommandOptionType.User,
        },{
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
      user: interaction.options.getUser("user") ?? interaction.user,
      visibility: interaction.options.getString("visibility") ?? "public",
    }
    const ephemeral: boolean = args.visibility == "hidden";

    const avatar = args.user.avatarURL()

    const embed = new EmbedBuilder({
      fields: [
        {name: "Name", value: codeBlock("sh", args.user.tag), inline: true}, // potentially add badges?
        {name: "Pronouns", value: codeBlock("js", "unfi/nished"), inline: true},
        {name: "Bio", value: 'coming soon.'}
      ],
      color: Colors.embed_dark,
      thumbnail: avatar ? { url: avatar } : undefined,
      footer: {text: "Created at"},
      timestamp: args.user.createdTimestamp
    })

    await interaction.reply({ embeds: [embed], ephemeral })
  }
}