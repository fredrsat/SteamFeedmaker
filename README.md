# SteamFeedmaker
A RSS maker for Steam that creates a RSS file for all game and application updates in an user's library.

## Usage

Use concron.js in a local cronjob setup with the following usage:

    .arguments('<userid> <filepath>')
      .usage('<userid> <filepath> [options]')
      .option('-s, --save [filepath]', 'Save game id's to file')
      .option('-l, --load [filepath]', 'Load game id's from file')
      .option('-f, --filter [filter]', 'Define filter to use on Steam news')  


Where userid is a user's steamcommunity id and filepath is the save path of the RSS file.

### Possible filters for concron :
* Announcements: "steam_announce" 
* Client updates: "steam_client"
* Press Releases: "steam_press"
* Product Releases : "steam_release"
* Product Updates : "steam_updates"
* Steam Blog : "steam_blog"

For hosted use a node-cron library with feedmaker.js.

## Notes
The ten latest updates pr game/application is loaded as presented by Steam


