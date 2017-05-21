
exports.do_init = function() {
};

exports.do_cron = function(words, data, callback) { 
};

exports.do_main = function(words, data, callback) {
	console.log('\x1b[91mmode REMOTE \x1b[0m');

	var pluginProps = Config.modules.homeIA.remote;
	if (!pluginProps.addr) {
		console.log("Missing Remote address config in prop file");
		next({'tts' : 'Configuration invalide'});
		return;
	}

    var async = require("async");

	var count = 0;
	var items = data.params.item.split(";");
	var cmds = data.params.cmd.split(";");

	// wakeup the device
	sendCommand(pluginProps.addr + "/0/wakeup", function() { });

	async.each(items,
		function(item, cb1) {
			async.each(cmds, function (cmd, cb2) {
				var url = pluginProps.addr + "/0/blast/" + item + "/" + cmd;

				// send command every 750 ms
				setTimeout(function() { sendCommand(url, cb2) }, 750 * count++);
			}, function (err) {
				if (err) console.log(err);
				cb1();
			});
		},
		function(err) {
			if (err) console.log(err);
			callback({ });
		}
	);
};

var request = require("request");

var sendCommand = function(url, callback) {
	request(url, function (err, response, body) { 
		if (err || (response && response.statusCode != 200))
			console.log(url + ' code=' + (response ? response.statusCode : -1) + " err=" + err);

		callback();
	});
};
