var users = require('./services/users');
var schedule = require('./services/schedule');
var classics = require('./services/classics');
var games = require('./services/games');

var { requireLogin, requireAdmin } = require('./auth/middleware');

module.exports = function(app) {
	app.get('/', schedule.showAllForDate);

	app.get('/login', users.loginPrompt);

	app.get('/users', requireAdmin, users.showAll);
	app.get('/users/add', requireAdmin, users.add);
	app.post('/users/add', requireAdmin, users.signUp);
	app.get('/users/edit/:username', requireAdmin, users.edit);
	app.post('/users/edit/:username', requireAdmin, users.update);

	app.get('/schedule/?', schedule.showAllForDate);
	app.get('/schedule.json', schedule.allForDate);
	app.get('/schedule/:week(\\d\\d?)', schedule.showAllForDate);

	app.get('/games', requireAdmin, games.showAllForDate);
	app.get('/games/:week(\\d\\d?)', requireAdmin, games.showAllForDate);
	app.get('/games/edit/:gameId', requireAdmin, games.edit);
	app.post('/games/edit/:gameId', requireAdmin, games.update);

	app.get('/pick/:teamId/:gameId', requireLogin, classics.pick);
	app.get('/unpick/:teamId/:gameId', requireLogin, classics.unpick);
	app.get('/standings', classics.showStandings);
	app.get('/standings/:season(\\d{4})', classics.showStandings);

	app.get('/rules', function(request, response) {
		response.render('rules', { session: request.session });
	});
};
