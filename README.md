# ytmusic-distube-plugin

> Unofficial YouTube Music Plugin for [DisTube](https://distube.js.org)

<div align="center">
  <a href="https://nodei.co/npm/ytmusic-distube-plugin"><img src="https://nodei.co/npm/ytmusic-distube-plugin.png?downloads=true&downloadRank=true&stars=true"></a>
</div>

## Installation

```sh
npm install ytmusic-distube-plugin
```

## Usage

```js
const { DisTube } = require("distube");
const { YouTubeMusicPlugin } = require("ytmusic-distube-plugin");

const distube = new DisTube({
  plugins: [new YouTubeMusicPlugin()],
});
```

## Options

```js
new YouTubeMusicPlugin({
  // Whether to emit events after fetching or not (Default: true)
  emitEventsAfterFetching: true,
  // Whether to fetch the song/playlist before adding to the queue or not (Default: false)
  fetchBeforeQueued: false,
  // Whether to process playlist tracks in parallel or sequentially (Default: true)
  parallel: true,
  // Maximum number of tracks to fetch from playlists, albums, and artists (Default: 10)
  maxViews: 10,
});
```

## Supported URLs

- YouTube Music video: `https://music.youtube.com/watch?v=xxx`
- YouTube Music playlist: `https://music.youtube.com/playlist?list=xxx`
- YouTube Music album: `https://music.youtube.com/browse/MPREb_xxx`
- YouTube Music artist: `https://music.youtube.com/channel/xxx`
- YouTube video: `https://www.youtube.com/watch?v=xxx`

## Features

### Play from YouTube Music

```js
// Play YouTube Music
distube.play(voiceChannel, "https://music.youtube.com/watch?v=xxx", options);

// Play a YouTube Music playlist
distube.play(voiceChannel, "https://music.youtube.com/playlist?list=xxx", options);

// Play a YouTube Music album
distube.play(voiceChannel, "https://music.youtube.com/browse/MPREb_xxx", options);

// Play a YouTube Music artist
distube.play(voiceChannel, "https://music.youtube.com/channel/xxx", options);
```

### Search on YouTube Music

```js
const song = await distube.search("Hanya Rindu")[0];
distube.play(voiceChannel, song, options);
```

### Get Related Songs

Related songs can be automatically played when using the plugin with the DisTube's `autoplay` feature enabled. It will use this plugin to get related songs from YouTube Music.

```js
// Enable autoplay mode to use related songs
distube.toggleAutoplay(message);
```

## Testing

To run the tests:

```sh
npm test
```

## Disclaimer

This is an **unofficial** plugin for DisTube. It is not endorsed by or affiliated with DisTube or YouTube Music. This plugin is developed independently to add YouTube Music support to DisTube.

## Acknowledgements

This plugin makes use of the following libraries:
- [ytmusic-api](https://github.com/zS1L3NT/ts-npm-ytmusic-api) - API client for YouTube Music
- [@distube/ytdl-core](https://github.com/distubejs/ytdl-core) - YouTube video and audio stream downloader
- [DisTube](https://distube.js.org/) - A Discord.js module to simplify your music commands

## License

MIT © [abiyyufahri](https://github.com/abiyyufahri)
