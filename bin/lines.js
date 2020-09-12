var dotenv = require('dotenv').config({ path: __dirname + '/../.env' });

var request = require('superagent');

var Game = require('../models/Game');

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, { useUnifiedTopology: true, useNewUrlParser: true });

var teamAbbreviationOverrides = {
	WSH: 'WAS'
};

var teamNameToAbbreviation = {
	'49ERS': 'SF',
	BEARS: 'CHI',
	BENGALS: 'CIN',
	BILLS: 'BUF',
	BRONCOS: 'DEN',
	BROWNS: 'CLE',
	BUCCANEERS: 'TB',
	CARDINALS: 'ARI',
	CHARGERS: 'LAC',
	CHIEFS: 'KC',
	COLTS: 'IND',
	COWBOYS: 'DAL',
	DOLPHINS: 'MIA',
	EAGLES: 'PHI',
	FALCONS: 'ATL',
	GIANTS: 'NYG',
	JAGUARS: 'JAX',
	JETS: 'NYJ',
	LIONS: 'DET',
	PACKERS: 'GB',
	PANTHERS: 'CAR',
	PATRIOTS: 'NE',
	RAIDERS: 'LV',
	RAMS: 'LAR',
	RAVENS: 'BAL',
	SAINTS: 'NO',
	SEAHAWKS: 'SEA',
	STEELERS: 'PIT',
	TEXANS: 'HOU',
	TITANS: 'TEN',
	VIKINGS: 'MIN',
	WASHINGTON: 'WAS'
};

var gamePromises = [];

request.get('https://wfd.rarii.com/westgate/', function(error, response) {
	if (error) {
		console.log(error);
		process.exit();
	}

	var westgateData = JSON.parse(response.text);

	var season = westgateData.season;
	var week = westgateData.week;

	var lineLookup = {};

	westgateData.data.forEach(footballGame => {
		var favorite = teamNameToAbbreviation[footballGame.favorite];
		var underdog = teamNameToAbbreviation[footballGame.underdog];
		var line = parseFloat(footballGame.line).toFixed(1) || 0;

		lineLookup[favorite + '-' + underdog] = 1 * line;
		lineLookup[underdog + '-' + favorite] = -1 * line;

		var conditions = {
			season: season,
			week: week,

			'$or': [
				{ '$and': [ { 'awayTeam.abbreviation': favorite, 'homeTeam.abbreviation': underdog } ] },
				{ '$and': [ { 'awayTeam.abbreviation': underdog, 'homeTeam.abbreviation': favorite } ] }
			],

			line: { '$exists': false }
		};

		gamePromises.push(Game.findOne(conditions));
	});

	Promise.all(gamePromises).then(function(games) {
		var linePromises = [];

		games.forEach(game => {
			if (!game) {
				return;
			}

			var lineLookupKey = game.awayTeam.abbreviation + '-' + game.homeTeam.abbreviation;
			var line = lineLookup[lineLookupKey];

			game.line = line;

			if (process.argv.includes('update')) {
				linePromises.push(game.save());
			}
			else {
				console.log(lineLookupKey, lineLookup[lineLookupKey]);
			}
		});

		Promise.all(linePromises).then(function() {
			mongoose.disconnect();
		});
	});
});
