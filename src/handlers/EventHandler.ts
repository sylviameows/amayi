import fs from "fs"
import path from "path";
import Amayi from "../structures/Amayi";
import { BotEvent } from "../structures/Event";

export default async function build(client: Amayi, dir: string) {
  try {
    const filePath = path.join(__dirname, dir);
    const files = await fs.promises.readdir(filePath);
    for (const file of files) {
      const fullPath = path.join(filePath, file);
      const stat = await fs.promises.lstat(fullPath);
      if (stat.isDirectory()) build(client, path.join(dir, file));
      if (file.endsWith(".ts") || file.endsWith(".js")) {
        const event = (await import(fullPath)).default;
        if (event === undefined) {
          console.error(`Failed to import ${fullPath}`);
        } else if (event.prototype instanceof BotEvent) {
          const ev = new event(client)
          if (ev.once) {
            client.once(ev.name, ev.run.bind(ev))
          } else {
            client.on(ev.name, ev.run.bind(ev))
          }
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
}

// client.guilds.cache.get("")?.commands.create()
// client.application?.commands.create()