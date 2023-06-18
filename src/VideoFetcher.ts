import { VideoId, VideoWithInfo, getVideoLengthsById } from "./api";

export class VideoFetcher {
  private videoInfo: Record<VideoId, VideoWithInfo> = {};

  get totalRuntime() {
    return Object.values(this.videoInfo).reduce((total, video) => {
      return total + video.duration;
    }, 0);
  }

  get videoDataById() {
    return this.videoInfo;
  }

  getVideoLength(videoId: VideoId) {
    return this.videoInfo[videoId]?.duration ?? 0;
  }

  removeVideo(videoId: VideoId) {
    delete this.videoInfo[videoId];
  }

  async onNewVideo(...videoIds: VideoId[]) {
    try {
      const actualVideos = videoIds.filter((id) => !this.videoInfo[id]);

      if (actualVideos.length) {
        const videoLengths = await getVideoLengthsById(actualVideos);
        for (const video of videoLengths) {
          this.videoInfo[video.id] = video;
        }
        console.log("Updated videos", actualVideos);
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e };
    }
  }
}
