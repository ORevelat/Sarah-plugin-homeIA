
exports.do_init = function() {
};

exports.do_cron = function(words, data, callback) { 
};

exports.do_main = function(words, data, callback) {
	console.log('\x1b[91mmode WEATHER \x1b[0m');

	var pluginProps = Config.modules.homeIA.weather;
	if (!pluginProps.zip) {
		console.log("Missing Weather config in prop file");
		callback({'tts' : 'Configuration invalide'});
		return;
	}

	var zipcode = data.zip || pluginProps.zip;

	var makeYqlQuery = function(city) {
		return "select * from weather.forecast where woeid in (select woeid from geo.places(1) where text='" + city + "') and u='c'";
	}
	
	var baseurl = "https://query.yahooapis.com/v1/public/yql";
	var yql_query = makeYqlQuery(zipcode);
	
	var url = baseurl + "?format=json&lang=fr-FR&q=" + encodeURI(yql_query);

	var request = require('request');

	request({ 'uri' : url }, function (err, response, body) {
		if (err || response.statusCode != 200) {
			callback({'tts': "Désolé mais je n'ai pas trouvé les informations demandées"});
			return;
		}

		var result = JSON.parse(body);
		var tts = getPrevision(result.query.results.channel, data.date || pluginProps.date);
		
		callback({'tts': tts});
  	});
};

var translateToFrench = function(translate)
{
	var textMapping = {
		"partly cloud"            :"Partiellement Nuageux",
		"showers"                 :"Pluie",
		"partly cloudy"           :"Nuageux",
		"am showers"              :"Averses dans la matinée",
		"pm showers"              :"Averses dans l'après-midi",
		"pm thunderstorms"        :"Orageux dans l'après-midi",
		"scattered thunderstorms" :"Orages éparses",
		"light rain with thunder" :"Pluie légère accompagnée d'orages",
		"thunderstorms"           :"Orages",
		"heavy rain"              :"Pluie persisante",
		"mostly sunny"            :"Assez Ensoleillé",
		"light rain"              :"Pluie légère",
		"fog"                     :"Brouillard",
		"fair"                    :"Beau Temps",
		"sunny"                   :"Ensoleillé",
		"am rain"                 :"Pluie dans la matinée",
		"pm rain"                 :"Pluie dans l'après-midi",
		"mostly cloudy"           :"Plutôt nuageux",
		"isolated thunderstorms"  :"Orages éparses",
		"thundershowers"          :"Orages",
		"heavy thunderstorms"     :"Orages Violents",
		"clear"                   :"Temps Clair",
		"rain"                    :"Pluie",
		"cloudy"                  :"Nuageux",
		"scattered showers"       :"Averses éparses"
	};

	return textMapping[translate.toLowerCase()];
}

var getDayName = function(timestamp) {
	var days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

	var searchDate = new Date(timestamp);
	searchDate.setHours(0, 0, 0, 0);

    return days[searchDate.getDay()];
};

var getCurrentCondition = function (meteo) {
	var forecast = meteo.item.condition;
    
	var out = "actuellement à " + meteo.location.city;
	out += " , ";
	out += translateToFrench(forecast.text);
	out += " et une température de ";
	out += Math.round(parseFloat(forecast.temp)) + " degrés";
	
	return out;
};

var getForecastCondition = function (meteo, date) {
	var numDaySearch = false;
	
	if (date == 'lundi')         { numDaySearch = 1;}
  	else if (date == 'mardi')    { numDaySearch = 2;}
  	else if (date == 'mercredi') { numDaySearch = 3;}
  	else if (date == 'jeudi')    { numDaySearch = 4;}
  	else if (date == 'vendredi') { numDaySearch = 5;}
  	else if (date == 'samedi')   { numDaySearch = 6;}
  	else if (date == 'dimanche') { numDaySearch = 0;}

	var today = new Date();
  	var numToday = today.getDay();
  	var index = 0;

  	if (numDaySearch === false)
    	index = date;
  	else
  	{
	    if (numDaySearch >= numToday)
    	  index = numDaySearch - numToday;
    	else
      		index = 7 - (numToday - numDaySearch);
  	}
	
	var dateToFind = new Date();
	dateToFind.setHours(0,0,0,0);
	dateToFind.setDate(dateToFind.getDate() + parseInt(index));

	var forecast = meteo.item.forecast;
	
	var found = null;
    for(var i = 0, len = forecast.length; i < len; i++)
    {
		var forecastDate = new Date(forecast[i].date);
        if (forecastDate.toString() == dateToFind.toString()) {
            found = forecast[i];
            break;
        }
	}
	
	if (found === null)
		return "désolé mais je ne dispose pas encore de ces prévisions";

	var out = getDayName(found.date) + " à " + meteo.location.city;
	out += " , ";
	out += translateToFrench(found.text);
	out += " et des température entre ";
	out += Math.round(parseFloat(found.low)) + " et ";
	out += Math.round(parseFloat(found.high)) + " degrés";
	
	return out;
};

var getPrevision = function (meteo, date) {
	if (date == "-1")
	    return getCurrentCondition(meteo);
    else
        return getForecastCondition(meteo, date);
};
