import { EventData } from "../declarations";
import Amayi from "./Amayi";

export class BotEvent {
  client: Amayi;
  name: string;

  constructor (client: Amayi, data: EventData) {
    this.client = client
    this.name = data.name
  }

  async run(...args: any[]) {
    throw new Error(`The command "${this.name}" does not provide a run method.`)
  }
}