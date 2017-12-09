/*
    Defining dependencies
*/

var Discord = require('discord.js');
var client = new Discord.Client();
var moment = require('moment');
var jsonfile = require('jsonfile');
var request = require('request');
var schedule = require('node-schedule');


/*
    Defining files
*/

var file = './currencies.json';
var credentials = require('./credentials.json');


/*
    Setting required variables
*/

var prefix = '/';
var delay = 60000;
var currencies;
var currencies_converted = [];


/*
    Request arguments (temporarily stored here)
*/

var translate = "EUR";
var limit = "10";


/*
    Beginning of the actual script
*/

allCrypto(translate, limit);

function allCrypto(translate, limit) {
  var requestMap = 'https://api.coinmarketcap.com/v1/ticker/?convert=' + translate + '&limit=' + limit;
  request(requestMap, function(error, response, body) {
    var info = JSON.parse(body);

    // Reading in current currencies
    var currencies = jsonfile.readFileSync(file);

    info.forEach(function(entry) {

      // Removing previous crypto data from list
      var temp_currencies = [];
      for (var i in currencies)
        if (currencies[i].name != entry.name)
          temp_currencies[temp_currencies.length] = currencies[i];
      currencies = temp_currencies;

      // Adding new crypto data to list
      var name = entry.name;
      var symbol = entry.symbol;
      var rank = entry.rank;
      var perc_1h = entry.percent_change_1h;
      var perc_24h = entry.percent_change_24h;
      var perc_7d = entry.percent_change_7d;
      var amount = Math.round(entry.price_eur * 100) / 100;

      currencies = [...currencies, {
        name,
        symbol,
        rank,
        perc_1h,
        perc_24h,
        perc_7d,
        amount,
        translate
      }]

      // Writing out updated currencies
      jsonfile.writeFileSync(file, currencies, {
        spaces: 2
      });

    })

    //console.log(crypto + ': ' + info[translate] + " " + translate)
    sortCrypto();
  });
}

function sortCrypto() {

  var currencies = jsonfile.readFileSync(file);
  currencies.sort(sortNumber);
  jsonfile.writeFileSync(file, currencies, {
    spaces: 2
  });

}

function sortNumber(a, b) {
  return b.amount - a.amount;
}

function status() {
  client.user.setGame('Write "/crypto" to get started!');
}

var j = schedule.scheduleJob('00 * * * * *', function() {
  // Refreshing all crypto information exactly on the minute
  // in order to sync with the API
  allCrypto(translate, limit);
});

client.on('message', msg => {

  if (msg.author.id == "329331452040708096") {
    return;
  }

  if (msg.content.toLowerCase() == prefix + "crypto") {

    currencies = jsonfile.readFileSync(file);
    currencies.forEach(function(entry) {

      var emoji;

      if (entry.perc_24h >= 0) {
        emoji = ":chart_with_upwards_trend:";
        indicator = '+';
      } else {
        emoji = ":chart_with_downwards_trend:";
        indicator = '';
      }

      currencies_converted.push({
        name: emoji + ' __' + entry.name + ':__',
        value: 'Current exchange for ' + entry.symbol + ':\n**' + entry.amount + ' ' + entry.translate + '** (' + indicator +  entry.perc_24h + '% in 24h)',
        inline: true

      });

    });

    var embed = {
      color: 0xFFFFFF,
      // author: {
      //   name: "Current Crypto Currency Exchange Rates",
      //   icon_url: 'https://i.4da.ms/Bitcoin-icon.png'
      // },
      title: "Crypto Currency Exchange Rates",
      url: "https://crypto.4da.ms/",
      description: '\n» Data gets updated **every minute**.\n» Source code and more: **[crypto.4da.ms](https://crypto.4da.ms)**!',
      footer: {
        text: 'Via "/crypto" | CryptoCurrency Bot @ ' + moment().format('LTS'),
        icon_url: client.user.avatarURL
      },
      fields: currencies_converted,
    }

    console.log('| Crypto status requested                            |');
    console.log('|----------------------------------------------------|');

    msg.channel.send('[<@' + msg.author.id + '>] Here are your requested exchange rates!')
    msg.channel.send({
      embed
    });

    currencies_converted = [];

  }

});

client.on('ready', function() {
  console.log('|----------------------------------------------------|');
  console.log('|                                                    |');
  console.log('|   CryptoCurrency(-Bot) online and ready to use!    |');
  console.log('|         - Current Verison: 3.0 by 4dams -          |');
  console.log('|                Contact: 4dams#0001                 |');
  console.log('|                                                    |');
  console.log('|----------------------------------------------------|');
  console.log('| Currencies updating every minute.                  |');
  console.log('|----------------------------------------------------|');

  status();

  setInterval(function() {
    status();
  }, delay);

});

client.login(credentials.discord.token);
