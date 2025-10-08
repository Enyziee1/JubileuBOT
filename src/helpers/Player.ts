import {
  AudioPlayer,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
  type DiscordGatewayAdapterCreator,
} from "@discordjs/voice";
import { Readable } from "stream";
import youtubeDl, { type Payload } from "youtube-dl-exec";

type Media = {
  url: string;
  title: string;
  duration: number;
};

export class Player {
  playlist = new Array<string>();
  playing?: string;
  onVoiceChannel = false;

  private discordVoiceConnection?: VoiceConnection;
  private discordAudioPlayer?: AudioPlayer;

  public async play(url: string) {
    const videoId = extractYTVideoId(url);
    if (!videoId)
      throw new Error(
        "Could not find the video yt, is this really a youtube link?",
      );

    // just add to the playlist and fetch some data to inform the user
    if (this.playing) {
      this.playlist.push(videoId);
      return;
    }

    const stream = await streamFromYoutube(videoId);
    const resource = createAudioResource(Readable.from(stream));

    if (!this.discordAudioPlayer) {
      this.createAudioPlayer();
    }

    this.discordAudioPlayer?.play(resource);
  }

  public pause() {}

  public skip() {}

  public stop() {}

  public joinVoiceChannel(
    channelId: string,
    guildId: string,
    adapter: DiscordGatewayAdapterCreator,
  ) {
    const conn = joinVoiceChannel({
      adapterCreator: adapter,
      channelId: channelId,
      guildId: guildId,
    });

    conn.on("error", (err) => {
      this.onVoiceChannel = false;

      console.error("Something gone wrong with vc connection", err);
      conn.destroy();
    });

    this.onVoiceChannel = true;
    this.discordVoiceConnection = conn;
  }

  public createAudioPlayer() {
    if (!this.discordVoiceConnection)
      throw new Error(
        "Cannot create a audio player without a voice connection",
      );

    const player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });

    player.on("error", (err) => console.error("Some player error", err));
    player.on("debug", (msg) => console.debug("[PLAYER]", msg));

    this.discordVoiceConnection.subscribe(player);
    this.discordAudioPlayer = player;
  }
}

async function streamFromYoutube(videoId: string) {
  const infoRaw = await youtubeDl(
    `https://www.youtube.com/watch?v=${videoId}`,
    {
      dumpSingleJson: true,
      noWarnings: true,
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

  return response.body;
}

function extractYTVideoId(url: string) {
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
