
exports.do_init = function() {
};

exports.do_cron = function(words, data, callback) { 
};

exports.do_main = function(words, data, callback) {
	console.log('\x1b[91mmode JEEDOM \x1b[0m');

    var pathJeedomApi = '/core/api/jeeApi.php';

	var pluginProps = Config.modules.homeIA.jeedom;
	if (!pluginProps.addr) {
		console.log("Missing Jeedom address config in prop file");
		next({'tts' : 'Configuration invalide'});
		return;
	}
	else if (!pluginProps.apikey) {
		console.log("Missing Jeedom API key config in prop file");
		next({'tts' : 'Configuration invalide'});
		return;
	}

	var request = require('request');
	var async = require('async');

	var list_urls = [];

	var commands = data.cmd.split(";");
	for (var i=0; i<commands.length; i++) {
		var url = pluginProps.addr + pathJeedomApi + "?apikey=" + pluginProps.apikey + "&type=cmd&id=" + commands[i];
		list_urls.push(url);
	}

	async.map(list_urls, function(url, callback) {
		request(url, function (error, response, body) {
	        if (!error && response.statusCode == 200) {
	            // do any further processing of the data here
	            callback(null, response.body);
	        } else {
	            callback(error || response.statusCode);
	        }
	    });
    }, function(err, results) {
	    // completion function
	    if (!err) {
	    	var toSpeak = '';

			if ( (data.element === 'lum_on') || (data.element === 'lum_off') || 
				(data.element === 'volet_up') || (data.element === 'volet_down')) {
				if (Object.keys(words).length > 0) {
					var choice = Math.floor(Math.random() * Object.keys(words).length); 
					toSpeak = words[choice];
				}

				toSpeak = toSpeak + (data.tts ? (" " + data.tts) : "");
			 }
			 else if (data.element === 'temp') {
			 	var tmp = results[0];
			 	toSpeak = "la température " + (data.tts ? (data.tts + " ") : "") + "est de " + tmp.replace('.', ',') + " degrés";
			 }

			callback({ 'tts': toSpeak });
	    }
	    else {
	        // handle error here
			callback({'tts': "Désolé mais je n'arrive pas à envoyer une des commandes à Jeedom"});
	    }
	});
};
