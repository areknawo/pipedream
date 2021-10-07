import spotify from "../../spotify.app.mjs";

export default {
  name: "Remove Items from a Playlist",
  description: "Remove one or more items from a user’s playlist. [See the docs here](https://developer.spotify.com/documentation/web-api/reference/#endpoint-remove-tracks-playlist)",
  key: "spotify-remove-items-from-playlist",
  version: "0.0.5",
  type: "action",
  props: {
    spotify,
    playlistId: {
      propDefinition: [
        spotify,
        "playlistId",
      ],
    },
    tracks: {
      type: "string[]",
      label: "Tracks",
      description: "An array of objects containing [Spotify URIs](https://developer.spotify.com/documentation/web-api/#spotify-uris-and-ids) of the tracks or episodes to remove. For example: `spotify:track:4iV5W9uYEdYUVa79Axb7Rh`. A maximum of 100 objects can be sent at once.",
    },
    snapshotId: {
      type: "string",
      label: "Snapshot ID",
      description: "The playlist’s snapshot ID against which you want to make the changes. The API will validate that the specified items exist and in the specified positions and make the changes, even if more recent changes have been made to the playlist.",
      optional: true,
    },
  },
  async run({ $ }) {
    const {
      playlistId,
      tracks,
      snapshotId,
    } = this;

    const data = {
      tracks: tracks.map((track) => ({
        uri: track,
      })),
      snapshot_id: snapshotId,
    };

    return this.spotify._makeRequest($, {
      method: "DELETE",
      path: `/playlists/${playlistId}/tracks`,
      data,
    });
  },
};