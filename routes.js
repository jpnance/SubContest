var users = require('./services/users');
var sessions = require('./services/sessions');
var schedule = require('./services/schedule');
var classics = require('./services/classics');
var teams = require('./services/teams');

var Session = require('./models/Session');

module.exports = function(app) {
	app.get('/', schedule.showAllForDate);

	app.get('/preview', function(request, response) {
		response.cookie('gateKey', process.env.GATE_KEY).redirect('/');
	});
	app.get('/unpreview', function(request, response) {
		response.clearCookie('gateKey').redirect('/');
	});

	app.get('/login', users.loginPrompt);
	app.get('/logout', sessions.logOut);

	app.get('/users', users.showAll);
	app.get('/users.json', users.all);
	app.get('/users/add', users.add);
	app.post('/users/add', users.signUp);
	app.get('/users/edit/:username', users.edit);
	app.post('/users/edit/:username', users.update);

	app.get('/schedule/?', schedule.showAllForDate);
	app.get('/schedule.json', schedule.allForDate);
	app.get('/schedule/:week(\\d\\d?)', schedule.showAllForDate);
	app.get('/schedule/:teamAbbreviation(\\w+)', schedule.showAllForTeam);

	app.get('/pick/:teamId/:gameId', classics.pick);
	app.get('/unpick/:teamId/:gameId', classics.unpick);
	app.get('/standings', classics.showStandings);

	app.get('/teams', teams.showAll);

	app.get('/rules', function(request, response) {
		Session.withActiveSession(request, function(error, session) {
			response.render('rules', { session: session });
		});
	});
};
