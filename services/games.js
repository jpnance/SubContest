var User = require('../models/User');
var Game = require('../models/Game');

module.exports.edit = function(request, response) {
	Game.findOne({ _id: request.params.gameId }).populate('awayTeam.team homeTeam.team').then(function(game) {
		response.render('games/edit', { game: game, session: request.session });
	}).catch(function(error) {
		response.send(error);
	});
};

module.exports.showAllForDate = function(request, response) {
	var week = request.params.week;

	if (!week) {
		week = Game.getWeek();
	}

	week = Game.cleanWeek(week);

	Game.find({ season: process.env.SEASON, week: week }).populate('awayTeam.team homeTeam.team').sort('kickoff awayTeam.abbreviation').then(function(games) {
		response.render('games', { week: week, games: games, session: request.session });
	});
};

module.exports.update = function(request, response) {
	Game.findOne({ _id: request.params.gameId }).populate('awayTeam.team homeTeam.team').then(function(game) {
		game.line = parseFloat(request.body.line).toFixed(1);

		game.save().then(function() {
			response.redirect(`/games/${game.week}`);
		}).catch(function(error) {
			response.send(error);
		});
	});
};
