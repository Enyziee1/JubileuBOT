import { Client, GatewayIntentBits } from "discord.js";
import * as fs from "fs";
import type { SlashCommand } from "./commands/ping";

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const loadCommands = async () => {
  const commands = new Array<SlashCommand>();
  const files = fs
    .readdirSync(`${__dirname}/commands/`)
    .filter((file) => file.endsWith(".ts"));

  for (const file of files) {
    const command = (await import(`${__dirname}/commands/${file}`))
      .default as SlashCommand;
    commands.push(command);
  }

  return commands;
};

const commands = await loadCommands();

bot.once("ready", () => {
  console.log("Bot ready!");
});

bot.on("interactionCreate", (interaction) => {
  if (!interaction.isCommand()) return;
});

bot.login(process.env["DISCORD_BOT_TOKEN"]);
