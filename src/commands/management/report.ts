import { ActionRowBuilder, ApplicationCommandType, ChatInputCommandInteraction, EmbedBuilder, MessageContextMenuCommandInteraction, ModalBuilder, ModalSubmitInteraction, PermissionFlagsBits, TextChannel, TextInputBuilder, TextInputStyle, codeBlock } from "discord.js";
import { Command } from "../../structures/Command";
import Amayi from "../../structures/Amayi";
import { client } from "../..";
import GuildSchema from "../../models/GuildSchema";
import { getFiles } from "../../modules/getFiles";

// this command is all old code, potentially update it later.

const INPUT = new TextInputBuilder()
  .setCustomId("reason")
  .setLabel("Reason (optional):")
  .setStyle(TextInputStyle.Paragraph)
  .setRequired(false)
  .setMaxLength(1000)
  .setPlaceholder("Why are you reporting this message?");
const ROW = new ActionRowBuilder().addComponents(
  INPUT
) as ActionRowBuilder<TextInputBuilder>;
const MODAL = new ModalBuilder()
  .setTitle("Submit a report:")
  .addComponents(ROW);

export default class ReportContext extends Command {
  constructor (client: Amayi) {
    super(client, {
      name: "Report",
      type: ApplicationCommandType.Message
    })
  }

  async run(i: MessageContextMenuCommandInteraction): Promise<void> {
    const filter = (i: ModalSubmitInteraction) =>
      i.customId == `report-${i.user.id}`;

    if (i.guildId == null) {
      return void await i.reply({
        content: "This command can only be used in a server!",
        ephemeral: true,
      });
    }
    // determine if the guild has a report channel set up.
    const settings = (await GuildSchema.findOrCreate(i.guildId)).config;
    if (!i.guild) {
      await i.reply({
        content: "This command can only be used in a server!",
        ephemeral: true,
      });
      return;
    }
    if (!i.guild.members.me) {
      await i.reply({
        content: "I am not in this guild!",
        ephemeral: true,
      });
      return;
    }
    if (!settings || !settings.reporting?.channel_id) {
      await i.reply({
        content: "This guild does not have reports set up!",
        ephemeral: true,
      });
      return;
    }
    const id = settings.reporting?.channel_id as string;
    const channel: TextChannel = (await client.channels.fetch(
      id
    )) as TextChannel;
    if (
      !channel ||
      !channel
        .permissionsFor(i.guild.members.me)
        .has([
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ViewChannel,
        ])
    ) {
      await i.reply({
        content:
          "This guild's reports channel is invalid! Please contact a server administrator.",
        ephemeral: true,
      });
      return;
    }

    await i.showModal(MODAL.setCustomId(`report-${i.user.id}`).toJSON());
    i.awaitModalSubmit({ filter, time: 180_000 })
      .then(async (submit: ModalSubmitInteraction) => {
        await submit.deferReply({ ephemeral: true });
        const reason = submit.fields.getTextInputValue("reason");
        const content =
          i.targetMessage.content == ""
            ? "No message content."
            : i.targetMessage.content;
        const message =
          content.length > 1000
            ? `${content.slice(0, 1000)}... (cont.)`
            : content; // truncate to 1000 characters
        const embed = new EmbedBuilder()
          .setTitle("New Report:")
          .setURL(i.targetMessage.url)
          .setColor(0x2f3136)
          .setAuthor({
            name: i.targetMessage.author.tag,
            iconURL: i.targetMessage.author.avatarURL() ?? undefined,
          })
          .addFields(
            [{
              name: "Report Reason",
              value: reason != "" ? reason : "No reason provided",
              inline: true,
            },{
              name: "Reported User",
              value: `<@${i.targetMessage.author.id}>`,
              inline: true,
            },
            {
              name: "Message Content",
              value: codeBlock(message),
              inline: false,
            }]
          )
          .setFooter({
            text: `Submitted by ${i.user.tag}`,
            iconURL: i.user.avatarURL() ?? undefined,
          })
          .setTimestamp(Date.now());

        // send to reports channel
        const files = getFiles(i.targetMessage);
        await channel.send({
          content: settings.reporting?.role ? `<@&${settings.reporting?.role}>` : undefined, // <@&${settings.get("role_staff")}> (ping staff in the future?)
          embeds: [embed],
          files: files,
          allowedMentions: { parse: ["roles"] }
        });

        // send confirmation
        await submit.editReply({
          content: `Reported! Reason:\n${codeBlock(
            reason == "" ? "No reason provided" : reason
          )}`,
        });
      })
      .catch((e: any) => {
        console.log(e);
        // modal timed out,
        return;
      });
  }
}
