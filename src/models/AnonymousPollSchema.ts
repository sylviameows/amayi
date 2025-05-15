import mongoose from "mongoose";

const Schema = mongoose.Schema;

const anonymousPoll = new Schema({
  _id: { type: String, required: true }, // message_id as mongo primary key
  votes: { type: Map, of: [String], required: true },
  expires_at: { type: Date, required: true }
}, {
  statics: {
    async toggleVote(
      message_id: string,
      user_id: string,
      only_one: Boolean,
      optionIndex: string,
    ): Promise<[Map<string, string[]>, string] | null> {
      const poll = await this.findOne({ _id: message_id });
      if (!poll || poll.expires_at < new Date()) return null;

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

export default mongoose.model("AnonymousPolls", anonymousPoll);
