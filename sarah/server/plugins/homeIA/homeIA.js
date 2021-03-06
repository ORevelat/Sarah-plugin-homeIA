
var words = require('./homeIA.json');

var mod_time = require('./mod_time');
var mod_cmd = require('./mod_command');
var mod_joke = require('./mod_joke');
var mod_weather = require('./mod_weather');
var mod_jeedom = require('./mod_jeedom');
var mod_calendar = require('./mod_calendar');
var mod_remote = require('./mod_remote');
var mod_squeezebox = require('./mod_squeezebox');

exports.init = function() {
	console.log('\x1b[96mHomeIA plugin is initializing ... \x1b[0m');

	mod_time.do_init();
	mod_cmd.do_init();
	mod_joke.do_init();
	mod_weather.do_init();
	mod_jeedom.do_init();
	mod_calendar.do_init();
	mod_remote.do_init();
	mod_squeezebox.do_init();
};

exports.dispose  = function() {
	console.log('\x1b[96mHomeIA plugin is disposed ... \x1b[0m');
};

exports.cron = function(callback) {
	mod_time.do_cron(words["time"], {}, callback);
	mod_cmd.do_cron(words["command"], {}, callback);
	mod_joke.do_cron(words["joke"], {}, callback);
	mod_weather.do_cron(words["weather"], {}, callback);
	mod_jeedom.do_cron(words["jeedom"], {}, callback);
	mod_calendar.do_cron(words["calendar"], {}, callback);
	mod_remote.do_cron(words["remote"], {}, callback);
	mod_squeezebox.do_cron(words["squeezebox"], {}, callback);
}

exports.action = function(data, callback) {
	data = data.params;
	
	if ( data.mode && (data.mode == "TIME"))
		return mod_time.do_main(words["time"], data, callback);
	else if ( data.mode && (data.mode == "COMMAND") )
		return mod_cmd.do_main(words["command"], data, callback);
	else if ( data.mode && (data.mode == "JOKE"))
		return mod_joke.do_main(words["joke"], data, callback);
	else if ( data.mode && (data.mode == "WEATHER"))
		return mod_weather.do_main(words["weather"], data, callback);
	else if ( data.mode && (data.mode == "JEEDOM"))
		return mod_jeedom.do_main(words["jeedom"], data, callback);
	else if ( data.mode && (data.mode == "CALENDAR"))
		return mod_calendar.do_main(words["calendar"], data, callback);
	else if ( data.mode && (data.mode == "REMOTE"))
		return mod_remote.do_main(words["remote"], data, callback);
	else if ( data.mode && (data.mode == "SQUEEZEBOX"))
		return mod_squeezebox.do_main(words["squeezebox"], data, callback);

	callback({ 
		'tts': commandError() 
	});
};

var commandError = function() {
	var toSpeak = 'Erreur';
	var availableTTS = words["error"];
	if (Object.keys(availableTTS).length > 0) {
		var choice = Math.floor(Math.random() * Object.keys(availableTTS).length); 
		toSpeak = availableTTS[choice];
	}
	return toSpeak;
};
