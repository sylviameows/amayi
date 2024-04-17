import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import Amayi from "../structures/Amayi";
import { Command } from "../structures/Command";
import { Colors, Emotes } from "../config";
import GuildSchema from "../models/GuildSchema";

const NUMBERS = [
  "1️⃣",
  "2️⃣",
  "3️⃣",
  "4️⃣",
  "5️⃣",
  "6️⃣",
  "7️⃣",
  "8️⃣",
  "9️⃣",
  "🔟",
];

export default class PetitionCommand extends Command {
  constructor(client: Amayi) {
    super(client, {
      name: "petition",
      description: "Create a petition.",
      options: [
        { 
          name: "content", 
          description: "What is your petition about?", 
          type: ApplicationCommandOptionType.String,
          required: true,
          max_length: 4096
        },{
          name: "choices",
          description: "For petitions where you choose between 2-10 options, leave empty for simple yes/no.",
          type: ApplicationCommandOptionType.Integer,
          max_value: 10,
          min_value: 2,
        },{
          name: "title",
          description: "The title of the petition, defaults to 'Petition'",
          type: ApplicationCommandOptionType.String,
          max_length: 256
        },{
          name: "image",
          description: "An image to attach to your petition.",
          type: ApplicationCommandOptionType.Attachment
        },{
          name: "color",
          description: "Select a color to use for the petition",
          type: ApplicationCommandOptionType.Number,
          choices: Object.entries(Colors).map(v => {return {name: v[0].replaceAll('_', ' '), value: v[1]}})
        },{
          name: "anonymous", 
          description: "set to true if you don't want people seeing who created it.", 
          type: ApplicationCommandOptionType.Boolean,
        }
      ]
    })
  }

  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    const args = {
      content: interaction.options.getString("content", true),
      title: interaction.options.getString("title") ?? "Petition",
      choices: interaction.options.getInteger("choices") ?? null,
      image: interaction.options.getAttachment("image") ?? null,
      color: interaction.options.getNumber("color") ?? Colors.embed_dark,
      anonymous: interaction.options.getBoolean("anonymous") ?? false,
    }

    if (!interaction.guild) return void await interaction.reply({ content: "You can only make petitions in servers!", ephemeral: true})
    const settings = (await GuildSchema.findOrCreate(interaction.guild.id)).config?.petitions
    if (!settings || !settings.enabled) return void await interaction.reply({ content: "Petitions are not enabled on this server!", ephemeral: true })
    
    const user = !args.anonymous ? interaction.user : {username: "Anonymous", globalName: null, avatarURL() {return undefined}}
    if (args.image && args.image.name.match(/([^\s]+(\.(jpe?g|png|webp|gif)))$/g) == null)
      return void await interaction.reply({ content: "Invalid file type, I only accept .png, .jpg, .webp, and .gif", ephemeral: true })   
  
    const content = settings.role ? `<@&${settings.role}>` : ""
    if (settings.channel_id != interaction.channelId) {
      // honestly idk if this is actually needed, but i'll keep it to be safe !
      await interaction.deferReply({ ephemeral: args.anonymous })
    } else {
      await interaction.reply({ content, allowedMentions: { roles: settings.role ? [settings.role] : undefined }})
    }

    const embed = new EmbedBuilder()
      .setTitle(args.title)
      .setDescription(args.content.replaceAll('\\n', '\n'))
      .setColor(args.color)
      .setTimestamp(Date.now())
      .setFooter({ text: user.globalName ? `${user.globalName} (@${user.username})` : user.username, iconURL: user.avatarURL() ?? undefined})
      .setImage(args.image?.url ?? null)

    // create message in set OR current channel.
    let message = undefined
    if (settings.channel_id && settings.channel_id != interaction.channelId) {
      const channel = await interaction.guild.channels.fetch(settings.channel_id)
      if (!channel || !channel.isTextBased()) return void await interaction.editReply("Could not find a text channel.")
      if (!interaction.guild.members.me?.permissionsIn(channel).has(["SendMessages", "AttachFiles"])) return void await interaction.editReply(`I do not have the permissions \`SendMessages\` and \`AttachFiles\` in <#${channel.id}>`)
      message = await channel.send({ content, embeds: [embed] })
      await interaction.editReply(`Successfully sent petition${args.anonymous ? " anonymously " : " "}in <#${channel.id}>`)
    } else if (args.anonymous) {
      // this section of code is needed since anonymous petitions must be sent in a separate message.
      const channel = settings.channel_id ? await interaction.guild.channels.fetch(settings.channel_id) : interaction.channel
      if (!channel || !channel.isTextBased()) return void await interaction.editReply("Could not find a text channel.")
      message = await channel.send({ content, embeds: [embed] })
      await interaction.editReply(`Successfully sent petition anonymously in <#${channel.id}>`)
    } else {
      message = await interaction.editReply({ content, embeds: [embed] })
    }
    
    // react to the message
    if (args.choices) {
      for (let i = 0; i < args.choices; i++)
        await message.react(NUMBERS[i])
    } else {
      await message.react(Emotes.upvote)
      await message.react(Emotes.downvote)
    }
  }
}