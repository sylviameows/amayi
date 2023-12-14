import { Message, time } from "discord.js";
import Amayi from "../../structures/Amayi";
import ChatCommandEvent from "../../structures/ChatCommandEvent";
import weather from "../../modules/weather/weather";

export default class NowCommand extends ChatCommandEvent {
  constructor (client: Amayi) {
    super(client, "weather", ["w"])
  }

  async runCommand(message: Message<boolean>, args: string[]): Promise<void> {
    if (args.length < 1) return
    await weather(args.join(' '), message)
  }
}