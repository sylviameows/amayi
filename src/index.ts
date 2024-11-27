import { GatewayIntentBits, Partials } from "discord.js"
import Amayi from "./structures/Amayi";

const { generateDependencyReport } = require('@discordjs/voice');
console.log(generateDependencyReport());

export const client = new Amayi({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction
  ]
});

client.login()

