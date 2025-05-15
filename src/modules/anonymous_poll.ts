/**
 * Handles button interactions for anonymous polls
 * Manages vote toggling and embed updates
 */

import { ButtonInteraction, EmbedBuilder } from "discord.js";
import AnonymousPollSchema from "../models/AnonymousPollSchema";

// Define number emojis
const NUMBERS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export function getEmbed(votes: Map<string, string[]>): EmbedBuilder {
  // Get updated vote counts and prepare for display
  const voteResults = new Map<string, number>();
  
  for (const [option, voters] of votes.entries()) {
    voteResults.set(option, voters.length);
  }

  let description = "";
  
  // Handle both numbered options and Yes/No polls
  // TODO: Check if the description is properly ordered
  for (const [option, voters] of votes.entries()) {
    const count = voters.length;

    // Format the label based on the option key
    let label: string;
    if (option === "Yes") {
      label = "👍 Yes";
    } else if (option === "No") {
      label = "👎 No";
    } else {
      // For numbered options
      const index = parseInt(option);
      label = `Option ${NUMBERS[index]}`;
    }

    description += `${label}: ${count} votes\n`;
  }

  return new EmbedBuilder()
    .setTitle("Anonymous Responses")
    .setDescription(description)
    .setTimestamp(Date.now())
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
    // 1. Parse custom_id: "anon_poll.{messageId}.{optionIndex}"
    const [, messageId, optionIndex] = interaction.customId.split(".");
    console.log('ids', interaction.message.id, interaction.customId)

    // 3. Verify the poll exists in database
    const votes = await AnonymousPollSchema.toggleVote(
      interaction.guildId, interaction.channelId, messageId,
      interaction.user.id, optionIndex, 1);

    if (!votes) {
      await closePoll(interaction);
      return;
    }

    // 7. Update the message with the new embed
    await interaction.reply({
      content: "Your vote was received!",
      ephemeral: true
    });

    await interaction.message.edit({ embeds: [
      interaction.message.embeds[0], getEmbed(votes)] });
  } catch (error) {
    console.error("Error handling anonymous poll interaction:", error);
    
    // Handle errors gracefully
    await interaction.reply({
      content: "An error occurred while processing your vote. Please try again later.",
      ephemeral: true
    }).catch(() => {});
  }
}