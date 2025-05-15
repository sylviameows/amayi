/**
 * Handles button interactions for anonymous polls
 * Manages vote toggling and embed updates
 */

import { ActionRow, ButtonInteraction, EmbedBuilder, ButtonComponent, Embed, ButtonBuilder, ActionRowBuilder } from "discord.js";
import AnonymousPollSchema from "../models/AnonymousPollSchema";


export function editEmbed(old_embed: EmbedBuilder | Embed, votes: Map<string, string[]>, only_one: Boolean): EmbedBuilder {
  // Get updated vote counts and prepare for display  
  const all_voters: Set<string> = new Set();
  for (const voters of votes.values()) {
    for (const v of voters) all_voters.add(v);
  }

  let description = "";
  const size = all_voters.size;
  if (size == 1) {
    description += `${size} person has voted`
  } else {
    description += `${size} people have voted`
  }

  const embed = EmbedBuilder.from(old_embed)
  // idk how you want to format this
  // if (only_one) embed.setFooter({ text: "Pick only one." })

  return embed;
}

function updateButtons(components: ActionRow<ButtonComponent>[], votes: Map<string, string[]>): ActionRowBuilder<ButtonBuilder>[] {
  function getLabel(customId: string | null): string | null {
    if (customId) {
      const args = customId.split(".");
      const optionIndex = args[args.length - 1];
      const users = votes.get(optionIndex);
      if (users !== undefined) {
        return users.length.toString()
      }
    }
    return null;
  }

  // Create a copy of the existing components
  return components.map(row => {
    return new ActionRowBuilder<ButtonBuilder>()
      .addComponents(...(row.components.map(component => {
        const label = getLabel(component.customId) ?? component.label;
        const b = ButtonBuilder.from(component);
        if (!label) return b;
        b.setLabel(label);
        return b;
      })));
  });
}

async function closePoll(interaction: ButtonInteraction): Promise<void> {
  await interaction.reply({
    content: "This poll has expired.",
    ephemeral: true
  });

  // Create a copy of the existing components
  const components = (interaction.message.components as ActionRow<ButtonComponent>[]).map(row => {
    return new ActionRowBuilder<ButtonBuilder>()
      .addComponents(...(row.components.map(component => {
        const b = ButtonBuilder.from(component);
        b.setDisabled(true)
        return b;
      })));
  })
  // Update the message with the disabled components
  await interaction.message.edit({ components });
}

// Handle button clicks for anonymous polls
export async function onClick(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guildId || !interaction.customId.startsWith("anon_poll.")) return;

  try {
    // Parse custom_id: "anon_poll.{messageId}.{only_one},{optionIndex}"
    const [, , only_one_string, optionIndex] = interaction.customId.split(".");

    // Footer is only set if there's a limit on responses
    const only_one = only_one_string === "true";

    // Verify the poll exists in database
    const resp = await AnonymousPollSchema.toggleVote(
      interaction.message.id, interaction.user.id,
      only_one, optionIndex);

    if (!resp) {
      await closePoll(interaction);
      return;
    }
    const [votes, action] = resp;

    // Update the message with the new embed
    await interaction.reply({
      content: `Your vote was ${action}!`,
      ephemeral: true
    });

    await interaction.message.edit({
      components: updateButtons(interaction.message.components as ActionRow<ButtonComponent>[], votes),
      embeds: [editEmbed(interaction.message.embeds[0], votes, only_one)]
    });
  } catch (error) {
    console.error("Error handling anonymous poll interaction:", error);

    // Handle errors gracefully
    await interaction.reply({
      content: "An error occurred while processing your vote. Please try again later.",
      ephemeral: true
    }).catch(() => { });
  }
}
