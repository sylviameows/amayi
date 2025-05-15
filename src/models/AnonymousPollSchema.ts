import mongoose from "mongoose";


const Schema = mongoose.Schema;

const anonymousPoll = new Schema({
  message_id: { type: String, required: true },
  guild_id: { type: String, required: true },
  channel_id: { type: String, required: true },
  votes: { type: Map, of: [String], required: true }
},{
  statics: {
    async toggleVote(guild_id: string, channel_id: string, message_id: string, userId: string, optionIndex: string, limit_vote: number): Promise<Map<string, string[]> | null> {      // Return null if expired (no record in db)
      const p = await this.findOne({ guild_id, channel_id, message_id });
      if (!p) return null;

      // Check if user already voted for this option
      const userVotedForOption = p.votes.get(optionIndex)?.includes(userId);
      let action: "added" | "removed" = "added";
      
      // Remove vote from all options first (to ensure one vote per user)
      if (limit_vote > 0) {
        for (const [option, voters] of p.votes.entries()) {
          p.votes.set(option, voters.filter((voterId: string) => voterId !== userId));
        }
      }

      // Add vote to selected option (unless user is removing their vote)
      if (!userVotedForOption) {
        const optionVoters = p.votes.get(optionIndex) || [];
        optionVoters.push(userId);
        p.votes.set(optionIndex, optionVoters);
      } else {
        action = "removed";
      }
      
      p.markModified("votes");
      await p.save()
      console.log(userId, optionIndex, action);
      return p.votes;
    }
  }
});

;

// Create indexes for efficient lookups
anonymousPoll.index({ guild_id: 1, message_id: 1 });

export default mongoose.model("AnonymousPolls", anonymousPoll);
