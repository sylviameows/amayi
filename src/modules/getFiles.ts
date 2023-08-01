import { Message } from "discord.js";

const fileExt = new RegExp(/\.(?!.*\.)/g)

export function getFiles(message: Message) {
  // get all attachments sent through urls then add any additional discord attachments.
  const urls: string[] = message.content
    .split(" ")
    .filter((text) => {
      return (
        text.startsWith("https://") && (
          text.endsWith(".png") ||
          text.endsWith(".jpg") ||
          text.endsWith(".gif") ||
          text.endsWith(".webp") ||
          text.endsWith(".mp4") ||
          text.endsWith(".mov") ||
          text.endsWith(".webm") ||
          text.endsWith(".mp3")
        )
      )
    })
    .concat(message.attachments.map((a) => a.url))

    return urls.map((url) => {
      return { 
        attachment: url,
        embed: ["png", "jpg", "gif", "webp"].includes(url.split(fileExt).pop() ?? "")
       }
    })
}