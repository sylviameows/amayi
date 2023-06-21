import { Message } from "discord.js";

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
          text.endsWith(".webp")
        )
      )
    })
    .concat(message.attachments.map((a) => a.url))

    return urls.map((url) => {
      return { attachment: url }
    })
}