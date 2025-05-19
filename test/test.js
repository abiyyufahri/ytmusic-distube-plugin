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

    // Test searchSongs with default parameters (type: song, limit: 3)
    console.log("\n--- Testing searchSongs with default parameters ---")
    try {
      const multiSearchQuery = "Tulus"
      console.log(`Searching for songs with query: "${multiSearchQuery}"`)
      const songs = await plugin.searchSongs(multiSearchQuery)
      
      if (songs && songs.length > 0) {
        console.log(`✅ Successfully found ${songs.length} songs`)
        console.log("\nSong results:")
        songs.forEach((song, index) => {
          console.log(`${index + 1}. ${song.name} by ${song.uploader.name} (${song.duration} seconds)`)
        })
      } else {
        console.log("❌ No songs found")
      }
    } catch (e) {
      console.log("❌ Multi song search failed:", e.message)
    }

    // Test searchSongs dengan parameter khusus hanya untuk lagu
    console.log("\n--- Testing searchSongs with custom limit ---")
    try {
      const customSearchQuery = "Dewa 19"
      console.log(`Searching for songs with query: "${customSearchQuery}" with limit 5`)
      const customSongs = await plugin.searchSongs(customSearchQuery, { limit: 5 })
      
      if (customSongs && customSongs.length > 0) {
        console.log(`✅ Successfully found ${customSongs.length} songs`)
        console.log("\nCustom limit song results:")
        customSongs.forEach((song, index) => {
          console.log(`${index + 1}. ${song.name} by ${song.uploader.name}`)
        })
      } else {
        console.log("❌ No songs found with custom limit")
      }
    } catch (e) {
      console.log("❌ Custom song search failed:", e.message)
    }

    // Test mengambil video dengan keyword spesifik
    console.log("\n--- Testing searchSongs with specific keyword ---")
    try {
      const specificQuery = "Peterpan - Semua Tentang Kita"
      console.log(`Searching for specific song: "${specificQuery}"`)
      const specificSongs = await plugin.searchSongs(specificQuery, { limit: 1 })
      
      if (specificSongs && specificSongs.length > 0) {
        console.log(`✅ Successfully found specific song`)
        console.log(`Title: ${specificSongs[0].name}`)
        console.log(`URL: ${specificSongs[0].url}`)
        console.log(`Duration: ${specificSongs[0].duration} seconds`)
        
        // Test mendapatkan stream URL dari hasil pencarian spesifik
        try {
          const specificStreamUrl = await plugin.getStreamURL(specificSongs[0])
          console.log("✅ Got stream URL for specific song")
        } catch (e) {
          console.log("❌ Failed to get stream URL for specific song:", e.message)
        }
      } else {
        console.log("❌ Specific song not found")
      }
    } catch (e) {
      console.log("❌ Specific song search failed:", e.message)
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Run the test
testPlugin()
