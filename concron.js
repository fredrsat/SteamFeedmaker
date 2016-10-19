#!/usr/bin/env node

'use strict';

/*
 *
 * Console runner for use with naitive cron
 *
 */

const feedmaker = require('./feedmaker.js');
const program = require('commander');

program
  .version('0.0.1')
  .arguments('<userid> <filepath>')
  .usage('<userid> <filepath> [options]')
  .option('-s, --save [filepath]', 'Saves game id\'s to file')
  .option('-l, --load [filepath]', 'Loades id\'s from file and use it as source')
  .option('-f, --filter [filter]', 'Defines filter to use on Steam news')
  .action((userid, filepath, options) => {

    //Create feed
    feedmaker(userid, filepath, {
      save: program.save,
      load: program.load,
      filter:program.filter
    }); 
  })
  .parse(process.argv);




