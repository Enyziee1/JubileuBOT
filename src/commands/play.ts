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
import youtubedl, { youtubeDl, type Payload } from "youtube-dl-exec";

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
    await interaction.deferReply();

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

    const infoRaw = await youtubeDl(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        dumpSingleJson: true,
        // noWarnings: true,

        format: "bestaudio[ext=m4a]/bestaudio",
      },
    );

    const decoded =
      typeof infoRaw == "string"
        ? (JSON.parse(infoRaw) as Payload & { url?: string })
        : (infoRaw as Payload & { url?: string });

    const streamUrl = decoded.url;
    if (!streamUrl) throw new Error("No audio stream URL found");

    const response = await fetch(streamUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok || !response.body)
      throw new Error("Failed to fetch audio stream");

    const player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
      debug: true,
    });

    player.on("error", (err) => console.error("Some player error", err));
    player.on("debug", (msg) => console.debug("[PLAYER]", msg));

    getVoiceConnection(interaction.guildId!)?.subscribe(player);

    const resource = createAudioResource(Readable.from(response.body));
    player.play(resource);

    try {
      await interaction.reply({ content: "Okay" });
    } catch (err) {
      console.error("failed to respond", err);
    }
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
