import { APIMessageActionRowComponent, ActionRowBuilder, ApplicationCommandOptionType, ButtonStyle, ChatInputCommandInteraction, ComponentType, EmbedBuilder, MessageActionRowComponentBuilder, codeBlock } from "discord.js";
import Amayi from "../../structures/Amayi";
import { Command } from "../../structures/Command";
import { Colors } from "../../config";

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

    const user = await this.client.users.fetch(args.user, { force: true })
    const name = user.globalName ?? `@${args.user.username}`
    const avatar = user.avatarURL({size: 512})
    const avatarFull = user.avatarURL({size: 4096})
    const banner = user.bannerURL({size: 4096})

    const embed = new EmbedBuilder()
      .setTitle(name)
      .setThumbnail(avatar)
      .setColor(user.accentColor ?? Colors.embed_dark)
      .setFooter({text: "Created at"})
      .setTimestamp(user.createdTimestamp)
      .addFields({name: "Username", value: codeBlock("sh", `@${args.user.username}`)})

    let components: APIMessageActionRowComponent[] = []
    if (avatarFull) {
      components.push({
        style: ButtonStyle.Link,
        label: "Avatar",
        url: avatarFull,
        type: ComponentType.Button
      })
    }
    if (banner) {
      components.push({
        style: ButtonStyle.Link,
        label: "Banner",
        url: banner,
        type: ComponentType.Button
      })
    }
    const buttons = new ActionRowBuilder<MessageActionRowComponentBuilder>({components})

    await interaction.reply({embeds: [embed], components: components.length > 0 ? [buttons] : undefined, ephemeral})
  }
}