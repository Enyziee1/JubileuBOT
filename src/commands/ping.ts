import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../helpers/SlashCommand";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Returns the server latency"),
  execute: async (interaction) => {
    await interaction.reply(interaction.client.ws.ping + "ms");
  },
} satisfies SlashCommand;
