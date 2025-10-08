import type {
  ChatInputCommandInteraction,
  SharedSlashCommand,
} from "discord.js";

export type SlashCommand = {
  data: SharedSlashCommand;
  execute: (interaction: ChatInputCommandInteraction) => void;
};
