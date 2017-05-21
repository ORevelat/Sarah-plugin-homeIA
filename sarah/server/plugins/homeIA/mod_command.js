
exports.do_init = function() {
};

exports.do_cron = function(words, data, callback) { 
};

exports.do_main = function(words, data, callback) {
	var pluginProps = Config.modules.homeIA.command;

	console.log('\x1b[91mmode COMMAND\x1b[0m');

	if (typeof data.params.cmd == 'undefined') {
		callback({});
		return;
	}
	
	var url = pluginProps.addr + '/run/' + data.params.cmd;

	var request = require('request');
	request( { 'uri' : url }, function (err, response, body) {
		if (err || (response && response.statusCode != 200)) {
			console.log(url + ' code=' + (response ? response.statusCode : -1) + " err=" + err);
			callback({'tts': "Désolé, je n'arrive pas à contacter le client"});
			return;
		}

		var toSpeak = '';

		if (Object.keys(words[data.params.cmd]).length > 0) {
			var choice = Math.floor(Math.random() * Object.keys(words[data.params.cmd]).length); 
			toSpeak = words[data.params.cmd][choice];
		}

		callback({ 'tts': toSpeak });
	});
};
