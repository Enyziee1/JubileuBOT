import {
  GuildMember,
  SlashCommandBuilder,
  VoiceChannel,
  VoiceConnectionStates,
} from "discord.js";
import type { SlashCommand } from "../helpers/SlashCommand";
import Innertube, { UniversalCache } from "youtubei.js";
import {
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel,
  NoSubscriberBehavior,
} from "@discordjs/voice";

import { Readable } from "stream";

const yt = await Innertube.create({
  cache: new UniversalCache(true, "./cache"),
  enable_session_cache: true,
  player_id: "0004de42",
});

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
    const videoId = extractVideoId(userYtLink);

    if (!videoId) {
      await interaction.reply("Invalid youtube ID");
      return;
    }

    const member = interaction.member as GuildMember;
    if (!member.voice.channel) {
      await interaction.reply("Must be in a voice channel");
      return;
    }

    if (!getVoiceConnection(interaction.guildId!)) {
      console.log("Not yet in a voice channel, joining");
      const conn = joinVoiceChannel({
        adapterCreator: interaction.guild?.voiceAdapterCreator!,
        channelId: member.voice.channelId!,
        guildId: interaction.guildId!,
      });

      conn.on("error", (err) => {
        console.error("Something gone wrong, destroying connection", err);
        conn.destroy();
      });
    }

    const video = await yt.getInfo(videoId);
    const stream = await video.download({
      client: "ANDROID",
      type: "audio",
    });

    const player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
      debug: true,
    });

    player.on("error", (err) => console.error("Some player error", err));
    player.on("debug", (msg) => console.debug("[PLAYER]", msg));

    getVoiceConnection(interaction.guildId!)?.subscribe(player);

    const resource = createAudioResource(Readable.from(stream));
    player.play(resource);

    await interaction.reply("Okay");
  },
} satisfies SlashCommand;

function extractVideoId(url: string) {
  if (!url || typeof url !== "string") return null;

  // Handle youtu.be shorthand
  if (url.includes("youtu.be/")) {
    return url.split("youtu.be/")[1]?.split("?")[0]?.split("&")[0] || null;
  }

  // Handle full YouTube URLs
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("v") || null;
  } catch {
    return null; // Invalid URL
  }
}
