'use strict'

const feedmaker = require('./feedmaker.js');

/*
 *
 * Runner for console for use with Cron
 *
 */

let p = process.argv;
if(p.length > 2 && p.length <= 4){
  feedmaker(p[2], p[3]);    
}else{
  console.log('usage: node console.js [userid] [filepath]');  
}


