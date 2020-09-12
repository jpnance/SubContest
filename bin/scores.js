var dotenv = require('dotenv').config({ path: __dirname + '/../.env' });

var request = require('superagent');

var Game = require('../models/Game');

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, { useUnifiedTopology: true, useNewUrlParser: true });

var teamAbbreviationOverrides = {
	WSH: 'WAS'
};

var gamePromises = [];

request.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', function(error, response) {
	if (error) {
		console.log(error);
		process.exit();
	}

	var scoreboardData = JSON.parse(response.text);

	if (scoreboardData.season.type != 2 && scoreboardData.season.year != process.env.SEASON) {
		return;
	}

	var season = scoreboardData.season.year;
	var week = scoreboardData.week.number;

	scoreboardData.events.forEach(footballGame => {
		var competition = footballGame.competitions[0];

		var team0 = competition.competitors[0].team;
		var team1 = competition.competitors[1].team;

		var awayTeam = (competition.competitors[0].homeAway == 'away') ? team0 : team1;
		var homeTeam = (competition.competitors[0].homeAway == 'home') ? team0 : team1;

		if (teamAbbreviationOverrides[awayTeam.abbreviation]) {
			awayTeam.abbreviation = teamAbbreviationOverrides[awayTeam.abbreviation];
		}

		if (teamAbbreviationOverrides[homeTeam.abbreviation]) {
			homeTeam.abbreviation = teamAbbreviationOverrides[homeTeam.abbreviation];
		}

		var conditions = {
			season: season,
			week: week,

			'awayTeam.abbreviation': awayTeam.abbreviation,
			'homeTeam.abbreviation': homeTeam.abbreviation
		};

		var startDate = competition.startDate;

		var updates = {
			'$set': {
				kickoff: new Date(startDate)
			}
		};

		if (competition.status.type.name == 'STATUS_FINAL') {
			var score0 = parseInt(competition.competitors[0].score);
			var score1 = parseInt(competition.competitors[1].score);

			updates['$set']['awayTeam.score'] = (awayTeam.id == team0.id) ? score0 : score1;
			updates['$set']['homeTeam.score'] = (homeTeam.id == team0.id) ? score0 : score1;
		}

		console.log(conditions, updates);

		if (process.argv.includes('update')) {
			gamePromises.push(Game.findOneAndUpdate(conditions, updates, { returnOriginal: false, useFindAndModify: false }));
		}
	});

	Promise.all(gamePromises).then(function(games) {
		var winnerPromises = [];

		games.forEach(game => {
			if (game.line && game.awayTeam.score && game.homeTeam.score) {
				if (game.homeTeam.score + game.line > game.awayTeam.score) {
					game.winner = game.homeTeam.abbreviation;
					game.push = undefined;
				}
				else if (game.homeTeam.score + game.line < game.awayTeam.score) {
					game.winner = game.awayTeam.abbreviation;
					game.push = undefined;
				}
				else {
					game.winner = undefined;
					game.push = true;
				}

				winnerPromises.push(game.save());
			}
		});

		Promise.all(winnerPromises).then(function() {
			mongoose.disconnect();
		});
	});
});
