import { type DisTube, ExtractorPlugin, type Song, type Playlist } from "distube"

declare interface YouTubeMusicPluginOptions {
  /**
   * Whether to emit events after fetching or not
   * @default true
   */
  emitEventsAfterFetching?: boolean
  /**
   * Whether to fetch the song/playlist before adding to the queue or not
   * @default false
   */
  fetchBeforeQueued?: boolean
  /**
   * Whether to process playlist tracks in parallel or sequentially
   * @default true
   */
  parallel?: boolean
  /**
   * Maximum number of tracks to fetch from playlists, albums, and artists
   * @default 10
   */
  maxViews?: number
}

declare class YouTubeMusicPlugin extends ExtractorPlugin {
  constructor(options?: YouTubeMusicPluginOptions)

  /**
   * Plugin options
   */
  options: YouTubeMusicPluginOptions

  /**
   * DisTube instance
   */
  distube: DisTube

  /**
   * YouTube Music API instance
   */
  ytmusic: any

  /**
   * Initialize the plugin
   * @param distube DisTube instance
   */
  init(distube: DisTube): Promise<void>

  /**
   * Plugin name
   */
  get name(): string

  /**
   * Check if the URL is supported by this plugin
   * @param url URL to check
   */
  validate(url: string): boolean

  /**
   * Resolve the validated URL to a Song or a Playlist
   * @param url URL to resolve
   * @param options Optional options
   */
  resolve(url: string, options?: any): Promise<Song | Playlist>

  /**
   * Search for a Song which is playable from this plugin's source
   * @param query Search query
   * @param options Optional options
   */
  searchSong(query: string, options?: any): Promise<Song | null>

  /**
   * Get the stream URL from Song's URL
   * @param song Input song
   */
  getStreamURL(song: Song): Promise<string>

  /**
   * Get related songs
   * @param song Input song
   */
  getRelatedSongs(song: Song): Promise<Song[]>

  /**
   * Extract ID from YouTube Music URLs
   * @param url URL to extract ID from
   * @private
   */
  private extractId(url: string): { type: string; id: string | null }

  /**
   * Process playlist tracks to Song objects
   * @param tracks Tracks to process
   * @param options Options
   * @private
   */
  private processPlaylistTracks(tracks: any[], options: any): Promise<Song[]>

  /**
   * Convert duration string (MM:SS) to seconds
   * @param duration Duration string
   * @private
   */
  private convertDurationToSeconds(duration: string): number
}

export default YouTubeMusicPlugin
