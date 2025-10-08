import {
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel,
  NoSubscriberBehavior,
} from "@discordjs/voice";
import { GuildMember, SlashCommandBuilder } from "discord.js";
import { Readable } from "stream";
import type { SlashCommand } from "../helpers/SlashCommand";
import { youtubeDl, type Payload } from "youtube-dl-exec";
import { Player } from "../helpers/Player";

const players = new Map<string, Player>();

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Starts playing or add to a playlist")
    .addStringOption((option) =>
      option
        .setName("link")
        .setDescription("A youtube link for a video/song")
        .setRequired(true),
    ),

  execute: async (interaction) => {
    const userYtLink = interaction.options.getString("link")!;

    await interaction.deferReply();

    const member = interaction.member as GuildMember;
    if (!member.voice.channel) {
      return await interaction.reply("Must be in a voice channel");
    }

    const player = !players.get(interaction.guildId!)
      ? new Player()
      : players.get(interaction.guildId!)!;

    if (!player.onVoiceChannel) {
      player.joinVoiceChannel(
        member.voice.channelId!,
        interaction.guildId!,
        interaction.guild?.voiceAdapterCreator!,
      );
    }

    const info = await player.play(userYtLink);

    try {
      await interaction.editReply({ content: "Okay" });
    } catch (err) {
      console.error("failed to respond", err);
    }
  },
} satisfies SlashCommand;
