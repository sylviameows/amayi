import { Client, ClientOptions, Collection, Colors } from "discord.js";
import mongoose from "mongoose";
import buildEvents from "../handlers/EventHandler";
import "dotenv/config";
import { Dashboard, Emotes } from "../config";

export default class Amayi extends Client {
  commands: Collection<string, any>
  config: {
    dashboard: typeof Dashboard
    colors: typeof Colors
    emotes: typeof Emotes
  }
  cache: {
    weather: Collection<
      string,
      {
        lastCall: number;
        data: WeatherData;
      }
    >;
  };

  constructor(options: ClientOptions) {
    super(options)

    this.commands = new Collection()
    this.config = {
      dashboard: Dashboard,
      colors: Colors,
      emotes: Emotes
    }
    this.cache = {
      weather: new Collection()
    }
    buildEvents(this, "../events")
  }

  async login() {
    // connect to database here
    const mongoURI = process.env.MONGODB_URI
    if (!mongoURI) throw new Error("Couldn't connect to database.")
    await mongoose.connect(mongoURI).then(() => console.log("Connected to MongoDB.")).catch(err => console.error(err))

    return await super.login(process.env.TOKEN)
  }
}