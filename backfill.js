const dotenv = require('dotenv').config({ path: '/app/.env' });

const mongoose = require('mongoose');
const mongoUri = process.env.MONGODB_URI || null;

mongoose.connect(mongoUri);

const User = require('./models/User');
const Game = require('./models/Game');

User.find({}).then(handleUsers).then(disconnect);

function handleUsers(users) {
	return Promise.all(users.map(convertUsername));
}

function disconnect() {
	mongoose.disconnect();
	process.exit();
}

function convertUsername(user) {
	const { firstName, lastName, username } = user;
	const newUsername = [firstName, lastName].join('-').toLowerCase().replace(/[']/g, '');

	user.username = newUsername;

	const promises = [];

	promises.push(user.save());

	if (username != newUsername) {
		promises.push(Game.updateMany({ [`picks.${username}`]: { '$exists': true } }, { '$rename': { [`picks.${username}`]: `picks.${newUsername}` } }));
	}

	return Promise.all(promises);
}
