// import { bold, Message } from "discord.js";
// import Amayi from "../../structures/Amayi";
// import ChatCommandEvent from "../../structures/ChatCommandEvent";
// import { AudioResource, createAudioPlayer, createAudioResource, getVoiceConnection, joinVoiceChannel, NoSubscriberBehavior } from "@discordjs/voice";
// import play from "play-dl"

// const URL_REGEX = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g

// export default class PlayCommand extends ChatCommandEvent {
//   constructor (client: Amayi) {
//     super(client, "play")
//   }

//   async runCommand(message: Message<boolean>, args: string[]): Promise<void> {
//     if (!message.guild) return;
//     let connection = getVoiceConnection(message.guild.id)
//     const me = message.guild.members.me;

//     const member = message.member;
//     if (!member || !member.voice.channelId) {
//       await message.reply("you need to be in a voice channel to run this command!")
//       return;
//     }

//     if (!connection || !me || !me.voice.channelId) {
//       connection = joinVoiceChannel({
//         channelId: member.voice.channelId,
//         guildId: message.guild.id,
//         adapterCreator: message.guild.voiceAdapterCreator
//       })
//     } else if (member.voice.channelId != me.voice.channelId) {
//       await message.reply("you must be in the same voice channel as the bot to play a song.")
//       return
//     }

//     const player = createAudioPlayer(
//       {
//         behaviors: {
//           noSubscriber: NoSubscriberBehavior.Play,
//         },
//       }
//     )
//     let response = ""
//     if (URL_REGEX.test(args[0])) {
//       let stream = await play.stream(args[0])
//       let info = await play.video_info(args[0])

//       response = `\`${info.video_details.title}\` is now playing.`

//       const resource = createAudioResource(stream.stream, {
//         inputType: stream.type
//       })

//       player.play(resource)
//     } else {
//       const query = args.join(" ")
//       if (query == "") {
//         message.reply(bold("!")+" Missing arguments!")
//         return
//       }

//       const info = await play.search(query, {
//         limit: 1
//       })

//       let stream = await play.stream(info[0].url)

//       response = `\`${info[0].title}\` is now playing.`

//       const resource = createAudioResource(stream.stream, {
//         inputType: stream.type
//       })

//       player.play(resource)
//     }

//     connection.subscribe(player)
//     message.reply(response)
//   }
// }