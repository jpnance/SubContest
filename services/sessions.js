var crypto = require('crypto');

var Session = require('../models/Session');
var User = require('../models/User');

module.exports.showAll = function(request, response) {
	Session.withActiveSession(request, function(error, session) {
		if (error || !session || !session.user.admin) {
			response.redirect('/');
			return;
		}

		var data = [
			User.find({}).select('username').sort('username'),
			Session.find({})
		];

		Promise.all(data).then(function(values) {
			var responseData = {
				session: session,
				users: values[0],
				sessionUserActivityMap: {},
				totals: {
					users: 0,
					actives: 0,
					inactives: 0
				},
				dateFormat: require('dateformat')
			}

			var sessions = values[1];

			responseData.users.forEach(function(user) {
				responseData.sessionUserActivityMap[user.username] = {
					active: 0,
					inactive: 0,
					lastActivity: null
				};

				responseData.totals.users++;
			});

			sessions.forEach(function(session) {
				if (session.active) {
					responseData.sessionUserActivityMap[session.username].active++;
					responseData.totals.actives++;
				}
				else {
					responseData.sessionUserActivityMap[session.username].inactive++;
					responseData.totals.inactives++;
				}

				if (session.lastActivity > responseData.sessionUserActivityMap[session.username].lastActivity) {
					responseData.sessionUserActivityMap[session.username].lastActivity = session.lastActivity;
				}
			});

			response.render('sessions', responseData);
		});
	});
};
