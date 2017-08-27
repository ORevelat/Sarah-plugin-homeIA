var SqueezeServer = require('squeezenode');

exports.do_init = function () {
};

exports.do_cron = function (words, data, callback) {
};

exports.do_main = function (words, data, callback) {
    console.log('\x1b[91mmode SQUEEZEBOX \x1b[0m');

    if (!data.periph) {
        console.log("Missing Squeezebox periph parameter");
        callback({ 'tts': 'Demande invalide' });
        return;
    }

    var pluginProps = Config.modules.homeIA.squeezebox[data.periph];

    if (!pluginProps.addr) {
        console.log("Missing Squeezebox '" + periph + "' addr configuration");
        callback({ 'tts': 'Configuration invalide' });
        return;
    }
    if (!pluginProps.port) {
        console.log("Missing Squeezebox '" + periph + "' port configuration");
        callback({ 'tts': 'Configuration invalide' });
        return;
    }

    var squeeze = new SqueezeServer('http://' + pluginProps.addr, pluginProps.port);
    
    squeeze.on('register', function() {
        playerIdByName(squeeze, data.periph, data, callback);
    });
};

var playerIdByName = function (squeeze, name, data, callback) {

    squeeze.getPlayers( function(reply) {
        for (var id in reply.result) {
            if(reply.result[id].name === name) {
                executeCommand(squeeze.players[reply.result[id].playerid], data, callback);
                return;
            }
        }

        callback({ 'tts': 'désolé je ne connais pas cette squeezebox' });
    });
}

var executeCommand = function(player, data, callback) {
    switch (data.cmd) {
        case 'poweron':
        case 'poweroff':
            callback();
            break;
        case 'play':
            player.play();
            break;
        case 'pause':
            player.pause();
            break;
        case 'next':
            player.next();
            break;
        case 'previous':
            player.previous();
            break;
        case 'setVolume':
            player.setVolume(data.params);
            break;
        case 'getCurrentTitle':
            player.getCurrentTitle(function(reply) {
                callback({ 'tts': reply.result });
            });
            break;
       default:
            callback({ 'tts': 'désolé je ne peut exécuter cette commande' });
            break;
    }
}
