import { ApplicationCommandOptionChoiceData, ApplicationCommandOptionType, AutocompleteInteraction, CacheType, ChatInputCommandInteraction, EmbedBuilder, GuildMemberRoleManager } from "discord.js";
import { Command } from "../../structures/Command";
import Amayi from "../../structures/Amayi";
import MacroSchema from "../../models/MacroSchema";
import { Colors } from "../../config";
import GuildSchema from "../../models/GuildSchema";

export default class MacroCommand extends Command {
  constructor (client: Amayi) {
    super(client, {
      name: "macro",
      description: "manage macros",
      options: [{
        name: "create",
        description: "create a new macro",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {name: "name", description: "the name of the macro to create", type: 3, max_length: 32},
          {name: "content", description: "the content of the macro you're creating", type: 3, max_length: 2000}
        ]
      },{
        name: "delete",
        description: "delete an existing macro",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {name: "name", description: "the name of the macro to delete", type: 3, max_length: 32, autocomplete: true}
        ]
      },{
        name: "list",
        description: "list all macros",
        type: ApplicationCommandOptionType.Subcommand,
      },{
        name: "use",
        description: "use a macro",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {name: "name", description: "the name of the macro", type: 3, max_length: 32, autocomplete: true},
        ]
      }]
    })
  }

  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    if (interaction.options.getSubcommand(true) == "list") {
      const macros = await MacroSchema.find({ guild_id: interaction.guild.id })
      const embed = new EmbedBuilder({
        title: `Top macros for ${interaction.guild.name}`,
        color: Colors.embed_dark,
        timestamp: Date.now(),
        description: macros.sort((a, b) => b.uses - a.uses).slice(undefined, 10).map(m => `**${m.uses}** - \`${m.name}\``).join("\n")
      });
      return void await interaction.reply({ embeds: [embed] })
    }

    if (interaction.options.getSubcommand(true) == "create") {
      const args = {
        name: interaction.options.getString("name", true),
        content: interaction.options.getString("content", true).replaceAll("\\n", "\n")
      }
      let macro = await MacroSchema.findOne({guild_id: interaction.guild.id, name: args.name})
      if (macro) return void await interaction.reply({content: "a macro with this name already exists", ephemeral: true})
      macro = await MacroSchema.create({
        guild_id: interaction.guild.id,
        user_id: interaction.user.id,
        name: args.name,
        content: args.content
      })
      await macro.save()
      return void await interaction.reply({content: `created a macro named \`${args.name}\``, ephemeral: true})
    }

    if (interaction.options.getSubcommand(true) == "delete") {
      const guild = (await GuildSchema.findOrCreate(interaction.guild.id)).config
      if (!guild) return void await interaction.reply({content: 'could not find the guild options for this guild', ephemeral: true})
      const args = {
        name: interaction.options.getString("name", true),
      }
      const macro = await MacroSchema.findOne({guild_id: interaction.guild.id, name: args.name})
      if (!macro) return void await interaction.reply({content: "no macro with this name exists", ephemeral: true})
      if (macro.user_id != interaction.user.id || !(interaction.member?.roles as GuildMemberRoleManager).cache.has(guild.staff_roles[0]))
      await MacroSchema.findOneAndRemove({guild_id: interaction.guild.id, name: args.name})
      return void await interaction.reply({ content: `deleted macro \`${args.name}\`.`, ephemeral: true})
    }

    if (interaction.options.getSubcommand(true) == "use") {
      const args = {
        name: interaction.options.getString("name", true),
      }
      const macro = await MacroSchema.findOne({guild_id: interaction.guild.id, name: args.name})
      if (!macro) return void await interaction.reply({content: "no macro with this name exists", ephemeral: true})

      interaction.reply({content: macro.content})
      macro.uses = macro.uses + 1
      return void await macro.save()
    }

    return void await interaction.reply({content: "an unexpected error occured", ephemeral: true})
  }

  async autocomplete(interaction: AutocompleteInteraction<CacheType>): Promise<void> {
    const command = interaction.options.getSubcommand(true)
    const focused = interaction.options.getFocused().toLowerCase()
      if (interaction.guildId == null) return void await interaction.respond([]);
    if (command == "use") {
      const macros = await MacroSchema.find({guild_id: interaction.guildId})
      if (!macros) return void await interaction.respond([]);
      const filtered = macros.filter(macro => macro.name.startsWith(focused)).map(macro => ({ name: macro.name, value: macro.name }))
      return void await interaction.respond(filtered)
    }
    if (command == "delete") {
      const guild = (await GuildSchema.findOrCreate(interaction.guildId)).config
      if (!guild) return void await interaction.respond([])
      const staff = (interaction.member?.roles as GuildMemberRoleManager).cache.has(guild.staff_roles[0])
      if (staff) {
        const macros = await MacroSchema.find({guild_id: interaction.guildId})
      if (!macros) return void await interaction.respond([]);
        const map = macros.map(macro => {return {name: macro.name, user: macro.user_id}}).filter(macro => macro.name.startsWith(focused))
        const filtered: ApplicationCommandOptionChoiceData<string>[] = []; 
        map.forEach(macro => {
          if (macro.user != interaction.user.id) filtered.push({ name: `${macro.name} ⚠️`, value: macro.name })
          else filtered.push({ name: macro.name, value: macro.name })
        })
        return void await interaction.respond(filtered)
      }
      const macros = await MacroSchema.find({guild_id: interaction.guildId, user_id: interaction.user.id})
      if (!macros) return void await interaction.respond([]);
      const filtered = macros.filter(macro => macro.name.startsWith(focused)).map(macro => ({ name: macro.name, value: macro.name }))
      return void await interaction.respond(filtered)
    }
  }
}