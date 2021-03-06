var Session = require('../models/Session');
var User = require('../models/User');
var Game = require('../models/Game');
var Team = require('../models/Team');
var Classic = require('../models/Classic');

module.exports.showAllForUser = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		var verifyUser = new Promise(function(resolve, reject) {
			if (!request.params.username) {
				if (session) {
					resolve(session.user);
				}
				else {
					reject({ error: 'not querying for anything' });
				}
			}
			else {
				User.findOne({ username: request.params.username }).select('username firstName lastName').exec(function(error, user) {
					if (user) {
						resolve(user);
					}
					else {
						reject({ error: 'who' });
					}
				});
			}
		});

		verifyUser.then(function(user) {
			var data = [
				Team.find().sort('teamName'),
				Classic.find({ user: user._id, season: process.env.SEASON }).populate('team').populate({ path: 'picks', populate: { path: 'away.team home.team' } })
			];

			Promise.all(data).then(function(values) {
				var teams = values[0];
				var classics = values[1];

				teams.forEach(function(team) {
					classics.forEach(function(classic) {
						if (classic.team.abbreviation == team.abbreviation) {
							team.classic = classic;
							return;
						}
					});
				});

				classics.forEach(function(classic) {
					classic.picks.forEach(function(pick) {
						if (pick.away.team._id == classic.team._id) {
							pick.opponent = pick.home;
						}
						else if (pick.home.team._id == classic.team._id) {
							pick.opponent = pick.away;
						}
					});

					if (!session || session.username != user.username) {
						classic.picks = classic.picks.filter(function(game) {
							return game.hasDefinitelyStarted();
						});
					}

					classic.picks.sort(Classic.populatedPicksStartTimeSort);
				});

				response.render('classics/user', { session: session, teams: teams, user: user });
			});
		}).catch(function(error) {
			response.send(error);
		});
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
				Classic.find({ season: process.env.SEASON, team: team._id }).populate('team').populate({ path: 'picks', populate: { path: 'away.team home.team' } }),
				User.find({ seasons: process.env.SEASON }).select('displayName username').sort('displayName')
			];

			Promise.all(dataPromises).then(function(values) {
				var classics = values[0];
				var users = values[1];

				var processedUsers = [];

				users.forEach(function(user) {
					var processedUser = { displayName: user.displayName, username: user.username };

					classics.forEach(function(classic) {
						if (classic.user.toString() == user._id.toString()) {
							processedUser.classic = classic;

							classic.picks.forEach(function(pick) {
								if (pick.away.team._id == classic.team._id) {
									pick.opponent = pick.home;
								}
								else if (pick.home.team._id == classic.team._id) {
									pick.opponent = pick.away;
								}
							});

							if (!session || session.user._id.toString() != user._id.toString()) {
								classic.picks = classic.picks.filter(function(game) {
									return game.hasDefinitelyStarted();
								});
							}

							classic.picks.sort(Classic.populatedPicksStartTimeSort);
						}
					});

					processedUsers.push(processedUser);
				});

				response.render('classics/team', { session: session, users: processedUsers, team: team });
			});
		});
	});
};

module.exports.showStandings = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		var dataPromises = [
			User.find({ seasons: process.env.SEASON }),
			Game.find({ season: process.env.SEASON }).sort({ kickoff: 1 })
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

module.exports.all = function(request, response) {
	if (!request.query || !request.query.apiKey || request.query.apiKey != process.env.API_KEY) {
		response.sendStatus(401);
		return;
	}

	var season = parseInt(request.query.season) || process.env.SEASON;

	var dataPromises = [
		Classic.find({ season: season }).populate({ path: 'user', select: '-password -admin' }).populate('team').populate({ path: 'picks', populate: { path: 'away.team home.team' } })
	];

	Promise.all(dataPromises).then(function(values) {
		var classics = values[0];

		classics.forEach(function(classic) {
			classic.picks = classic.picks.filter(function(game) {
				return game.hasDefinitelyStarted();
			});
		});

		response.json(classics);
	});
};

module.exports.allForUser = function(request, response) {
	if (!request.query || !request.query.apiKey || request.query.apiKey != process.env.API_KEY) {
		response.sendStatus(401);
		return;
	}

	var verifyUser = new Promise(function(resolve, reject) {
		if (!request.params.username) {
			reject({ error: 'not querying for anything' });
		}
		else {
			User.findOne({ username: request.params.username }).select('username firstName lastName').exec(function(error, user) {
				if (user) {
					resolve(user);
				}
				else {
					reject({ error: 'who' });
				}
			});
		}
	});

	verifyUser.then(function(user) {
		var dataPromises = [
			Classic.find({ season: process.env.SEASON, user: user._id }).populate({ path: 'user', select: '-password -admin' }).populate('team').populate({ path: 'picks', populate: { path: 'away.team home.team' } })
		];

		Promise.all(dataPromises).then(function(values) {
			var classics = values[0];

			classics.forEach(function(classic) {
				classic.picks = classic.picks.filter(function(game) {
					return game.hasDefinitelyStarted();
				});
			});

			response.json(classics);
		});
	}).catch(function(error) {
		response.send(error);
	});
};
