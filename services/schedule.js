var User = require('../models/User');
var Session = require('../models/Session');
var Game = require('../models/Game');
var Team = require('../models/Team');
var Classic = require('../models/Classic');

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

module.exports.showAllForTeam = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		Team.findOne({ abbreviation: request.params.teamAbbreviation }, function(error, team) {
			if (error) {
				response.sendStatus(500);
				return;
			}

			if (!team) {
				response.sendStatus(404);
				return;
			}

			var dataPromises = [
				Game.find({ season: process.env.SEASON, '$or': [ { 'home.team': team._id }, { 'away.team': team._id } ]}).sort('startTime').populate('away.team away.probablePitcher home.team home.probablePitcher'),
				Classic.find({ season: process.env.SEASON }).populate('user team')
			];

			Promise.all(dataPromises).then(function(values) {
				var games = values[0];
				var classics = values[1];

				games.forEach(function(game) {
					game.away.picks = [];
					game.home.picks = [];

					classics.forEach(function(classic) {
						if (session && session.user.username == classic.user.username) {
							if (classic.team._id == game.away.team._id) {
								game.away.team.classic = classic;
							}

							if (classic.team._id == game.home.team._id) {
								game.home.team.classic = classic;
							}
						}

						if (classic.picks.indexOf(game._id) > -1) {
							if (session && session.user.username == classic.user.username) {
								game.classic = classic;

								if (classic.team._id == game.away.team._id) {
									game.away.picked = true;
								}
								else if (classic.team._id == game.home.team._id) {
									game.home.picked = true;
								}
							}

							if (game.hasDefinitelyStarted()) {
								if (classic.team._id == game.away.team._id) {
									game.away.picks.push(classic);
								}

								if (classic.team._id == game.home.team._id) {
									game.home.picks.push(classic);
								}
							}
						}
					});

					game.away.picks.sort(Classic.populatedUserDisplayNameSort);
					game.home.picks.sort(Classic.populatedUserDisplayNameSort);
				});

				var responseData = {
					session: session,
					games: games,
					team: team
				};

				response.render('schedule/team', responseData);
			});
		});
	});
};

module.exports.showAllForDate = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
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
