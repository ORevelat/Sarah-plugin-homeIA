var moment = require('moment');

moment.locale('fr')

exports.do_init = function() {
};

exports.do_cron = function(words, data, callback) { 
};

exports.do_main = function(words, data, callback) {
	console.log('\x1b[91mmode TIME \x1b[0m');

	var pluginProps = Config.modules.homeIA.time;

	var text = '';
	if (data.params.cmd == "time")
		text = getTimeMessage();
	else if (data.params.cmd == "date")
		text = getDateMessage();
	else if ((data.params.cmd == "week_today") || (data.params.cmd == "week_tomorrow"))
		text = getWeekMessage(data.params.cmd == "week_today")

	callback({'tts': text});
};

function weekNumber() {
	var date = new Date();
	date.setHours(0, 0, 0, 0);
  
  	// Thursday in current week decides the year.
  	date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  
	// January 4 is always in week 1.
	var week1 = new Date(date.getFullYear(), 0, 4);

	// Adjust to Thursday in week 1 and count number of weeks from date to week1.
	return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

function getTimeMessage() {
	var date = new Date();

	var text = 'il est ';
	if (date.getHours() == 0)
		text += 'minuit ';
	else
		text +=  date.getHours() + ' heure ';
	if (date.getMinutes() > 0)
		text += date.getMinutes();

	return text;
};

function getDateMessage() {
	var text = 'nous sommes le ' + moment().format('dddd, DD MMMM YYYY');
	text += ' , et ';
	text += getTimeMessage();

	return text;
};

function getWeekMessage(forToday) {
	var weeknumber = weekNumber();
	
	var text = 'nous sommes ';
	if (forToday === false) {
		text = 'nous serons ';
		weeknumber += 1;
	}

	text = text + ' en semaine ' + weeknumber + ', semaine ' + ((weeknumber%2 == 0) ? 'A' : 'B') + ' pour théa.';

	return text;
};
