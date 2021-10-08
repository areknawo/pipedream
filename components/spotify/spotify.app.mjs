import axios from "axios";
import lodash from "lodash";
import { promisify } from "util";
import {
  ITEM_TYPES,
  ITEM_TYPES_RESULT_NAME,
} from "./consts.mjs";

const pause = promisify((delay, fn) => setTimeout(fn, delay));

export default {
  type: "app",
  app: "spotify",
  propDefinitions: {
    market: {
      type: "string",
      label: "Market",
      description: "An [ISO 3166-1 alpha-2 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2). Synonym for country. Example: `US` for `United States of America`",
    },
    tracks: {
      type: "string[]",
      label: "Tracks",
      description: "An array of objects containing [Spotify URIs](https://developer.spotify.com/documentation/web-api/#spotify-uris-and-ids) of the tracks or episodes to remove. For example: `spotify:track:4iV5W9uYEdYUVa79Axb7Rh`. A maximum of 100 objects can be sent at once.",
    },
    trackId: {
      type: "string",
      label: "Track ID",
      description: "The [Spotify ID](https://developer.spotify.com/documentation/web-api/#spotify-uris-and-ids) for the track. For example: `4iV5W9uYEdYUVa79Axb7Rh`. You can also type the track name, we can find it for you :)",
      useQuery: true,
      async options({ query }) {
        const tracks = await this.getItems(ITEM_TYPES.TRACK, query);
        if (!tracks) {
          return {
            options: [],
          };
        }

        return {
          options: tracks.map((track) => ({
            label: this.getTrackNameWithArtists(track),
            value: track.id,
          })),
        };
      },
    },
    artistId: {
      type: "string",
      label: "Artist ID",
      description: "The [Spotify ID](https://developer.spotify.com/documentation/web-api/#spotify-uris-and-ids) for the artist. For example: `43ZHCT0cAZBISjO8DG9PnE`.",
      useQuery: true,
      async options({ query }) {
        const artists = await this.getItems(ITEM_TYPES.ARTIST, query);
        if (!artists) {
          return {
            options: [],
          };
        }

        return {
          options: artists.map((artist) => ({
            label: artist.name,
            value: artist.id,
          })),
        };
      },
    },
    playlistId: {
      type: "string",
      label: "Playlist ID",
      description: "The [Spotify ID](https://developer.spotify.com/documentation/web-api/#spotify-uris-and-ids) for the playlist",
      async options() {
        const playlists = await this.getPlaylists();
        if (!playlists) {
          return {
            options: [],
          };
        }

        return {
          options: playlists.map((playlist) => ({
            label: playlist.name,
            value: playlist.id,
          })),
        };
      },
    },
  },
  methods: {
    _getAxiosParams(opts) {
      return {
        ...opts,
        url: this._getBaseUrl() + opts.path,
        headers: this._getHeaders(),
      };
    },
    _getBaseUrl() {
      return "https://api.spotify.com/v1";
    },
    _getHeaders() {
      return {
        Authorization: `Bearer ${this.$auth.oauth_access_token}`,
      };
    },
    _getQuery(params) {
      if (!params) {
        return "";
      }

      let query = "?";
      const keys = Object.keys(params);
      for (let i = 0; i < keys.length; i++) {
        // Explicity looking for nil values to avoid false negative for Boolean(false)
        if (!lodash.isNil(params[keys[i]])) {
          query += `${keys[i]}=${params[keys[i]]}&`;
        }
      }

      // It removes the last string char, it can be ? or &
      return query.substr(0, query.length - 1);
    },
    getTrackNameWithArtists(track) {
      if (!track) {
        return "";
      }

      if (!track.artists || !track.artists[0]) {
        return `${track.name} [Unknown Artist]`;
      }

      const artists = track.artists.map((artist) => artist.name).join(", ");
      return `${track.name} [${artists}]`;
    },
    async _makeRequest(method, endpoint, params) {
      const config = {
        method,
        url: `${await this._getBaseUrl()}${endpoint}`,
        headers: await this._getHeaders(),
        params,
      };
      return await this.retry(config);
    },
    // Retry axios request if not successful
    async retry(config, retries = 3) {
      let response;
      try {
        response = await axios(config);
        return response;
      } catch (err) {
        if (retries <= 1) {
          throw new Error(err);
        }
        // if rate limit is exceeded, Retry-After will contain the # of seconds
        // to wait before retrying
        const delay = (response && response.status == 429)
          ? (response.headers["Retry-After"] * 1000)
          : 500;
        await pause(delay);
        return this.retry(config, retries - 1);
      }
    },
    async getItems(type, q) {
      if (!Object.values(ITEM_TYPES).includes(type)) {
        throw new Error("Invalid item type");
      }
      if (!q) {
        return null;
      }
      const query = this._getQuery({
        limit: 50,
        type,
        q: encodeURI(q),
      });
      const res = await this._makeRequest("GET", `/search${query}`);
      return lodash.get(res, `data.${ITEM_TYPES_RESULT_NAME[type]}.items`, null);
    },
    async getPlaylists() {
      const res = await this._makeRequest("GET", "/me/playlists");
      return lodash.get(res, "data.items", null);
    },
    async getTrackById(id, market) {
      if (!id) {
        return null;
      }

      const query = this._getQuery({
        id,
        market,
      });

      const res = await this._makeRequest("GET", `/tracks/${id}${query}`);
      return lodash.get(res, "data.items", null);
    },
  },
};
