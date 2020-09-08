var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var teamSchema = new Schema({
	_id: { type: Number },
	abbreviation: { type: String, required: true },
	location: { type: String, required: true },
	mascot: { type: String, required: true }
});

module.exports = mongoose.model('Team', teamSchema);
