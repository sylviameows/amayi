import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";
import Amayi from "../structures/Amayi";
import { Command } from "../structures/Command";
import { Colors, Emotes } from "../config";
import GuildSchema from "../models/GuildSchema";
import AnonymousPollSchema from "../models/AnonymousPollSchema";
import { editEmbed } from "../modules/anonymous_poll";

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
  constructor(client: Amayi, name: string = "petition") {
    const title = name.replace(
      /\w\S*/g, 
      (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    )
    super(client, {
      name: name,
      description: `Create a ${name}.`,
      options: [
        { 
          name: "content", 
          description: `What is your ${name} about?`, 
          type: ApplicationCommandOptionType.String,
          required: true,
          max_length: 4096,
        },{
          name: "choices",
          description: `For ${name}s where you choose between 2-10 options, leave empty for simple yes/no.`,
          type: ApplicationCommandOptionType.Integer,
          max_value: 10,
          min_value: 2,
        },{
          name: "title",
          description: `The title of the ${name}, defaults to "${title}"`,
          type: ApplicationCommandOptionType.String,
          max_length: 256
        },{
          name: "image",
          description: `An image to attach to your ${name}.`,
          type: ApplicationCommandOptionType.Attachment
        },{
          name: "color",
          description: `Select a color to use for the ${name}.`,
          type: ApplicationCommandOptionType.Number,
          choices: Object.entries(Colors).map(v => {return {name: v[0].replaceAll('_', ' '), value: v[1]}})
        },{
          name: "anonymous_author",
          description: "set to true if you don't want people seeing who created it.", 
          type: ApplicationCommandOptionType.Boolean,
        },{
          name: "anonymous_response",
          description: "set to true if you want responses to be anonymous.", 
          type: ApplicationCommandOptionType.Boolean,
        },{
          name: "only_one",
          description: "set to true if you only want to allow one response.",
          type: ApplicationCommandOptionType.Boolean,
        }, {
          name: "poll_here",
          description: "set to true if you to create the poll here instead.",
          type: ApplicationCommandOptionType.Boolean,
        }
      ]
    })
    this.name = name;
  }

  // command name for differentiating
  name: string;
  private toTitleCase(str:string) {
    return str.replace(
      /\w\S*/g, 
      (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    )
  }

  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    const args = {
      content: interaction.options.getString("content", true),
      title: interaction.options.getString("title") ?? this.toTitleCase(this.name),
      choices: interaction.options.getInteger("choices") ?? null,
      image: interaction.options.getAttachment("image") ?? null,
      color: interaction.options.getNumber("color") ?? Colors.embed_dark,
      anonymous: interaction.options.getBoolean("anonymous_author") ?? false,
      anonymous_response: interaction.options.getBoolean("anonymous_response") ?? false,
      only_one: interaction.options.getBoolean("only_one"),
      poll_here: interaction.options.getBoolean("poll_here") ?? false,
    }

    if (args.only_one == null) {
      args.only_one = args.choices == null
    }

    if (!interaction.guild) return void await interaction.reply({ content: `You can only make ${this.name}s in servers!`, ephemeral: true})
    const settings = (await GuildSchema.findOrCreate(interaction.guild.id)).config?.petitions
    if (!settings || !settings.enabled) return void await interaction.reply({ content: `${this.toTitleCase(this.name)}s are not enabled on this server!`, ephemeral: true })
    
    const user = !args.anonymous ? interaction.user : {username: "Anonymous", globalName: null, avatarURL() {return undefined}}
    if (args.image && args.image.name.match(/([^\s]+(\.(jpe?g|png|webp|gif)))$/g) == null)
      return void await interaction.reply({ content: "Invalid file type, I only accept .png, .jpg, .webp, and .gif", ephemeral: true })   
  
    const content = (settings.role && !args.poll_here) ? `<@&${settings.role}>` : ``

    const channel_id = args.poll_here ? interaction.channelId : settings.channel_id;
    const allowedMentions = { roles: settings.role ? [settings.role] : undefined };
    if (channel_id != interaction.channelId || args.anonymous) {
      // honestly idk if this is actually needed, but i'll keep it to be safe !
      await interaction.deferReply({ ephemeral: args.anonymous })
    } else {
      const empty = content == ''
      await interaction.reply({ content: empty ? `<${Emotes.loading}>` : content, allowedMentions})
    }

    const embed = new EmbedBuilder()
      .setTitle(args.title)
      .setDescription(args.content.replaceAll('\\n', '\n'))
      .setColor(args.color)
      .setTimestamp(Date.now())
      .setAuthor({ name: user.globalName ? `${user.globalName} (@${user.username})` : user.username, iconURL: user.avatarURL() ?? undefined})
      .setImage(args.image?.url ?? null)

    // create message in set OR current channel.
    let message: Message;
    if (channel_id && channel_id != interaction.channelId) {
      const channel = await interaction.guild.channels.fetch(channel_id)
      if (!channel || !channel.isTextBased()) return void await interaction.editReply("Could not find a text channel.")
      if (!interaction.guild.members.me?.permissionsIn(channel).has(["SendMessages", "AttachFiles"])) return void await interaction.editReply(`I do not have the permissions \`SendMessages\` and \`AttachFiles\` in <#${channel.id}>`)
      message = await channel.send({ content, embeds: [embed], allowedMentions })
      await interaction.editReply(`Successfully sent ${this.name}${args.anonymous ? " anonymously " : " "}in <#${channel.id}>`)
    } else if (args.anonymous) {
      // this section of code is needed since anonymous petitions must be sent in a separate message.
      const channel = channel_id ? await interaction.guild.channels.fetch(channel_id) : interaction.channel
      if (!channel || !channel.isTextBased() || channel.isDMBased()) return void await interaction.editReply("Could not find a text channel.")
      message = await channel.send({ content, embeds: [embed], allowedMentions })
      await interaction.editReply(`Successfully sent ${this.name} anonymously in <#${channel.id}>`)
    } else {
      message = await interaction.editReply({ content, embeds: [embed], allowedMentions })
    }
    
    // react to the message or add buttons
    if (!args.anonymous_response) {
      if (args.choices) {
        for (let i = 0; i < args.choices; i++)
          await message.react(NUMBERS[i])
      } else {
        await message.react(`<:${Emotes.upvote}>`)
        await message.react(`<:${Emotes.downvote}>`)
      }
    } else {
      // Initialize votes map for database
      const votes = new Map<string, string[]>();
      
      // Initialize vote count for this option
      if (args.choices) {
        for (let i = 0; i < args.choices; i++) {
          votes.set(`${i}`, []);
        }
      } else {
        votes.set("Yes", []);
        votes.set("No", []);
      }

      // Create buttons for anonymous voting
      const rows: ActionRowBuilder<ButtonBuilder>[] = [];
      const buttons = args.choices 
        ? Array.from({ length: args.choices }, (_, i) =>
            new ButtonBuilder()
            .setCustomId(`anon_poll.${message.id}.${args.only_one}.${i}`)
            .setLabel("0")
              .setEmoji(NUMBERS[i])
              .setStyle(ButtonStyle.Secondary)
          )
        : [
            new ButtonBuilder()
            .setCustomId(`anon_poll.${message.id}.${args.only_one}.Yes`)
            .setLabel("0")
            .setEmoji(`<:${Emotes.upvote}>`)
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
            .setCustomId(`anon_poll.${message.id}.${args.only_one}.No`)
            .setLabel("0")
            .setEmoji(`<:${Emotes.downvote}>`)
            .setStyle(ButtonStyle.Secondary)
          ];

      // Auto-split into rows of 5
      for (let i = 0; i < buttons.length; i += 5) {
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(buttons.slice(i, i + 5));
        rows.push(row);
      }

      // Save poll data to MongoDB
      const DAY = 24 * 3600 * 1000;
      const poll = await AnonymousPollSchema.create({ 
        _id: message.id,
        votes: votes,
        expires_at: new Date(Date.now() + 7 * DAY),
      })

      // Update the message with buttons and modified embed
      try {
        await message.edit({ components: rows, embeds: [editEmbed(embed, votes, args.only_one)] });
      } catch (e) {
        console.error(e);
        return;
      }
      // Save only if succeeded
      await poll.save();
    }
  }
}
