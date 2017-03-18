
var mod_path = '%CD%/plugins/homeIA/mod_command/';

exports.do_init = function() {
};

exports.do_cron = function(words, data, callback) { 
};

exports.do_main = function(words, data, callback) {
	var pluginProps = Config.modules.homeIA.command;

	console.log('\x1b[91mmode COMMAND\x1b[0m');

	if (typeof data.cmd == 'undefined') {
		callback({});
		return;
	}
	
	var url = pluginProps.addr + '/run/' + data.cmd;

	var request = require('request');
	request( { 'uri' : url }, function (err, response, body) {
		if (err || response.statusCode != 200) {
			console.log(url + ' code=' + response.statusCode + " err=" + err);
			callback({'tts': "Désolé, je n'arrive pas à contacter le client"});
			return;
		}

		callback({});
	});
};
