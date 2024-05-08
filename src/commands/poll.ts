import Amayi from "../structures/Amayi";
import PetitionCommand from "./petition";

export default class PollCommand extends PetitionCommand {
  constructor(client: Amayi) {
    super(client, "poll")
  }
}