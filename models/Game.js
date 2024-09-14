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
