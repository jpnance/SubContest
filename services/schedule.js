var User = require('../models/User');
var Game = require('../models/Game');
var Team = require('../models/Team');

var dateFormat = require('dateformat');

module.exports.showAll = function(request, response) {
	var data = [
		Game.find().sort('startTime').populate('away.team').populate('home.team')
	];

	Promise.all(data).then(function(values) {
		var games = values[0];

		response.render('index', { games: games });
	});
};

module.exports.showAllForDate = function(request, response) {
	var session = request.session;
	var week = request.params.week;

	if (!week) {
		week = Game.getWeek();
	}

	week = Game.cleanWeek(week);

	var data = [
		Game.find({ season: process.env.SEASON, week: week }).sort('startTime awayTeam.abbreviation').populate('awayTeam.team homeTeam.team'),
		User.find({ seasons: process.env.SEASON })
	];

	Promise.all(data).then(function(values) {
		var games = values[0];
		var users = values[1];

		var usersMap = {};

		users.forEach(user => {
			usersMap[user.username] = user.displayName;
		});

		games.forEach(function(game) {
			game.awayTeam.picks = [];
			game.homeTeam.picks = [];

			if (!game.picks) {
				return;
			}

			Object.keys(game.picks).forEach(key => {
				if (game.picks[key] == game.awayTeam.abbreviation) {
					game.awayTeam.picks.push(usersMap[key]);
				}
				else if (game.picks[key] == game.homeTeam.abbreviation) {
					game.homeTeam.picks.push(usersMap[key]);
				}

				if (session && key == session.username) {
					game.sessionPick = game.picks[key];
				}
			});

			game.awayTeam.picks.sort();
			game.homeTeam.picks.sort();
		});

		games.sort(Game.progressSortWithPopulatedTeams);

		var responseData = {
			session: session,
			games: games,
			week: week
		};

		response.render('schedule/all', responseData);
	});
};

module.exports.allForDate = function(request, response) {
	if (!request.query || !request.query.apiKey || request.query.apiKey != process.env.API_KEY) {
		response.sendStatus(401);
		return;
	}

	var dataPromises = [
		Game.find({ date: request.query.date }).populate('away.team home.team')
	];

	Promise.all(dataPromises).then(function(values) {
		var games = values[0];

		response.json(games);
	});
};
