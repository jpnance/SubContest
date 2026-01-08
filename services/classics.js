var Session = require('../models/Session');
var User = require('../models/User');
var Game = require('../models/Game');
var Team = require('../models/Team');

module.exports.showStandings = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		var season = request.params.season || process.env.SEASON;

		var dataPromises = [
			User.find({ seasons: season }),
			Game.find({ season: season }).sort({ kickoff: 1 })
		];

		Promise.all(dataPromises).then(function(values) {
			var users = values[0];
			var games = values[1];

			var week = Game.cleanWeek(Game.getWeek());

			var standingsMap = {};
			var standings = [];

			users.forEach(function(user) {
				if (!standingsMap[user.username]) {
					standingsMap[user.username] = {
						rank: null,
						user: user,
						weekPicks: [],
						points: 0
					};
				}
			});

			games.forEach(function(game) {
				if (game.picks) {
					Object.keys(game.picks).forEach(function(username) {
						var userPick = game.picks[username];

						if (!userPick) {
							return;
						}
						else if (game.winner && game.winner == userPick) {
							standingsMap[username].points += 1;
						}
						else if (game.push) {
							standingsMap[username].points += 0.5;
						}

						if (game.week == week && game.isPastStartTime()) {
							var weekPick = {};

							weekPick.team = userPick;

							if (game.isFinal()) {
								if (game.winner && userPick == game.winner) {
									weekPick.result = 'win';
								}
								else if (game.winner && userPick != game.winner) {
									weekPick.result = 'loss';
								}
								else if (game.push) {
									weekPick.result = 'push';
								}
							}
							else if (game.isCanceled()) {
								weekPick.result = 'loss';
							}

							standingsMap[username].weekPicks.push(weekPick);
						}
					});
				}
			});

			Object.keys(standingsMap).forEach(function(key) {
				standings.push(standingsMap[key]);
			});

			standings = standings.sort(function(a, b) {
				if (a.points > b.points) {
					return -1;
				}
				else if (a.points < b.points) {
					return 1;
				}
				else {
					if (a.user.displayName < b.user.displayName) {
						return -1;
					}
					else if (a.user.displayName > b.user.displayName) {
						return 1;
					}
				}
			});

			for (var i = 0; i < standings.length; i++) {
				if (i == 0) {
					standings[i].rank = i + 1;
				}
				else if (standings[i].points != standings[i - 1].points) {
					standings[i].rank = i + 1;
				}
			}

			response.render('standings', { session: session, week: week, standings: standings });
		});
	});
};

module.exports.pick = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		if (error) {
			response.send(error);
			return;
		}

		if (!session.user.isEligibleFor(process.env.SEASON)) {
			response.status(403).send({ message: 'You are not eligible for this season.' });
			return;
		}

		var data = [
			Game.findById(request.params.gameId)
		];

		Promise.all(data).then(function(values) {
			var game = values[0];

			if (game.isPastStartTime()) {
				response.status(403).send({ message: 'It\'s already past that game\'s start time.' });
				return;
			}

			if (game.awayTeam.abbreviation != request.params.teamId && game.homeTeam.abbreviation != request.params.teamId) {
				response.status(403).send({ message: 'That team isn\'t playing in that game.' });
				return;
			}

			var existingWeekPicksPromiseParameters = {
				season: process.env.SEASON,
				week: game.week,
				'$and': [
					{ 'awayTeam.abbreviation': { '$ne': game.awayTeam.abbreviation } },
					{ 'homeTeam.abbreviation': { '$ne': game.homeTeam.abbreviation } }
				]
			};

			existingWeekPicksPromiseParameters['picks.' + session.username] = { '$exists': true };

			var existingWeekPicksPromises = [
				Game.find(existingWeekPicksPromiseParameters)
			];

			Promise.all(existingWeekPicksPromises).then(function(values) {
				var existingWeekPicks = values[0];
				var gamePromises = [];

				if (existingWeekPicks.length > 4) {
					response.status(403).send({ message: 'You\'ve already made five picks this week.' });
					return;
				}
				else {
					game.set('picks.' + session.username, request.params.teamId, { strict: false });
					gamePromises.push(game.save());
				}

				Promise.all(gamePromises).then(function() {
					response.send({
						success: true,
						gameId: game._id,
						teamId: game.picks[session.username]
					});
				}).catch(function (error) {
					response.status(500).send({ message: 'Unknown server error', error: error });
				});
			});
		});
	});
};

module.exports.unpick = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		if (error) {
			response.send(error);
			return;
		}

		if (!session.user.isEligibleFor(process.env.SEASON)) {
			response.status(403).send({ message: 'You are not eligible for this season.' });
			return;
		}

		var data = [
			Game.findById(request.params.gameId)
		];

		Promise.all(data).then(function(values) {
			var game = values[0];

			if (game.isPastStartTime()) {
				response.status(403).send({ message: 'It\'s already past that game\'s start time.' });
				return;
			}

			if (game.awayTeam.abbreviation != request.params.teamId && game.homeTeam.abbreviation != request.params.teamId) {
				response.status(403).send({ message: 'That team isn\'t playing in that game.' });
				return;
			}

			var gamePromises = [];

			game.set('picks.' + session.username, undefined, { strict: false });
			gamePromises.push(game.save());

			Promise.all(gamePromises).then(function() {
				response.send({
					success: true,
					gameId: game._id
				});
			});
		});
	});
};
