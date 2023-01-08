var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Team = require('../models/Team');
var Player = require('../models/Player');

var gameSchema = new Schema({
	_id: { type: Schema.Types.ObjectId },
	season: { type: Number, required: true, default: process.env.SEASON },
	awayTeam: {
		abbreviation: { type: String, ref: 'Team', required: true },
		score: { type: Number }
	},
	homeTeam: {
		abbreviation: { type: String, ref: 'Team', required: true },
		score: { type: Number }
	},
	kickoff: { type: Date },
	week: { type: Number, required: true },
	status: {
		code: { type: String, required: true },
		quarter: { type: Number },
		clock: { type: String }
	},
	line: { type: Number },
	picks: { type: Object, default: {} },
	winner: { type: String, ref: 'Team' },
	push: { type: Boolean }
});

gameSchema.virtual('awayTeam.team', {
	ref: 'Team',
	localField: 'awayTeam.abbreviation',
	foreignField: 'abbreviation',
	justOne: true
});

gameSchema.virtual('homeTeam.team', {
	ref: 'Team',
	localField: 'homeTeam.abbreviation',
	foreignField: 'abbreviation',
	justOne: true
});

gameSchema.methods.hasStartTime = function() {
	return this.kickoff;
};

gameSchema.methods.isPastStartTime = function() {
	return this.kickoff && Date.now() >= this.kickoff;
};

gameSchema.methods.hasDefinitelyStarted = function() {
	return this.status.code == 'STATUS_IN_PROGRESS';
};

gameSchema.methods.hasPotentiallyStarted = function() {
	return this.isPastStartTime();
};

gameSchema.methods.isCool = function(hours) {
	var later = new Date(this.kickoff);
	later.setMinutes(later.getMinutes() + 210);

	return Date.now() >= later;
};

gameSchema.methods.isAtEndOfQuarter = function() {
	return this.status.code == 'STATUS_END_PERIOD';
};

gameSchema.methods.isAtHalftime = function() {
	return this.status.code == 'STATUS_HALFTIME';
};

gameSchema.methods.isCanceled = function() {
	return this.status.code == 'STATUS_CANCELED';
};

gameSchema.methods.isFinal = function() {
	return this.status.code == 'STATUS_FINAL' && this.awayTeam.score != null && this.homeTeam.score != null;
};

gameSchema.methods.isFinalAndCool = function() {
	return this.isFinal() && this.isCool();
};

gameSchema.methods.isOver = function() {
	return this.isFinal() || this.isCanceled();
};

gameSchema.methods.syncWithApi = function() {
	var thisGame = this;

	return new Promise(function(resolve, reject) {
		var request = require('superagent');

		var Status = require('../models/Status');

		request.get('https://statsapi.mlb.com/api/v1.1/game/' + thisGame._id + '/feed/live', function(error, response) {
			if (error) {
				reject(error);
				return;
			}

			if (!response || !response.text) {
				reject('not really sure but bad');
				return;
			}

			var playerPromises = [];

			var data = JSON.parse(response.text);

			if (!data.liveData || !data.liveData.linescore || !data.liveData.linescore.teams) {
				resolve('fine');
				return;
			}

			if (data.gameData.probablePitchers) {
				var pitcherIds = [];

				if (!data.gameData.probablePitchers.away) {
					thisGame.away.probablePitcher = undefined;
				}
				else if (thisGame.away.probablePitcher != data.gameData.probablePitchers.away.id) {
					thisGame.away.probablePitcher = data.gameData.probablePitchers.away.id;
					pitcherIds.push(data.gameData.probablePitchers.away.id);
				}

				if (!data.gameData.probablePitchers.home) {
					thisGame.home.probablePitcher = undefined;
				}
				else if (thisGame.home.probablePitcher != data.gameData.probablePitchers.home.id) {
					thisGame.home.probablePitcher = data.gameData.probablePitchers.home.id;
					pitcherIds.push(data.gameData.probablePitchers.home.id);
				}

				pitcherIds.forEach(function(pitcherId) {
					playerPromises.push(new Promise(function(resolve2, reject2) {
						request.get('https://statsapi.mlb.com/api/v1/people/' + pitcherId, function(error, response) {
							if (error) {
								reject2(error);
								return;
							}

							if (!response || !response.text) {
								reject2('not really sure but bad');
								return;
							}

							var playerData = JSON.parse(response.text);
							var player = playerData.people[0];

							var newPlayer = {
								number: player.primaryNumber,
								name: player.firstLastName,
								position: player.primaryPosition.abbreviation,
								bats: player.batSide.code,
								throws: player.pitchHand.code
							};

							if (player.nickName) {
								newPlayer.nickname = player.nickName;
							}

							Player.findByIdAndUpdate(player.id, newPlayer, { upsert: true }).then(function() {
								resolve2('good');
							}).catch(function() {
								reject2('dunno sorry');
							});
						});
					}));
				});
			}

			thisGame.kickoff = data.gameData.datetime.dateTime;
			thisGame.date = data.gameData.datetime.originalDate;
			thisGame.status = data.gameData.status;

			if (data.gameData.game.doubleHeader == 'Y' || data.gameData.game.doubleHeader == 'S') {
				thisGame.gameNumber = data.gameData.game.gameNumber;
			}
			else {
				thisGame.gameNumber = undefined;
			}

			playerPromises.push(Status.update(data.gameData.status, { '$set': { example: thisGame._id } }, { upsert: true }));

			if (thisGame.status.statusCode == 'I' || thisGame.status.statusCode == 'MA' || thisGame.status.statusCode == 'MF' || thisGame.status.statusCode == 'MI' || thisGame.status.statusCode == 'O' || thisGame.status.statusCode == 'UR' || thisGame.status.statusCode == 'F' || thisGame.status.statusCode == 'FR') {
				thisGame.away.score = data.liveData.linescore.teams.away.runs;
				thisGame.home.score = data.liveData.linescore.teams.home.runs;

				thisGame.inning.number = data.liveData.linescore.currentInning;
				thisGame.inning.ordinal = data.liveData.linescore.currentInningOrdinal;
				thisGame.inning.state = data.liveData.linescore.inningState;
				thisGame.inning.half = data.liveData.linescore.inningHalf;
			}

			if (thisGame.status.statusCode == 'F' || thisGame.status.statusCode == 'FR') {
				if (thisGame.away.score > thisGame.home.score) {
					thisGame.away.winner = true;
					thisGame.home.winner = false;
				}
				else if (thisGame.home.score > thisGame.away.score) {
					thisGame.home.winner = true;
					thisGame.away.winner = false;
				}
			}

			Promise.all(playerPromises).then(function() {
				thisGame.save(function(error) {
					if (error) {
						reject(error);
					}
					else {
						resolve(thisGame);
					}
				});
			}).catch(function(error) {
				console.log(error);
			});
		}).timeout({ response: 5000, deadline: 60000 }).retry(3);
	});
};

gameSchema.statics.progressSortWithPopulatedTeams = function(a, b) {
	if (a.isOver() && !b.isOver()) {
		return 1;
	}
	else if (!a.isOver() && b.isOver()) {
		return -1;
	}
	else {
		if (a.hasStartTime() && !b.hasStartTime()) {
			return -1;
		}
		else if (!a.hasStartTime() && b.hasStartTime()) {
			return 1;
		}
		else {
			if (a.kickoff < b.kickoff) {
				return -1;
			}
			else if (a.kickoff > b.kickoff) {
				return 1;
			}
			else {
				if (a.awayTeam.abbreviation < b.awayTeam.abbreviation) {
					return -1;
				}
				else if (a.awayTeam.abbreviation > b.awayTeam.abbreviation) {
					return 1;
				}
				else {
					return 0;
				}
			}
		}
	}
};

gameSchema.statics.getWeek = function(date) {
	var now = new Date();

	if (date) {
		now = new Date(date);
	}

	var start = new Date(process.env.OPENING_WEEK_WEDNESDAY);
	var days = Math.floor((now - start) / 86400000);

	if (days < 7) {
		week = 1;
	}
	else {
		week = Math.floor((days / 7) + 1);
	}

	return week;
};

gameSchema.statics.cleanWeek = function(week) {
	if (week < 1) {
		week = 1;
	}
	else if (week > 18) {
		week = 18;
	}

	return week;
};

module.exports = mongoose.model('Game', gameSchema);
