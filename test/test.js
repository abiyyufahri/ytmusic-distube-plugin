const YouTubeMusicPlugin = require("../src/index.js")

async function testPlugin() {
  const plugin = new YouTubeMusicPlugin()

  console.log("Testing YouTubeMusicPlugin...")

  try {
    await plugin.init({ options: { ytdlOptions: {} } })
    console.log("✅ Plugin initialized successfully")

    // Test URL validation
    const testUrls = [
      "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://music.youtube.com/playlist?list=OLAK5uy_nEmVPPuUwvBUJD_uVsU5nWFqf8lprUAg4",
      "https://music.youtube.com/browse/MPREb_Fw7USCm1cxY", // Album URL
      "https://music.youtube.com/channel/UCvgfXK4nTYKudb0rFR6noLA", // Artist URL
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://invalid-url.com",
    ]

    for (const url of testUrls) {
      const isValid = plugin.validate(url)
      console.log(`URL: ${url} - Valid: ${isValid ? "✅" : "❌"}`)
    }

    // Test search
    const searchQuery = "Hanya Rindu"
    console.log(`Searching for: "${searchQuery}"`)
    const searchResult = await plugin.searchSong(searchQuery)

    if (searchResult) {
      console.log("✅ Search successful")
      console.log(`Song: ${searchResult.name}`)
      console.log(`URL: ${searchResult.url}`)
      console.log(`Duration: ${searchResult.duration} seconds`)
      console.log(`Uploader: ${searchResult.uploader.name}`)
      
      // Test getting stream URL
      try {
        const streamUrl = await plugin.getStreamURL(searchResult)
        console.log("✅ Got stream URL successfully")
        console.log(`Stream URL starts with: ${streamUrl.substring(0, 50)}...`)
      } catch (e) {
        console.log("❌ Failed to get stream URL:", e.message)
      }
      
      // Test getting related songs
      try {
        const relatedSongs = await plugin.getRelatedSongs(searchResult)
        console.log(`✅ Got ${relatedSongs.length} related songs`)
        if (relatedSongs.length > 0) {
          console.log(`First related song: ${relatedSongs[0].name}`)
        }
      } catch (e) {
        console.log("❌ Failed to get related songs:", e.message)
      }
    } else {
      console.log("❌ Search failed")
    }
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Run the test
testPlugin()
