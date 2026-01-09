var Session = require('../models/Session');
var User = require('../models/User');
var Game = require('../models/Game');

module.exports.edit = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		if (session && (request.params.username == session.user.username || session.user.admin)) {
			Game.findOne({ _id: request.params.gameId }).populate('awayTeam.team homeTeam.team').then(function(game) {
				var responseData = {
					game: game,
					session: session
				};

				response.render('games/edit', responseData);
			}).catch(function(error) {
				response.send(error);
			});
		}
		else {
			response.redirect('/');
		}
	});
};

module.exports.showAllForDate = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		var week = request.params.week;

		if (!week) {
			week = Game.getWeek();
		}

		week = Game.cleanWeek(week);

		if (session && session.user.admin) {
			Game.find({ season: process.env.SEASON, week: week }).populate('awayTeam.team homeTeam.team').sort('kickoff awayTeam.abbreviation').then(function(games) {
				response.render('games', { week: week, games: games, session: session });
			});
		}
		else {
			response.redirect('/');
		}
	});
};

module.exports.update = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		if (!session || !session.user.admin) {
			response.redirect('/');
			return;
		}

		var data = [
			Game.findOne({ _id: request.params.gameId }).populate('awayTeam.team homeTeam.team')
		];

		Promise.all(data).then(function(values) {
			var game = values[0];

			if (session.user.admin) {
				game.line = parseFloat(request.body.line).toFixed(1);
			}

			game.save().then(function() {
				response.redirect(`/games/${game.week}`);
			}).catch(function(error) {
				response.send(error);
			});
		});
	});
};
