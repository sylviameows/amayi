import dashboard from "../dashboard/dashboard";
import build from "../handlers/CommandHandler";
import { formatDuration } from "../modules/formatTime";
import Amayi from "../structures/Amayi";
import { BotEvent } from "../structures/Event";

export default class InitializeEvent extends BotEvent {
  constructor(client: Amayi) {
    super(client, {
      name: "ready",
      once: true
    })
  }

  async run(): Promise<void> {
    await build(this.client, "../commands")
    
    console.log("Fetching members...")
    for (const [id, guild] of this.client.guilds.cache) {
      await guild.members.fetch()
    }
    console.log("Fetched members.")

    console.log("Successfully deployed commands and logged in as "+this.client.user?.tag ?? "an unknown user.")
    dashboard(this.client)
  }
}