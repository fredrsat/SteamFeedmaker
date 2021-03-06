/*
 *
 * Steam RSS maker 
 * 
 */ 

'use strict';

const builder = require('xmlbuilder'),
  request = require('request'),
  cheerio = require('cheerio'),
  fs = require('fs');

/*
 * Helper function to sum up all matches of a regex
 */

let getMatches = (string, regex, index) => {
  index || (index = 1); 
  let matches = [], match;
  
  while (match = regex.exec(string))   {
    matches.push(match[index]);
  }
  return matches;
}

/*
 * Helper function to remove invalid symbols from string
 */

 let sanitizeString = (input) => {
    let output = '';
    for (let i = 0; i < input.length; i++) {
      output += input.charCodeAt(i) <= 255 ? input.charAt(i) : ''
    }
    return output;
}

/*
 *
 * Creates a RRS feed from all the lates updates from all the games in a user's public Steam profile    
 * @param{String} userid   A user's id from steamcommunity.com
 * @param{String} filepath Path where to save the *.rss file
 * @param{Object} options:
 *                options.save   If and where to save game ids from profile
 *                options.load   If and where from to load cached game ids 
 *                options.filter Filter to use for news feed. 
 *
 */

module.exports = (userid, filepath, options) => { 
  let list = [], 
    promises = [], 
    games = [],
    filter = options.filter ? '&feed=' + options.filter : '';

  //Find all games on the users public profile
  (new Promise ((resolve, reject) => {

    //Load from cashed game id's file if option for load is set
    if(options.load){
      fs.readFile(options.load, 'utf8', (err, data) => {
        if(err){
          reject('Error loading game ids ' + err) 
          return;
        };
        
        data.split(',').forEach(id => {
          games.push(id);
        });

        resolve();
      });
    }else{

      //Load from steam profile
      request('https://steamcommunity.com/profiles/' + userid + '/games/?tab=all', (error, response, body) => {
        if (error && (response && response.statusCode !== 200)){
          reject(response.statusCode);
          return;
        }
        
        let $ = cheerio.load(body);
        games = getMatches($('script').text(), /\"appid\":([0-9]*)/g);

        resolve();
      });  
    }
  })).then(
    done => {

      //Iterate through all games and collect required information for RSS items
      games.forEach(appid => {
        promises.push(
          new Promise((resolve, reject) => { 
            request('http://store.steampowered.com/news/?appids=' + appid + filter, (error, response, body) => {
              if (error && (response && response.statusCode !== 200)){
                reject(response.statusCode);
                return;
              } 

              let $ = cheerio.load(body);
              $('#mainBlock').find('div .newsPostBlock').each( (index, element) => {
                let url = $(element).find('.headline a'),
                  description = sanitizeString($(element).find('.body').text().trim()),
                  date = $(element).find('div .date').text(), 
                  z = Date.parse(date), y = new Date();
                  
                list.push({"item":{
                  title: $(url).text(), 
                  description: description,
                  link: $(url).attr('href'),

                  //Handle the different rules that Steam use for presenting date (based on time since publication)                  
                  pubdate: new Date((date ? z != z ? (y.getMonth()+1) + ' ' + y.getDate() : date : y ) + ' ' + y.getFullYear()).toString() 
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
          if(filepath && list.length > 0){
            let feed, now = new Date();

            try{
              feed = 
              builder.create('rss')
                .att('version', '2.0')
                .ele('channel')
                  .ele('title', 'Game updates for user ' + userid).up()
                  .ele('description', 'Feed that consolidates all games news/updates for a given user').up()
                  .ele('link', 'http://store.steampowered.com/news/').up() 
                  .ele('lastBuildDate', new Date(now.getTime()).toString()).up() 

                  //As the post have been read into the list async the list need to be sorted by publication date
                  .ele(list.sort((a, b) => {
                    return new Date(a.item.pubdate).getTime() < new Date(b.item.pubdate).getTime() ? 1 : -1;
                  }))
                .end({ pretty: true});
                
              //Save RSS feed to file          
              fs.writeFile(filepath, feed, err => {
                if(err)throw err;
    
                console.log('RSS feed for user '+ userid + ' sucessfully created with filter: ' + (options.filter ? options.filter : 'none') );
              });
            }catch(err){
                console.log(err);  
            }
          }else{
            console.log('Warning: RSS filepath not given or no results found');  
          }

          //Save game id's to file if option for save is set
          if(options.save){
              fs.writeFile(options.save, games, err => {
              if(err) {
                console.log('Error ' + err);
              }

              console.log('Game id\'s saved sucessfully');
            });
          }
        }, 
        reason => {
          console.log('Error ' + reason);
        }
      );
    },
    reason => {
      console.log('Error ' + reason);  
    }
  );
}