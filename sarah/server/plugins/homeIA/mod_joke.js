var nbRetry = 0;

exports.do_init = function() {
};

exports.do_cron = function(words, data, callback) { 
};

exports.do_main = function(words, data, callback) {
	console.log('\x1b[91mmode JOKE \x1b[0m');

	nbRetry = 0;

	getRandomJoke(callback);
};

var getRandomJoke = function(callback) {
	var pluginProps = Config.modules.homeIA.joke;
	if (!pluginProps.max_id) {
		console.log("Missing Joke max_id config in prop file");
		callback({'tts' : 'Configuration invalide'});
		return;
	}

	var maxJokeId = parseInt(pluginProps.max_id);

	var url = 'http://www.takatrouver.net/blagues/index.php?id=' + Math.floor(Math.random() * maxJokeId);
	var request = require('request');

	request( { 'uri' : url, 'encoding': 'binary' }, function (err, response, body) {
		if (err || response.statusCode != 200) {
			callback({'tts': "Je n'arrive pas à accéder aux informations du site takatrouver.net"});
			return;
		}

		var cheerio = require('cheerio');
		var $ = cheerio.load(body, { xmlMode: false, normalizeWhitespace: false, ignoreWhitespace: true, lowerCaseTags: true });
		var joke = $('#Layer11 table table:nth-child(2)').text();

		if (joke) {
			callback({'tts': joke});
			return;
		}
		else if (nbRetry < 5) {
			nbRetry++;
			console.log("[takarire] Joke not found ! Retry #" + nbRetry + ".");
			return getRandomJoke(callback);
		} 
		else {
			callback({'tts': "Je n'arrive pas à accéder aux informations du site takatrouver.net"});
			return;
		}
	});
}