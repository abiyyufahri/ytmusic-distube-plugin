import { DisTubeError, checkInvalidKey, ExtractorPlugin, Song, Playlist } from 'distube';
import YTMusic from 'ytmusic-api';
import ytdl from '@distube/ytdl-core';

/**
 * YouTube Music plugin for DisTube
 * @class YouTubeMusicPlugin
 * @extends ExtractorPlugin
 */
class YouTubeMusicPlugin extends ExtractorPlugin {
  constructor(options = {}) {
    super();
    this.options = {
      emitEventsAfterFetching: true,
      fetchBeforeQueued: false,
      parallel: true,
      maxViews: 10,
      ...options,
    };

    checkInvalidKey(
      this.options,
      ["emitEventsAfterFetching", "fetchBeforeQueued", "parallel", "maxViews"],
      "YouTubeMusicPlugin",
    );
    this.ytmusic = new YTMusic();
  }

  /**
   * Initialize the plugin
   * @param {DisTube} distube DisTube
   * @returns {void}
   */
  async init(distube) {
    this.distube = distube;
    this.distube.options.ytdlOptions = {
      ...this.distube.options.ytdlOptions,
    };

    try {
      await this.ytmusic.initialize({});
      console.log("YouTube Music API initialized successfully");
    } catch (error) {
      console.error("Failed to initialize YouTube Music API:", error);
      throw new DisTubeError("YTMUSIC_PLUGIN_ERROR", "Failed to initialize YouTube Music API");
    }
  }

  /**
   * Plugin name
   * @type {string}
   */
  get name() {
    return "YouTubeMusic";
  }

  /**
   * Check if the url is supported by this plugin
   * @param {string} url URL to check
   * @returns {boolean}
   */
  validate(url) {
    return (
      typeof url === "string" &&
      (url.includes("music.youtube.com") ||
        url.includes("youtube.com/playlist") ||
        url.includes("/album/") ||
        url.includes("/artist/") ||
        ytdl.validateURL(url))
    );
  }

  /**
   * Extract ID from YouTube Music URLs
   * @param {string} url URL to extract ID from
   * @returns {Object} Object containing ID type and ID value
   * @private
   */
  extractId(url) {
    let type = 'video';
    let id = null;

    // Extract playlist ID
    if (url.includes("/playlist") || url.includes("list=")) {
      type = 'playlist';
      const match = url.match(/[?&]list=([^&]+)/);
      id = match ? match[1] : null;
    } 
    // Extract album ID
    else if (url.includes("/album/")) {
      type = 'album';
      const match = url.match(/\/album\/([^?/]+)/);
      id = match ? match[1] : null;
    } 
    // Extract artist ID
    else if (url.includes("/artist/")) {
      type = 'artist';
      const match = url.match(/\/artist\/([^?/]+)/);
      id = match ? match[1] : null;
    } 
    // Extract video ID
    else if (url.includes("/watch") || ytdl.validateURL(url)) {
      type = 'video';
      try {
        id = ytdl.getVideoID(url);
      } catch (e) {
        id = null;
      }
    }

    return { type, id };
  }

  /**
   * Resolve the validated url to a Song or a Playlist
   * @param {string} url URL
   * @param {ResolveOptions} options Optional options
   * @returns {Promise<Song | Playlist>}
   */
  async resolve(url, options = {}) {
    if (!url) {
      throw new DisTubeError("INVALID_TYPE", ["string", "undefined"], url, "url");
    }

    const { type, id } = this.extractId(url);
    
    if (!id) {
      throw new DisTubeError("YTMUSIC_PLUGIN_ERROR", "Could not extract ID from URL");
    }

    try {
      switch (type) {
        case 'playlist':
          const playlistInfo = await this.ytmusic.getPlaylist(id);
          if (!playlistInfo || !playlistInfo.tracks) {
            throw new DisTubeError("YTMUSIC_PLUGIN_ERROR", "Could not fetch playlist information");
          }
          
          const playlistTracks = playlistInfo.tracks.slice(0, this.options.maxViews);
          const playlistSongs = await this.processPlaylistTracks(playlistTracks, options);
          
          if (!playlistSongs || playlistSongs.length === 0) {
            throw new DisTubeError("YTMUSIC_PLUGIN_ERROR", "No playable songs found in playlist");
          }
          
          const playlist = new Playlist({
            source: "youtube-music",
            id: id,
            name: playlistInfo.title || "Unknown Playlist",
            url: url,
            thumbnail: playlistInfo.thumbnails && playlistInfo.thumbnails.length > 0
              ? playlistInfo.thumbnails[playlistInfo.thumbnails.length - 1].url
              : null,
            songs: playlistSongs,
            member: options.member || null
          }, options);
          
          return playlist;
          
        case 'album':
          const albumInfo = await this.ytmusic.getAlbum(id);
          if (!albumInfo || !albumInfo.tracks) {
            throw new DisTubeError("YTMUSIC_PLUGIN_ERROR", "Could not fetch album information");
          }
          
          const albumTracks = albumInfo.tracks.slice(0, this.options.maxViews);
          const albumSongs = await this.processPlaylistTracks(albumTracks, options);
          
          if (!albumSongs || albumSongs.length === 0) {
            throw new DisTubeError("YTMUSIC_PLUGIN_ERROR", "No playable songs found in album");
          }
          
          const album = new Playlist({
            source: "youtube-music",
            id: id,
            name: albumInfo.title || "Unknown Album",
            url: url,
            thumbnail: albumInfo.thumbnails && albumInfo.thumbnails.length > 0
              ? albumInfo.thumbnails[albumInfo.thumbnails.length - 1].url
              : null,
            songs: albumSongs,
            member: options.member || null
          }, options);
          
          return album;
          
        case 'artist':
          const artistInfo = await this.ytmusic.getArtist(id);
          if (!artistInfo || !artistInfo.songs || !Array.isArray(artistInfo.songs)) {
            throw new DisTubeError("YTMUSIC_PLUGIN_ERROR", "Could not fetch artist information");
          }
          
          const artistTracks = artistInfo.songs.slice(0, this.options.maxViews);
          const artistSongs = await this.processPlaylistTracks(artistTracks, options);
          
          if (!artistSongs || artistSongs.length === 0) {
            throw new DisTubeError("YTMUSIC_PLUGIN_ERROR", "No playable songs found for artist");
          }
          
          const artist = new Playlist({
            source: "youtube-music",
            id: id,
            name: artistInfo.name || "Unknown Artist",
            url: url,
            thumbnail: artistInfo.thumbnails && artistInfo.thumbnails.length > 0
              ? artistInfo.thumbnails[artistInfo.thumbnails.length - 1].url
              : null,
            songs: artistSongs,
            member: options.member || null
          }, options);
          
          return artist;
          
        case 'video':
          // Use ytdl-core to get detailed info for single video
          const info = await ytdl.getInfo(`https://music.youtube.com/watch?v=${id}`);
          if (!info || !info.videoDetails) {
            throw new DisTubeError("YTMUSIC_PLUGIN_ERROR", "Failed to get video details");
          }
          
          // Create a standardized Song object and pass options directly
          // DisTube will handle user information from options
          const song = new Song({
            source: "youtube-music",
            id: id,
            name: info.videoDetails.title || "Unknown Title",
            url: `https://music.youtube.com/watch?v=${id}`,
            thumbnail: info.videoDetails.thumbnails.length > 0 
              ? info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url 
              : null,
            duration: parseInt(info.videoDetails.lengthSeconds) || 0,
            isLive: info.videoDetails.isLiveContent || false,
            views: parseInt(info.videoDetails.viewCount || 0),
            uploader: {
              name: info.videoDetails.author ? info.videoDetails.author.name : "Unknown Artist",
              url: info.videoDetails.author ? info.videoDetails.author.channel_url : null
            },
            playFromSource: true,
            plugin: this,
            member: options.member || null,
            metadata: options.metadata || null
          }, options);
          
          return song;
          
        default:
          throw new DisTubeError("YTMUSIC_PLUGIN_ERROR", "Unsupported URL type");
      }
    } catch (error) {
      console.error(`YouTubeMusicPlugin error resolving ${type} with ID ${id}:`, error);
      throw new DisTubeError("YTMUSIC_PLUGIN_ERROR", 
        `Failed to resolve ${type}: ${error.message || "Unknown error"}`);
    }
  }

  /**
   * Process playlist tracks to Song objects
   * @param {Array} tracks Tracks to process
   * @param {Object} options Options
   * @returns {Promise<Array<Song>>}
   * @private
   */
  async processPlaylistTracks(tracks, options) {
    const songs = [];
    
    const processTrack = async (track) => {
      try {
        if (!track || !track.videoId) return null;
        
        // Create a Song object and pass options directly
        // DisTube will handle user information from options
        return new Song({
          source: "youtube-music",
          id: track.videoId,
          name: track.title || "Unknown Title",
          url: `https://music.youtube.com/watch?v=${track.videoId}`,
          thumbnail: track.thumbnails && track.thumbnails.length > 0 
            ? track.thumbnails[track.thumbnails.length - 1].url 
            : null,
          duration: track.duration ? this.convertDurationToSeconds(track.duration) : 0,
          uploader: {
            name: track.artists && track.artists.length > 0 
              ? track.artists.map(artist => artist.name).join(", ") 
              : "Unknown Artist"
          },
          playFromSource: true,
          plugin: this,
          member: options.member || null,
          metadata: options.metadata || null
        }, options);
      } catch (err) {
        console.error(`Error processing track ${track?.videoId || 'unknown'}:`, err);
        return null;
      }
    };
    
    if (this.options.parallel) {
      const results = await Promise.all(tracks.map(track => processTrack(track)));
      songs.push(...results.filter(Boolean));
    } else {
      for (const track of tracks) {
        const song = await processTrack(track);
        if (song) songs.push(song);
      }
    }
    
    return songs;
  }

  /**
   * Search for a Song which playable from this plugin's source
   * @param {string} query Search query
   * @param {ResolveOptions} options Optional options
   * @returns {Promise<Song | null>}
   */
  async searchSong(query, options = {}) {
    try {
      console.log(`Searching for: "${query}"`);
      const searchResults = await this.ytmusic.searchSongs(query);

      if (!searchResults || searchResults.length === 0) {
        console.log("No search results found");
        return null;
      }

      console.log(`Found ${searchResults.length} results, using first result`);
      
      const firstResult = searchResults[0];
      if (!firstResult.videoId) {
        console.log("First result has no videoId");
        return null;
      }

      // Create a Song object following DisTube standard pattern like YouTube plugin
      // DisTube will handle the user data from options.member automatically
      return new Song({
        source: "youtube-music",
        id: firstResult.videoId,
        name: firstResult.name || "Unknown Title",
        url: `https://music.youtube.com/watch?v=${firstResult.videoId}`,
        thumbnail: firstResult.thumbnails && firstResult.thumbnails.length > 0 
          ? firstResult.thumbnails[firstResult.thumbnails.length - 1].url 
          : null,
        duration: firstResult.duration ? this.convertDurationToSeconds(firstResult.duration) : 0,
        uploader: {
          name: firstResult.artists && firstResult.artists.length > 0 
            ? firstResult.artists.map(artist => artist.name).join(", ") 
            : "Unknown Artist"
        },
        playFromSource: true,
        plugin: this,
        member: options.member || null,
        metadata: options.metadata || null
      }, options);
    } catch (e) {
      console.error("Search error:", e);
      return null;
    }
  }

  /**
   * Search for multiple Songs from YouTube Music
   * @param {string} query Search query
   * @param {Object} options Optional options
   * @param {string} [options.type='song'] Type of search result ('song', 'album', 'playlist', 'artist')
   * @param {number} [options.limit=3] Maximum number of results to return
   * @returns {Promise<Song[]>}
   */
  async searchSongs(query, options = {}) {
    try {
      const type = options.type || 'song';
      const limit = options.limit || 3;
      
      console.log(`Searching for ${type}s with query: "${query}" (limit: ${limit})`);
      
      let searchResults = [];
      
      // Use the appropriate search method based on type
      switch (type) {
        case 'song':
          searchResults = await this.ytmusic.searchSongs(query);
          break;
        case 'album':
          searchResults = await this.ytmusic.searchAlbums(query);
          break;
        case 'playlist':
          searchResults = await this.ytmusic.searchPlaylists(query);
          break;
        case 'artist':
          searchResults = await this.ytmusic.searchArtists(query);
          break;
        default:
          searchResults = await this.ytmusic.searchSongs(query);
      }

      if (!searchResults || searchResults.length === 0) {
        console.log(`No ${type} search results found`);
        return [];
      }

      // Limit the number of results
      const limitedResults = searchResults.slice(0, limit);
      console.log(`Found ${searchResults.length} results, returning ${limitedResults.length}`);
      
      // Process results into Song objects
      const songs = [];
      
      for (const result of limitedResults) {
        // Skip items without videoId
        if (!result.videoId) {
          console.log(`Result skipped - no videoId: ${result.name || 'Unknown'}`);
          continue;
        }
        
        // Create a Song object with standard pattern
        songs.push(new Song({
          source: "youtube-music",
          id: result.videoId,
          name: result.name || result.title || "Unknown Title",
          url: `https://music.youtube.com/watch?v=${result.videoId}`,
          thumbnail: result.thumbnails && result.thumbnails.length > 0 
            ? result.thumbnails[result.thumbnails.length - 1].url 
            : null,
          duration: result.duration ? this.convertDurationToSeconds(result.duration) : 0,
          uploader: {
            name: result.artists && result.artists.length > 0 
              ? result.artists.map(artist => artist.name).join(", ") 
              : "Unknown Artist"
          },
          playFromSource: true,
          plugin: this,
          member: options.member || null,
          metadata: options.metadata || null
        }, options));
      }

      return songs;
    } catch (e) {
      console.error("Search songs error:", e);
      return []; // Return empty array on error
    }
  }

  /**
   * Get the stream URL from Song's URL
   * @param {Song} song Input song
   * @returns {Promise<string>}
   */
  async getStreamURL(song) {
    if (!song || !song.id) {
      throw new DisTubeError("INVALID_TYPE", "Song", song);
    }

    try {
      console.log(`Getting stream URL for song ID: ${song.id}`);
      // Get the format info without downloading
      const info = await ytdl.getInfo(`https://music.youtube.com/watch?v=${song.id}`);
      const format = ytdl.chooseFormat(info.formats, {
        filter: "audioonly",
        quality: "highestaudio",
        ...this.distube.options.ytdlOptions,
      });

      if (!format || !format.url) {
        throw new Error("No suitable audio format found");
      }

      console.log("Stream URL obtained successfully");
      return format.url;
    } catch (e) {
      console.error("Error getting stream URL:", e);
      throw new DisTubeError("YTMUSIC_PLUGIN_ERROR", e.message || "Failed to get stream URL");
    }
  }

  /**
   * Get related songs
   * @param {Song} song
   * @returns {Promise<Song[]>}
   */
  async getRelatedSongs(song) {
    if (!song || !song.id) {
      console.log("Cannot get related songs: Invalid song or missing ID");
      return [];
    }

    try {
      console.log(`Getting related songs for: ${song.id}`);
      const related = await this.ytmusic.getRelated(song.id);
      if (!related || !related.tracks || !Array.isArray(related.tracks)) {
        console.log("No related tracks found");
        return [];
      }

      console.log(`Found ${related.tracks.length} related tracks`);
      
      const songs = [];
      for (const track of related.tracks) {
        if (!track || !track.videoId) continue;
        
        // Membuat Song object dengan pola standar
        songs.push(new Song({
          source: "youtube-music",
          id: track.videoId,
          name: track.title || "Unknown Title",
          url: `https://music.youtube.com/watch?v=${track.videoId}`,
          thumbnail: track.thumbnails && track.thumbnails.length > 0 
            ? track.thumbnails[track.thumbnails.length - 1].url 
            : null,
          duration: track.duration ? this.convertDurationToSeconds(track.duration) : 0,
          uploader: {
            name: track.artists && track.artists.length > 0 
              ? track.artists.map(artist => artist.name).join(", ") 
              : "Unknown Artist"
          },
          playFromSource: true,
          plugin: this
        }));
      }

      return songs;
    } catch (e) {
      console.error(`Failed to get related songs for ${song.id}:`, e);
      return []; // Return an empty array if fails
    }
  }

  /**
   * Convert duration string (MM:SS) to seconds
   * @param {string} duration Duration string
   * @returns {number} Duration in seconds
   * @private
   */
  convertDurationToSeconds(duration) {
    if (!duration) return 0;

    duration = duration.toString()

    const parts = duration.split(":").map(Number);
    if (parts.length === 2) {
      // MM:SS format
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return 0;
  }
}

export default YouTubeMusicPlugin;
