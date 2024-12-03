// import { Message } from "discord.js";
// import Amayi from "../../structures/Amayi";
// import ChatCommandEvent from "../../structures/ChatCommandEvent";
// import { getVoiceConnection } from "@discordjs/voice";

// export default class LeaveCommand extends ChatCommandEvent {
//   constructor (client: Amayi) {
//     super(client, "leave")
//   }

//   async runCommand(message: Message<boolean>, args: string[]): Promise<void> {
//     if (!message.guild) return;
//     const connection = getVoiceConnection(message.guild.id)
//     const me = message.guild.members.me;

//     if (!connection || !me || !me.voice.channelId) {
//       await message.reply("im not currently in a voice channel!")
//       return;
//     }

//     const member = message.member;

//     if (!member || !member.voice.channelId) {
//       await message.reply("you need to be in a voice channel to run this command!")
//       return;
//     }

//     if (member.voice.channelId != me.voice.channelId) {
//       await message.reply("you must be in the same voice channel as me to run this command")
//       return;
//     }

//     connection.destroy();
//     await message.reply("i have left the voice channel :c")
//   }
// }