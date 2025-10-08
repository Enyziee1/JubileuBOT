import { REST, Routes } from "discord.js";

import fs from "fs";
import type { SlashCommand } from "./helpers/SlashCommand";

const loadCommands = async () => {
  const commands = [];
  const files = fs
    .readdirSync(`${__dirname}/commands/`)
    .filter((file) => file.endsWith(".ts"));

  for (const file of files) {
    const command = (await import(`${__dirname}/commands/${file}`))
      .default as SlashCommand;
    commands.push(command.data.toJSON());
  }

  return commands;
};

const token = process.env["DISCORD_BOT_TOKEN"];
const clientId = process.env["CLIENT_ID"];
const guildId = process.env["GUILD_ID"];

if (!token || !clientId || !guildId)
  throw new Error(`Missing value for env`, {
    cause: "Missing environment variable",
  });

const rest = new REST().setToken(token);
const data = (await rest.put(
  Routes.applicationGuildCommands(clientId, guildId),
  {
    body: await loadCommands(),
  },
)) as unknown[];

console.log(`Updated ${data.length} commands`);
