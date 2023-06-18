import { chunk, convertToSeconds } from "./util";

export type VideoWithInfo = {
  title: string;
  duration: number;
  channelName: string;
  description: string;
  id: string;
};

export type VideoId = string;

const KEY = import.meta.env.VITE_GOOGLE_API_KEY;

if (!KEY) throw new Error("No API key provided");

export const getVideoLengthsById = async (
  ids: string[]
): Promise<VideoWithInfo[]> => {
  const token = await getUserToken();

  const responses = chunk(ids, 50).map(async (ids) => {
    const params = new URLSearchParams({
      key: KEY,
      part: "snippet,contentDetails",
      id: ids.join(","),
    });

    return await fetch(
      `https://youtube.googleapis.com/youtube/v3/videos?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    ).then(
      (res) =>
        res.json() as Promise<{
          items: {
            id: string;
            contentDetails: {
              duration: string;
              id: string;
              kind: "youtube#video";
            };
            snippet: {
              channelId: string;
              channelTitle: string;
              description: string;
              title: string;
            };
          }[];
        }>
    );
  });

  const results = (await Promise.all(responses))
    .flat()
    .map<VideoWithInfo[]>((res) =>
      res.items.map((video) => ({
        channelName: video.snippet.channelTitle,
        channelId: video.snippet.channelId,
        description: video.snippet.description,
        duration: convertToSeconds(video.contentDetails.duration),
        id: video.id,
        title: video.snippet.title,
      }))
    )
    .flat();

  console.log(results);
  return results;
};

export async function getUserToken(interactive = false) {
  let token: string;

  try {
    token = (await getToken(interactive)).token;
    console.log("uninteractive", token);
  } catch (e) {
    token = (await getToken(true)).token;
    console.log("interactive", token);
  }

  return token;
}

async function getToken(interactive: boolean) {
  return (await chrome.identity.getAuthToken({ interactive })) as unknown as {
    grantedScopes: string[];
    token: string;
  };
}
