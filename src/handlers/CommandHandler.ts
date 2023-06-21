import fs from "fs"
import path from "path";
import { Command } from "../structures/Command";
import Amayi from "../structures/Amayi";

export default async function build(client: Amayi, dir: string, set = true) {
  if (!client.application) throw new Error(`Could not find client application!`)
  try {
    const filePath = path.join(__dirname, dir);
    const files = await fs.promises.readdir(filePath);
    for (const file of files) {
      const stat = await fs.promises.lstat(path.join(filePath, file))
      if (stat.isDirectory()) await build(client, path.join(dir, file), false);
      if (file.endsWith(".ts") || file.endsWith(".js")) {
        const command = (await import(path.join(filePath, file))).default;
        if (command.prototype instanceof Command) {
          const cmd = new command(client)
          client.commands.set(cmd.name, cmd)
        }
      }
    }
    if (set) {
      const commands = client.commands.filter((value) => !value.guilds).map((value) => value.data)
      client.application.commands.set(commands)
    }
  } catch (e) {
    console.log(e)
  }
}

// client.guilds.cache.get("")?.commands.create()
// client.application?.commands.create()