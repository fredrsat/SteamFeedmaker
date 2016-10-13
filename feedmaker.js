/*
 *
 * Steam RSS maker by Procencephalon 
 * 
 */

'use strict';

const builder = require('xmlbuilder'),
      request = require('request'),
      cheerio = require('cheerio'),
      fs = require('fs');

let getMatches = (string, regex, index) => {
  index || (index = 1); 
  let matches = [], match;
  
  while (match = regex.exec(string))   {
    matches.push(match[index]);
  }
  return matches;
}

/*
 *
 * Creates a RRS feed from all the lates updates from all the games in a user's public Steam profile    
 * @param{String} userid A user's id from steamcommunity.com
 *
 */

module.exports = (userid, filepath) => { 
  let list = [], promises = [], games = [];

  //Find all games on the users public profile
  (new Promise ((resolve, reject) => {
    request('https://steamcommunity.com/profiles/' + userid + '/games/?tab=all', (error, response, body) => {
      if (error && response.statusCode !== 200) return reject(response.statusCode);

      let $ = cheerio.load(body);
      games = getMatches($('script').text(), /\"appid\":([0-9]*)/g);

      resolve();
    });  
  })).then(done => {

    //Iterate through all games and collect required information for RSS items
    games.forEach(appid => {
      promises.push(
        new Promise((resolve, reject) => { 
          request('http://store.steampowered.com/news/?appids=' + appid + '&feed=steam_updates', (error, response, body) => {
            if (error && response.statusCode !== 200) reject(response.statusCode);

            let $ = cheerio.load(body);
            $('#mainBlock').find('div .newsPostBlock').each( (index, element) => {
              let url = $(element).find('.headline a');
              
              list.push({"item":{
                title: $(url).text(), 
                description: $(element).find('.body').text().trim(),
                link: $(url).attr('href'),
                pubDate:new Date($(element).find('div .date').text()).toUTCString()
              }}); 
            });
            resolve(appid);
          });
        })
      );
    });

    //Create a RSS file of all updates
    Promise.all(promises).then(
      values => { 
        let feed = builder.create('rss')
            .att('version', '2.0')
            .ele('channel')
              .ele('title', 'Game updates for user ' + userid).up()
              .ele('description', 'Feed that consolidates all games updates for a given user').up()
              .ele('link', 'http://127.0.0.1').up() 
              .ele('lastBuildDate', new Date().toUTCString()).up() 
              .ele(list)
            .end({ pretty: true});

        fs.writeFile(filepath, feed, function(err) {
          if(err) {
            return console.log('Error ' + err);
          }
          console.log("RSS sucessfully created");
        });
      }, 
      reason => {
        console.log('Error ' + reason);
      }
    );
  });
}

