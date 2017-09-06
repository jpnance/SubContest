<?php

namespace app\extensions\command;

use app\extensions\helper\Date;
use app\models\Games;
use app\models\Teams;

class Lines extends \lithium\console\Command {

	public $update;

	public static $teamAbbreviations = array(
		'49ERS' => 'SF',
		'BEARS' => 'CHI',
		'BENGALS' => 'CIN',
		'BILLS' => 'BUF',
		'BRONCOS' => 'DEN',
		'BROWNS' => 'CLE',
		'BUCCANEERS' => 'TB',
		'CARDINALS' => 'ARI',
		'CHARGERS' => 'LAC',
		'CHIEFS' => 'KC',
		'COLTS' => 'IND',
		'COWBOYS' => 'DAL',
		'DOLPHINS' => 'MIA',
		'EAGLES' => 'PHI',
		'FALCONS' => 'ATL',
		'GIANTS' => 'NYG',
		'JAGUARS' => 'JAX',
		'JETS' => 'NYJ',
		'LIONS' => 'DET',
		'PACKERS' => 'GB',
		'PANTHERS' => 'CAR',
		'PATRIOTS' => 'NE',
		'RAIDERS' => 'OAK',
		'RAMS' => 'LAR',
		'RAVENS' => 'BAL',
		'REDSKINS' => 'WAS',
		'SAINTS' => 'NO',
		'SEAHAWKS' => 'SEA',
		'STEELERS' => 'PIT',
		'TEXANS' => 'HOU',
		'TITANS' => 'TEN',
		'VIKINGS' => 'MIN'
	);

	public function run() {
		$weeklyCard = file_get_contents('https://www.westgatedestinations.com/nevada/las-vegas/westgate-las-vegas-hotel-casino/casino/supercontest-weekly-card');
		$weeklyCard = str_replace('&nbsp;', ' ', $weeklyCard);

		$weekPattern = '/<td>(.*?)<\/td><td><\/td><td><\/td><td><\/td>/i';
		preg_match($weekPattern, $weeklyCard, $weekMatches);
		$this->out($weekMatches[1]);
		$week = Date::getWeek($weekMatches[1]);
		$this->out($week);

		$gamePattern = '/<tr.*?>\s*<td.*?>\d\d?\s+(.*?)<\/td>\s*<td.*?>\d\d?:\d\d [AP]M<\/td>\s*<td.*?>\d\d?\s+(.*?)<\/td>\s*<td.*?>(.*?)<\/td>\s*<\/tr>/';
		preg_match_all($gamePattern, $weeklyCard, $gameMatches);

		$gameCount = count($gameMatches[0]);

		for ($i = 0; $i < $gameCount; $i++) {
			$unparsed = array(
				'favorite' => $gameMatches[1][$i],
				'underdog' => $gameMatches[2][$i],
				'line' => $gameMatches[3][$i]
			);

			$parsed = array();
			$searches = array('1/2', 'PK', '&nbsp;', ' ', '+');
			$replacements = array('.5', '0', '', '', '');

			if (strpos($unparsed['favorite'], '*') !== FALSE) {
				$parsed['awayTeam'] = trim($unparsed['underdog']);
				$parsed['homeTeam'] = trim(str_replace('*', '', $unparsed['favorite']));

				$parsed['line'] = -1 * doubleval(trim(str_replace($searches, $replacements, $unparsed['line'])));
			}
			else if (strpos($unparsed['underdog'], '*') !== FALSE) {
				$parsed['awayTeam'] = trim($unparsed['favorite']);
				$parsed['homeTeam'] = trim(str_replace('*', '', $unparsed['underdog']));

				$parsed['line'] = doubleval(trim(str_replace($searches, $replacements, $unparsed['line'])));
			}

			$awayTeamAbbreviation = static::$teamAbbreviations[$parsed['awayTeam']];
			$homeTeamAbbreviation = static::$teamAbbreviations[$parsed['homeTeam']];

			if ($this->update == 'true') {
				$conditions = array(
					'season' => Date::getSeason(),
					'week' => $week,
					'awayTeam.abbreviation' => $awayTeamAbbreviation,
					'homeTeam.abbreviation' => $homeTeamAbbreviation,
					'awayTeam.score' => array('$exists' => false),
					'homeTeam.score' => array('$exists' => false),
					'winner' => array('$exists' => false),
					'push' => array('$exists' => false),
					'line' => array('$exists' => false)
				);

				$game = Games::first(compact('conditions'));

				if ($game) {
					$game->line = $parsed['line'];
					$game->save();
				}
			}
			else {
				$this->out($awayTeamAbbreviation . ' at ' . $homeTeamAbbreviation . ' (' . $parsed['line'] . ')');
			}
		}
	}

}

?>
