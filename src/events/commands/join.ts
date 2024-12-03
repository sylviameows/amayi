// import { Message } from "discord.js";
// import Amayi from "../../structures/Amayi";
// import ChatCommandEvent from "../../structures/ChatCommandEvent";
// import { getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";

// export default class JoinCommand extends ChatCommandEvent {
//   constructor (client: Amayi) {
//     super(client, "join")
//   }

//   async runCommand(message: Message<boolean>, args: string[]): Promise<void> {
//     if (!message.guild) return;
//     let connection = getVoiceConnection(message.guild.id)
//     const me = message.guild.members.me;

//     if (connection || !me || me.voice.channelId) {
//       await message.reply("im already in a voice channel, run the `switch` command instead!")
//       return;
//     }

//     const member = message.member;

//     if (!member || !member.voice.channelId) {
//       await message.reply("you need to be in a voice channel to run this command!")
//       return;
//     }

//     connection = joinVoiceChannel({
//       channelId: member.voice.channelId,
//       guildId: message.guild.id,
//       adapterCreator:  message.guild.voiceAdapterCreator
//     })

//   }
// }