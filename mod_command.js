
var mod_path = '%CD%/plugins/homeIA/mod_command/';

exports.do_init = function() {
};

exports.do_cron = function(words, data, callback) { 
};

exports.do_main = function(words, data, callback) {
	console.log('\x1b[91mmode COMMAND \x1b[0m');

	var pluginProps = Config.modules.homeIA.command;

	var textTTS = new Array;
	var toExecute = null;

	switch (data.cmd)
	{
		case "kodi_on":
		case "kodi_off":
		{
			toExecute = mod_path + data.cmd + '.bat';
			textTTS = words[data.cmd];
			break;
		}
		default:
			return callback({ 'tts': words["error"][0] });
	}

	var exec = require('child_process').exec;

	var child = exec(toExecute, function (error, stdout, stder) {
		console.log(toExecute);
	});

	if (Object.keys(textTTS).length > 0) {
		var choice = Math.floor(Math.random() * Object.keys(textTTS).length);
		callback({'tts': textTTS[choice]});
	}
	else
		callback({});
};
