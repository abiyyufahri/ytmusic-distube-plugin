#!/usr/bin/env node

console.log("\n\x1b[32mytmusic-distube-plugin\x1b[0m has been installed successfully!");
console.log("\n\x1b[34mThank you for using this plugin!\x1b[0m");
console.log("Make sure to initialize the plugin correctly in your code:");
console.log(`
const { DisTube } = require("distube");
const { YouTubeMusicPlugin } = require("ytmusic-distube-plugin");

const distube = new DisTube({
  plugins: [new YouTubeMusicPlugin()],
});
`);
console.log("\x1b[33mDocumentation: https://github.com/abiyyufahri/ytmusic-distube-plugin#readme\x1b[0m");
console.log("\n"); 