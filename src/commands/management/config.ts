import { APIActionRowComponent, APIMessageActionRowComponent, ActionRowBuilder, ActionRowComponent, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, GuildMemberRoleManager, Interaction, PermissionsBitField, StringSelectMenuBuilder } from "discord.js";
import Amayi from "../../structures/Amayi";
import { Command } from "../../structures/Command";
import GuildSchema from "../../models/GuildSchema";
import { ConfigOption } from "../../structures/configuration/ConfigOptions";
import { APIButtonComponent } from "discord.js";
import { AnyComponentBuilder } from "discord.js";
import { Colors, Dashboard } from "../../config";

export default class ConfigCommand extends Command {
  constructor(client: Amayi) {
    super(client, {
      name: "config",
      description: "Configure your guild.",
      dmPermission: false,
      defaultMemberPermissions: ["ManageGuild"],
      options: [
        { 
          name: "prefix", 
          description: "want to use a prefix other than 'ayi '?", 
          type: ApplicationCommandOptionType.String
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
      prefix: interaction.options.getString("prefix") ?? undefined,
      visibility: interaction.options.getString("visibility") ?? "public",
    }
    const ephemeral: boolean = args.visibility == "hidden";
    const guild = interaction.guild
    if (!guild?.id) return void await interaction.reply({ content: `An error occured getting this guilds config.`, ephemeral });
    const model = await GuildSchema.findOrCreate(guild.id);

    // change prefix for the guild if that option is selected.
    if (args.prefix) {
      const member = interaction.member // making sure only people with manage server can change this setting
      if (!member || !(member.permissions as Readonly<PermissionsBitField>).has("ManageGuild")) return
      if (args.prefix == "ayi") args.prefix = "ayi "
      model.prefix = args.prefix
      await interaction.deferReply({ ephemeral })
      return void model.save().then(async model => await interaction.editReply({ content: `Set prefix to \`${model.prefix}\`` }))
    }

    // open the config menu.
    const avatar = this.client.user?.avatarURL({size:512})
    interaction.reply({ embeds: [
      new EmbedBuilder({
        title: "Amayi Dashboard",
        description: [
          `Edit your guild settings using Amayi's [dashboard](${Dashboard.domain}${Dashboard.port == 80 ? '' : `:${Dashboard.port}`}/dashboard/${guild.id})`,
          `If you need help using the dashboard feel free to join our [support server](https://discord.gg/DXJX7kyFgH).`
        ].join("\n"),
        color: Colors.amayi_pink,
        thumbnail: avatar ? { url: avatar } : undefined,
      })
    ], components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("Dashboard").setStyle(ButtonStyle.Link).setURL(`${Dashboard.domain}${Dashboard.port == 80 ? '' : `:${Dashboard.port}`}/dashboard/${guild.id}`),
        new ButtonBuilder().setLabel("Support Server").setStyle(ButtonStyle.Link).setURL("https://discord.gg/fuuAzbcRtV"),
      ).toJSON() as APIActionRowComponent<APIMessageActionRowComponent>] 
    })
  }
}