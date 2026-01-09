var User = require('../models/User');

module.exports.loginPrompt = function(request, response) {
	var responseData = { session: request.session };

	if (request.query.error == 'invalid-email') {
		responseData.error = { message: 'Invalid email address.' };
	}
	else if (request.query.error == 'not-found') {
		responseData.error = { message: 'No user found for that email address.' };
	}
	else if (request.query.error == 'unknown') {
		responseData.error = { message: 'Unknown server error.' };
	}
	else if (request.query.success == 'email-sent') {
		responseData.success = { message: 'Check your email for your login link!' };
	}

	response.render('users/login', responseData);
};

module.exports.add = function(request, response) {
	response.render('users/add', { session: request.session });
};

module.exports.edit = function(request, response) {
	User.findOne({ username: request.params.username }).then(function(user) {
		response.render('users/edit', { user: user, session: request.session });
	}).catch(function(error) {
		response.send(error);
	});
};

module.exports.showAll = function(request, response) {
	User.find({}).sort({ username: 1 }).then(function(users) {
		response.render('users', { users: users, session: request.session });
	});
};

module.exports.signUp = function(request, response) {
	if (!request.body.username) {
		response.status(400).send('No username supplied');
		return;
	}

	var user = new User({
		username: request.body.username,
		firstName: request.body.firstName,
		lastName: request.body.lastName,
		displayName: request.body.displayName ? request.body.displayName : request.body.firstName
	});

	if (request.body.eligible == 'on') {
		user.makeEligibleFor(process.env.SEASON);
	}
	else {
		user.makeUneligibleFor(process.env.SEASON);
	}

	user.save().then(function() {
		response.redirect('/');
	}).catch(function(error) {
		response.status(400).send(error);
	});
};

module.exports.update = function(request, response) {
	User.findOne({ username: request.params.username }).then(function(user) {
		user.firstName = request.body.firstName;
		user.lastName = request.body.lastName;
		user.displayName = request.body.displayName;

		if (request.body.eligible == 'on') {
			user.makeEligibleFor(process.env.SEASON);
		}
		else {
			user.makeUneligibleFor(process.env.SEASON);
		}

		user.save().then(function() {
			response.redirect('/users');
		}).catch(function(error) {
			response.send(error);
		});
	});
};
