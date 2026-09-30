var dotenv = require('dotenv').config({ path: __dirname + '/../.env' });

var request = require('superagent');
var pdf = require('pdf-parse');
var cheerio = require('cheerio');

var Game = require('../models/Game');
var notifications = require('../helpers/notifications');

var WESTGATE_GAMES_EXPECTED = 16;

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

var WESTGATE_SEASON = 2026;
var WESTGATE_INIT_DATE = { 2026: new Date(2026, 8, 9, 17, 0, 0) };
var WESTGATE_URL_FMT =
	'https://www.westgateresorts.com/supercontest/download/2026%20SUPERCONTEST%20GAME%20SHEET%20WEEK%20{}.pdf?contest=/2026/SuperContest/Card';
var WESTGATE_CARD_URL =
	'https://www.westgateresorts.com/hotels/nevada/las-vegas/westgate-las-vegas-resort-casino/casino/2026-supercontest-card/';
var WESTGATE_CARD_URL_FMT = 'https://www.westgateresorts.com{}';
var WESTGATE_GAME_SHEET_HREF_RE = /GAME\s+SHEET\s+WEEK\s+(\d+)\.pdf/i;

var westgateTeamNames = new Set([
	'49ERS',
	'BEARS',
	'BENGALS',
	'BILLS',
	'BRONCOS',
	'BROWNS',
	'BUCCANEERS',
	'CARDINALS',
	'CHARGERS',
	'CHIEFS',
	'COLTS',
	'COMMANDERS',
	'COWBOYS',
	'DOLPHINS',
	'EAGLES',
	'FALCONS',
	'GIANTS',
	'JAGUARS',
	'JETS',
	'LIONS',
	'PACKERS',
	'PANTHERS',
	'PATRIOTS',
	'RAIDERS',
	'RAMS',
	'RAVENS',
	'SAINTS',
	'SEAHAWKS',
	'STEELERS',
	'TEXANS',
	'TITANS',
	'VIKINGS'
]);

var westgateTeamNameFixes = {
	BUCCANERS: 'BUCCANEERS',
	BELGALS: 'BENGALS',
	COMANDERS: 'COMMANDERS'
};

var teamAbbreviationOverrides = {
	WSH: 'WAS'
};

var teamNameToAbbreviation = {
	'49ERS': 'SF',
	BEARS: 'CHI',
	BENGALS: 'CIN',
	BILLS: 'BUF',
	BRONCOS: 'DEN',
	BROWNS: 'CLE',
	BUCCANEERS: 'TB',
	CARDINALS: 'ARI',
	CHARGERS: 'LAC',
	CHIEFS: 'KC',
	COLTS: 'IND',
	COMMANDERS: 'WAS',
	COWBOYS: 'DAL',
	DOLPHINS: 'MIA',
	EAGLES: 'PHI',
	FALCONS: 'ATL',
	GIANTS: 'NYG',
	JAGUARS: 'JAX',
	JETS: 'NYJ',
	LIONS: 'DET',
	PACKERS: 'GB',
	PANTHERS: 'CAR',
	PATRIOTS: 'NE',
	RAIDERS: 'LV',
	RAMS: 'LAR',
	RAVENS: 'BAL',
	SAINTS: 'NO',
	SEAHAWKS: 'SEA',
	STEELERS: 'PIT',
	TEXANS: 'HOU',
	TITANS: 'TEN',
	VIKINGS: 'MIN'
};

function westgateWeek(date) {
	date = date || new Date();
	var init = WESTGATE_INIT_DATE[WESTGATE_SEASON];
	var days = Math.floor((date - init) / (24 * 60 * 60 * 1000));
	return Math.max(Math.min(Math.floor(days / 7), 17), 0) + 1;
}

function westgateProcessTeamName(name) {
	return westgateTeamNameFixes[name] || name;
}

function westgateParseTeamChunk(chunk) {
	var starred = chunk.endsWith('*');
	for (var len = 2; len >= 1; len--) {
		if (chunk.length <= len) {
			continue;
		}
		var num = chunk.slice(0, len);
		if (!/^\d+$/.test(num)) {
			continue;
		}
		var n = parseInt(num, 10);
		if (n < 1 || n > 32) {
			continue;
		}
		var rest = chunk.slice(len);
		if (starred) {
			rest = rest.slice(0, -1);
		}
		if (westgateTeamNames.has(rest)) {
			return { num: n, team: westgateProcessTeamName(rest) };
		}
	}
	return null;
}

function westgateParseGameLine(line) {
	var spreadMatch = line.match(/(\+?\d+(?:\.5)?|PK)$/);
	if (!spreadMatch) {
		return null;
	}
	var lineSpread = spreadMatch[1];
	var body = line.slice(0, -spreadMatch[0].length);
	var timeMatch = body.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
	if (!timeMatch) {
		return null;
	}
	var idx = body.indexOf(timeMatch[0]);
	var left = body.slice(0, idx).trim();
	var right = body.slice(idx + timeMatch[0].length).trim();
	var t1 = westgateParseTeamChunk(left);
	var t2 = westgateParseTeamChunk(right);
	if (!t1 || !t2) {
		return null;
	}
	return {
		favorite: t1.team,
		underdog: t2.team,
		line: lineSpread
	};
}

function westgateParseCardPdf(buffer) {
	return pdf(buffer).then(function (result) {
		var output = [];
		result.text.split('\n').forEach(function (line) {
			var game = westgateParseGameLine(line.trim());
			if (game) {
				output.push(game);
			}
		});
		if (output.length === 0) {
			throw new Error('No games parsed from Westgate PDF');
		}
		return output;
	});
}

function westgatePdfUrlForWeek(week) {
	return WESTGATE_URL_FMT.replace('{}', week);
}

function westgateAbsoluteUrl(href) {
	if (/^https?:\/\//i.test(href)) {
		return href;
	}
	if (href.charAt(0) === '/') {
		return WESTGATE_CARD_URL_FMT.replace('{}', href);
	}
	return WESTGATE_CARD_URL_FMT.replace('{}', '/' + href);
}

function westgateListGameSheetLinks(html) {
	var $ = cheerio.load(html);
	var byWeek = {};

	$('a[href]').each(function (_, el) {
		var href = $(el).attr('href');
		if (!href) {
			return;
		}
		var match = href.match(WESTGATE_GAME_SHEET_HREF_RE);
		if (!match) {
			return;
		}
		var sheetWeek = parseInt(match[1], 10);
		byWeek[sheetWeek] = {
			week: sheetWeek,
			href: westgateAbsoluteUrl(href)
		};
	});

	return Object.keys(byWeek)
		.map(function (key) {
			return byWeek[key];
		})
		.sort(function (a, b) {
			return a.week - b.week;
		});
}

function westgatePickGameSheetLink(links, targetWeek) {
	if (links.length === 0) {
		return null;
	}
	var exact = links.find(function (link) {
		return link.week === targetWeek;
	});
	if (exact) {
		return exact;
	}
	var eligible = links.filter(function (link) {
		return link.week <= targetWeek;
	});
	if (eligible.length > 0) {
		return eligible[eligible.length - 1];
	}
	return links[links.length - 1];
}

function westgateDownloadPdf(url) {
	return request.get(url).buffer(true).then(function (res) {
		if (res.status !== 200) {
			throw new Error('Failed to download Westgate PDF (HTTP ' + res.status + ')');
		}
		return res.body;
	});
}

function westgateFetchPdf(targetWeek) {
	var pdfUrl = westgatePdfUrlForWeek(targetWeek);
	return request
		.get(pdfUrl)
		.buffer(true)
		.ok(function (res) {
			return res.status < 500;
		})
		.then(function (res) {
			if (res.status === 200) {
				return { buffer: res.body, url: pdfUrl, week: targetWeek };
			}
			return request.get(WESTGATE_CARD_URL).then(function (cardRes) {
				var links = westgateListGameSheetLinks(cardRes.text);
				var picked = westgatePickGameSheetLink(links, targetWeek);
				if (!picked) {
					throw new Error('No SuperContest game sheets found on Westgate card page');
				}
				if (picked.week !== targetWeek) {
					console.warn(
						'Westgate week ' + targetWeek + ' PDF is not published yet; using week ' + picked.week
					);
				}
				var canonicalUrl = westgatePdfUrlForWeek(picked.week);
				return westgateDownloadPdf(canonicalUrl)
					.catch(function () {
						return westgateDownloadPdf(picked.href);
					})
					.then(function (buffer) {
						return { buffer: buffer, url: canonicalUrl, week: picked.week };
					});
			});
		});
}

function fetchWestgateCard(date) {
	var targetWeek = westgateWeek(date);
	return westgateFetchPdf(targetWeek).then(function (pdfResult) {
		return westgateParseCardPdf(pdfResult.buffer).then(function (data) {
			return {
				data: data,
				week: pdfResult.week,
				season: WESTGATE_SEASON,
				url: pdfResult.url
			};
		});
	});
}

var dryRun = !process.argv.includes('update');

function westgateMatchupKey(favoriteAbbrev, underdogAbbrev) {
	return favoriteAbbrev + '-' + underdogAbbrev;
}

function buildConfidentWestgateGames(westgateData, problems) {
	if (westgateData.data.length !== WESTGATE_GAMES_EXPECTED) {
		problems.push(
			'PDF parser got ' +
				westgateData.data.length +
				' games, expected ' +
				WESTGATE_GAMES_EXPECTED +
				' — open Sheet URL below and compare; pdf-parse layout may have changed'
		);
	}

	var confidentGames = [];
	var seenMatchups = {};

	westgateData.data.forEach(function (footballGame) {
		if (!teamNameToAbbreviation[footballGame.favorite]) {
			problems.push(
				'PDF favorite "' +
					footballGame.favorite +
					'" has no abbrev — add to teamNameToAbbreviation in bin/lines.js'
			);
			return;
		}
		if (!teamNameToAbbreviation[footballGame.underdog]) {
			problems.push(
				'PDF underdog "' +
					footballGame.underdog +
					'" has no abbrev — add to teamNameToAbbreviation in bin/lines.js'
			);
			return;
		}

		var favorite = teamNameToAbbreviation[footballGame.favorite];
		var underdog = teamNameToAbbreviation[footballGame.underdog];
		var matchupId = [favorite, underdog].sort().join('-');
		if (seenMatchups[matchupId]) {
			problems.push('Duplicate matchup on Westgate card: ' + footballGame.favorite + ' / ' + footballGame.underdog);
			return;
		}
		seenMatchups[matchupId] = true;

		var line = footballGame.line == 'PK' ? 0 : parseFloat(footballGame.line).toFixed(1);
		confidentGames.push({
			favorite: favorite,
			underdog: underdog,
			line: line,
			displayKey: westgateMatchupKey(favorite, underdog)
		});
	});

	return confidentGames;
}

function gameDisplayKey(game) {
	return game.awayTeam.abbreviation + '@' + game.homeTeam.abbreviation;
}

function sendLinesAlert(problems, context) {
	if (problems.length === 0) {
		return Promise.resolve(false);
	}

	problems.forEach(function (problem) {
		console.error('[lines] ' + problem);
	});

	var lines = [];
	lines.push('SubContest lines — manual fix needed');
	lines.push(
		'Season ' +
			context.season +
			' · Westgate sheet week ' +
			context.sheetWeek +
			(context.calendarWeek !== context.sheetWeek
				? ' (calendar week ' + context.calendarWeek + ' PDF not up yet)'
				: '')
	);

	var appliedLabel = context.updateMode ? 'Wrote lines for' : 'Would write lines for';
	lines.push(
		appliedLabel +
			' ' +
			context.linesApplied +
			' game(s) · ' +
			context.confidentCount +
			'/' +
			WESTGATE_GAMES_EXPECTED +
			' confident from PDF (' +
			context.parsedCount +
			' parsed)'
	);

	if (context.url) {
		lines.push('Sheet: ' + context.url);
	}
	lines.push('Card page: ' + WESTGATE_CARD_URL);
	lines.push('');
	lines.push('Issues:');

	problems.slice(0, 8).forEach(function (problem) {
		lines.push('• ' + problem);
	});
	if (problems.length > 8) {
		lines.push('• ... and ' + (problems.length - 8) + ' more (see cron logs)');
	}

	lines.push('');
	lines.push('Next: run `runt lines` on prod, fix bin/lines.js or week ' + context.sheetWeek + ' schedule in Mongo');

	var message = lines.join('\n');

	return notifications.coinflipperAlert(message, { priority: 'high' }).then(function () {
		return true;
	});
}

var calendarWeek = westgateWeek();

fetchWestgateCard()
	.then(function (westgateData) {
		var season = westgateData.season;
		var week = westgateData.week;
		var problems = [];
		var confidentGames = buildConfidentWestgateGames(westgateData, problems);
		var lineLookup = {};

		if (dryRun) {
			console.log(
				'Westgate card: season ' +
					season +
					', week ' +
					week +
					' (' +
					westgateData.data.length +
					' parsed, ' +
					confidentGames.length +
					' confident)'
			);
		}

		confidentGames.forEach(function (footballGame) {
			lineLookup[westgateMatchupKey(footballGame.favorite, footballGame.underdog)] = 1 * footballGame.line;
			lineLookup[westgateMatchupKey(footballGame.underdog, footballGame.favorite)] = -1 * footballGame.line;

			if (dryRun) {
				console.log('  ' + footballGame.displayKey, footballGame.line);
			}
		});

		var gamePromises = confidentGames.map(function (footballGame) {
			var conditions = {
				season: season,
				week: week,

				'$or': [
					{
						'$and': [
							{ 'awayTeam.abbreviation': footballGame.favorite, 'homeTeam.abbreviation': footballGame.underdog }
						]
					},
					{
						'$and': [
							{ 'awayTeam.abbreviation': footballGame.underdog, 'homeTeam.abbreviation': footballGame.favorite }
						]
					}
				],

				line: { '$exists': false }
			};

			return Game.findOne(conditions).then(function (game) {
				return { game: game, footballGame: footballGame };
			});
		});

		return Promise.all(gamePromises).then(function (results) {
			var linePromises = [];
			var pendingMongoUpdates = 0;

			results.forEach(function (result) {
				if (!result.game) {
					problems.push(
						'Westgate has ' +
							result.footballGame.displayKey +
							' but no season ' +
							season +
							' week ' +
							week +
							' Game without line — fix schedule or abbreviations'
					);
					return;
				}

				var lineLookupKey =
					result.game.awayTeam.abbreviation + '-' + result.game.homeTeam.abbreviation;
				result.game.line = lineLookup[lineLookupKey];
				pendingMongoUpdates++;

				if (process.argv.includes('update')) {
					linePromises.push(result.game.save());
				}
			});

			return Promise.all(linePromises).then(function () {
				return Game.find({
					season: season,
					week: week,
					line: { '$exists': false }
				}).then(function (stillMissing) {
					if (stillMissing.length > 0) {
						var missingKeys = stillMissing.map(gameDisplayKey);
						var missingDetail =
							missingKeys.length <= 6
								? missingKeys.join(', ')
								: missingKeys.slice(0, 5).join(', ') + ', +' + (missingKeys.length - 5) + ' more';
						problems.push(
							stillMissing.length +
								' Mongo game(s) for week ' +
								week +
								' still have no line: ' +
								missingDetail
						);
					}

					if (dryRun) {
						if (pendingMongoUpdates === 0) {
							console.log('No games in MongoDB for week ' + week + ' are missing a line.');
						}
						else {
							console.log(
								pendingMongoUpdates +
									' game(s) in MongoDB would get a line (run `runt lines update` to save).'
							);
						}
					}

					return sendLinesAlert(problems, {
						season: season,
						sheetWeek: week,
						calendarWeek: calendarWeek,
						url: westgateData.url,
						confidentCount: confidentGames.length,
						parsedCount: westgateData.data.length,
						linesApplied: pendingMongoUpdates,
						updateMode: !dryRun
					}).then(function (hadProblems) {
						return hadProblems;
					});
				});
			});
		});
	})
	.catch(function (error) {
		console.log(error);
		return notifications
			.coinflipperAlert(
				'SubContest lines — script failed before applying lines\n\n' +
					'• ' +
					error.message +
					'\n\n' +
					'Next: run `runt lines` on prod and check Westgate PDF / bin/lines.js parser',
				{ priority: 'urgent' }
			)
			.finally(function () {
				mongoose.disconnect();
				process.exit(1);
			});
	})
	.then(function (hadProblems) {
		mongoose.disconnect();
		if (hadProblems) {
			process.exit(1);
		}
	});
