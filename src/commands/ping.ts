import {
  BaseInteraction,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

export type SlashCommand = {
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction) => Promise<void>;
};

export default {
  data: new SlashCommandBuilder().setName("albion"),
  execute: async (interaction) => {
    await interaction.reply("Test");
  },
} satisfies SlashCommand;
