import {
  BaseInteraction,
  ChatInputCommandInteraction,
  Client,
  GatewayIntentBits,
  type ChatInputApplicationCommandData,
} from "discord.js";
import * as fs from "fs";
import type { SlashCommand } from "./helpers/SlashCommand";
import { CookieMap } from "bun";

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

bot.once("clientReady", () => {
  console.log("Bot ready!");
});

bot.on("interactionCreate", async (interaction) => {
  console.log("Received an interaction");

  if (!interaction.isCommand()) return;

  const command = commands.find((c) => c.data.name == interaction.commandName);

  const t1 = performance.now();
  await command?.execute(interaction as ChatInputCommandInteraction);
  const t2 = performance.now();
  console.log(`Interaction took ${t2 - t1}ms to run`);
});

bot.login(process.env["DISCORD_BOT_TOKEN"]);
