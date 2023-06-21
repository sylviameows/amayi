import { Guild } from "discord.js";
import Amayi from "../../structures/Amayi";
import { BotEvent } from "../../structures/Event";
import GuildSchema from "../../models/GuildSchema";

export default class CreateEntry extends BotEvent {
  constructor (client: Amayi) {
    super(client, {
      name: "guildCreate"
    })
  }

  async run(guild: Guild): Promise<void> {
    await GuildSchema.findOrCreate(guild.id)
  }
}