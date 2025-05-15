import mongoose from "mongoose";

const Schema = mongoose.Schema;

const anonymousPoll = new Schema({
  message_id: { type: String, required: true },
  channel_id: { type: String, required: true },
  votes: { type: Map, of: [String], required: true },
  created_at: { type: Date, default: Date.now, expires: 604800 } // Auto-delete after 7 days
},{
  statics: {
    async toggleVote(
      channel_id: string,
      message_id: string,
      user_id: string,
      optionIndex: string,
      only_one: boolean
    ): Promise<[Map<string, string[]>, string] | null> {
      const poll = await this.findOne({ channel_id, message_id });
      if (!poll) return null;

      // Ensure votes map is initialized properly
      const votes = poll.votes;
      if (!votes.has(optionIndex)) {
        votes.set(optionIndex, []);
      }

      const currentVoters = votes.get(optionIndex) ?? [];
      const hasVoted = currentVoters.includes(user_id);

      if (hasVoted) {
        // Remove vote
        votes.set(optionIndex, currentVoters.filter(voter => voter !== user_id));
        await poll.save();
        return [votes, "removed"];
      }

      if (only_one) {
        // For single-choice polls, remove user's vote from all other options
        for (const [option, voters] of votes) {
          if (option !== optionIndex && voters.includes(user_id)) {
            votes.set(option, voters.filter(voter => voter !== user_id));
          }
        }
      }

      // Add new vote
      votes.set(optionIndex, [...currentVoters, user_id]);
      poll.markModified('votes')
      await poll.save();
      return [votes, "added"];
    }
  }
});

// Create indexes for efficient lookups
anonymousPoll.index({ channel_id: 1, message_id: 1 });

export default mongoose.model("AnonymousPolls", anonymousPoll);
