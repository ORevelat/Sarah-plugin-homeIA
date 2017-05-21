var fs         = require('fs');
var readline   = require('readline');
var google     = require('googleapis');
var googleAuth = require('google-auth-library');
var async	   = require('async');
var moment     = require('moment');

var rfc_3339   	  = 'YYYY-MM-DD[T]HH:mm:ssZ';
var rfc_3339_date = 'YYYY-MM-DD';

var SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

moment.locale('fr');

exports.do_init = function() {
	var pluginProps = Config.modules.homeIA.calendar;

	async.eachSeries(pluginProps.calendars, function iterator(item, callback) {
		getCalendarAuth(item);
		callback();
	}, function done(err) { });
};

exports.do_cron = function(words, data, callback) { 
	checkPlaning({}, callback);
};

exports.do_main = function(words, data, callback) {
	console.log('\x1b[91mmode CALENDAR \x1b[0m');

	var pluginProps = Config.modules.homeIA.calendar;

	if (data.params.cmd == "PLANNING")
		return checkPlaning(data, callback);

	callback({'tts': 'désolée cette commande m\'est inconnue'});
};

var checkPlaning = function (data, callback) {
	var pluginProps = Config.modules.homeIA.calendar;

	var events = [];
	var storeEvent = function(e) {
		events[events.length] = e;
	};

	async.eachSeries(pluginProps.calendars, function iterator(item, callback) {
		var auth = getCalendarAuth(item);
		if (auth == null)
			callback('unable to get auth for calendar id=' + item.id);
		else {
			var api = google.calendar('v3');
			api.events.list({
				auth: auth,
				calendarId: item.id,
				timeMin: (new Date()).toISOString(),
				maxResults: 10,
				singleEvents: true,
				orderBy: 'startTime'
			}, function(err, response) {
				if (err) {
					info('The API returned an error: ' + err);
					callback('The API returned an error: ' + err);
				}
				else {
					storeEvent(response.items);

					callback();
				}
			});
		}
	}, function done(err) {
		if (err) {
			console.log('error encoutered');
		}
		else {
			var allevents = [];
			events.reduce(function(result, currentObject) {
			    for(var key in currentObject) {
		            allevents[allevents.length] = {
		            	'calendar': currentObject[key].creator.displayName,
		            	'summary': currentObject[key].summary ? currentObject[key].summary : null,
		            	'location': currentObject[key].location ? currentObject[key].location : null,
		            	'date': currentObject[key].start.dateTime ? new moment(currentObject[key].start.dateTime, rfc_3339) : new moment(currentObject[key].start.date, rfc_3339_date),
		            	'allday': currentObject[key].start.dateTime ? '0' : '1',
		            	'reminders': currentObject[key].reminders
		            };
			    }
			}, {});

			allevents.sort(function(a, b) {
				return (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0);
			}); 

			// Next 5 minutes OR today OR next day
			var start  = new moment();
			var end    = new moment(start).add(5, 'minutes');
			if (data.params.check == 'today') {
				end   = new moment(start).set('hour', 23).set('minute', 59).set('second', 59);
			}
			else if (data.params.check == 'tomorrow') {
				start = start.add(1, 'day').set('hour', 0).set('minute', 0).set('second', 0);
				end   = new moment(start).set('hour', 23).set('minute', 59).set('second', 59);
			}

			// Filter date/time
			var allevents = allevents.filter(function(event) {
				var begin = event.date;
				if (data.params.check != 'tomorrow' && !event.reminders.useDefault && event.reminders.overrides) {
					begin = begin.subtract(event.reminders.overrides[0].minutes, 'minutes');
				}

				if (data.params.check && data.params.check != 'next')
					return begin.isSame(start, 'year') && begin.isSame(start, 'month') && begin.isSame(start, 'day') ? event : undefined;
				else
					return begin.isBetween(start, end) ? event : undefined;
			});

			var tts = '';
			allevents.map(function(event) { 
				var horodatage = '';

				horodatage = toDay(event.date.day());
				if (event.allday == '0') {
					var minutes = event.date.format("mm");
					horodatage += ' à ' + event.date.format("HH") + ' heure ' + ((minutes != '00') ? minutes : '');
				}
				horodatage += ' : ';

				if (event.summary)
					tts +=  horodatage + event.summary + '. ';
			});

			if (tts.length == 0 && data.params.check) {
				if (data.params.check == 'next')
					tts = 'Il n\'y a rien dans l\'immédiat';
				else if (data.params.check == 'today')
					tts = 'Pour le moment rien de prévu pour aujourd\'hui';
				else if (data.params.check == 'tomorrow')
					tts = 'Le planning de demain est vide pour le moment';
			}

			//console.log(tts);

			callback({ "events": events, "tts": tts });
		}
	});
};

var getCalendarAuth = function(calendar) {
	var clientSecret = calendar.secret;
	var clientId = calendar.clientid;
	var redirectUrl = calendar.redirect_uris;
	
	var auth = new googleAuth();
	var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

	// Check if we have previously stored a token.
	if (!calendar.expiry_date) {
		getCalendarNewAuth(oauth2Client, calendar);
		return null;
	}

	oauth2Client.credentials = {
		"access_token"  : calendar.access_token,
		"token_type"    : calendar.token_type  ,
		"refresh_token" : calendar.refresh_token,
		"expiry_date"   : calendar.expiry_date 
	};

	return oauth2Client;
};

var getCalendarNewAuth = function(oauth2, calendar) {
	var authUrl = oauth2.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES
	});

	console.log('>>> Calendar ' + calendar.id);
	console.log('>>> Authorize this app by visiting this url: ', authUrl);
	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	rl.question('>>> Enter the code from that page here: ', function(code) {
		rl.close();
		oauth2.getToken(code, function(err, token) {
			if (err) {
				console.log('Error while trying to retrieve access token', err);
			}
			else {
				// store them only, next time we call calendar it will be ready for use
				storeToken(calendar, token);
			}
		});
	});
};

var storeToken = function(calendar, token) {
	var calendars = Config.modules.homeIA.calendar.calendars;

	for (var x in calendars) {
		if (calendars[x].id == calendar.id) {
			calendars[x].access_token  = token.access_token;
			calendars[x].token_type    = token.token_type;
			calendars[x].refresh_token = token.refresh_token;
			calendars[x].expiry_date   = token.expiry_date;

			SARAH.ConfigManager.save();
		
			info('Token information stored for calendar id=' + calendar.id);
		}
	}
};

var toDay = function(day) {
	var days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
	return days[day];
};
