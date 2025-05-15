/**
 * Handles button interactions for anonymous polls
 * Manages vote toggling and embed updates
 */

import { ButtonInteraction, EmbedBuilder } from "discord.js";
import AnonymousPollSchema from "../models/AnonymousPollSchema";
import { Emotes } from "../config";

// Define number emojis
const NUMBERS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export function getEmbed(votes: Map<string, string[]>, only_one: Boolean): EmbedBuilder {
  // Get updated vote counts and prepare for display
  const voteResults = new Map<string, number>();
  
  const all_voters: Set<string> = new Set();
  for (const [option, voters] of votes.entries()) {
    voteResults.set(option, voters.length);
    for (const v of voters) all_voters.add(v);
  }

  let description = "";
  
  // Handle both numbered options and Yes/No polls
  for (const [option, voters] of votes.entries()) {
    const count = voters.length;

    // Format the label based on the option key
    let label: string;
    if (option === "Yes") {
      label = `<:${Emotes.upvote}>`;
    } else if (option === "No") {
      label = `<:${Emotes.downvote}>`;
    } else {
      // For numbered options
      const index = parseInt(option);
      label = NUMBERS[index];
    }

    description += `${label}: ${count}\n`;
  }

  const size = all_voters.size;
  if (size > 1) {
    description += `${size} people have voted.`;
  } else if (size == 1) {
    description += `One person has voted.`
  } else {
    description += `No one has voted.`
  }

  const embed = new EmbedBuilder()
    .setTitle("Responses (Not anonymous yet; still WIP)")
    .setDescription(description)
    .setTimestamp(Date.now())

  if (only_one) embed.setFooter({ text: "Pick only one." })

  return embed;
}

async function closePoll(interaction: ButtonInteraction): Promise<void> {
  await interaction.reply({
    content: "This poll has expired.",
    ephemeral: true
  });

  // If there's still buttons clear them
  console.log('Message components')
  console.log(interaction.message.components)
  if (interaction.message.components.length > 0)
    await interaction.message.edit({components: []});
}

// Handle button clicks for anonymous polls
export async function onClick(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guildId || !interaction.customId.startsWith("anon_poll.")) return;

  try {
    // Parse custom_id: "anon_poll.{messageId}.{optionIndex}"
    const [, , optionIndex] = interaction.customId.split(".");

    // Footer is only set if there's a limit on responses
    const only_one = interaction.message.embeds[1].footer !== null;

    // Verify the poll exists in database
    const resp = await AnonymousPollSchema.toggleVote(
      interaction.channelId, interaction.message.id,
      interaction.user.id, optionIndex, only_one);

    console.log('resp', resp)
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

    await interaction.message.edit({ embeds: [
      interaction.message.embeds[0], getEmbed(votes, only_one)] });
  } catch (error) {
    console.error("Error handling anonymous poll interaction:", error);
    
    // Handle errors gracefully
    await interaction.reply({
      content: "An error occurred while processing your vote. Please try again later.",
      ephemeral: true
    }).catch(() => {});
  }
}