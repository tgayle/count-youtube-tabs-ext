import { VideoId, VideoWithInfo, getVideoLengthsById } from "./api";

export class VideoFetcher {
  private videoInfo: Map<VideoId, VideoWithInfo> = new Map();

  get totalRuntime() {
    return this.videoInfo.values().reduce((total, video) => {
      return total + video.duration;
    }, 0);
  }

  get videoDataById(): Record<VideoId, VideoWithInfo> {
    return Object.fromEntries(this.videoInfo.entries());
  }

  getVideoLength(videoId: VideoId) {
    return this.videoInfo.get(videoId)?.duration ?? 0;
  }

  removeVideo(...videoIds: VideoId[]) {
    videoIds.forEach((videoId) => this.videoInfo.delete(videoId));
  }

  async onNewVideo(...videoIds: VideoId[]) {
    try {
      const actualVideos = videoIds.filter((id) => !this.videoInfo.has(id));

      if (actualVideos.length) {
        const videoLengths = await getVideoLengthsById(actualVideos);
        for (const video of videoLengths) {
          this.videoInfo.set(video.id, video);
        }
        console.log("Updated videos", actualVideos);
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e };
    }
  }
}
