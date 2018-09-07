<?php

namespace app\extensions\command;

use app\extensions\helper\Date;
use app\extensions\helper\Team;
use app\models\Games;

class Scoring extends \lithium\console\Command {

	public $update;

	public function determineWinners() {
		if ($this->update == 'true') {
			$conditions = array(
				'winner' => array('$exists' => false),
				'push' => array('$exists' => false),
				'line' => array('$exists' => true),
				'homeTeam.score' => array('$exists' => true),
				'awayTeam.score' => array('$exists' => true)
			);

			$games = Games::all(compact('conditions'));

			foreach ($games as $game) {
				$handicappedScore = ($game->homeTeam->score + $game->line) - $game->awayTeam->score;

				if ($handicappedScore == 0) {
					$game->push = true;
				}
				else if ($handicappedScore > 0) {
					$game->winner = $game->homeTeam->abbreviation;
				}
				else if ($handicappedScore < 0) {
					$game->winner = $game->awayTeam->abbreviation;
				}

				$game->save();
			}
		}
	}

	public function loadNflScores() {
		$season = Date::getSeason();
		$scores = json_decode(file_get_contents('http://www.nfl.com/liveupdate/scores/scores.json'));
		$dates = array_keys((array) $scores);

		foreach ($dates as $date) {
			$feedGame = $scores->{$date};
			$week = Date::getWeek(strtotime(substr($date, 0, 8)));

			if ($feedGame->qtr != 'Final') {
				continue;
			}

			$awayTeam = Team::normalizeAbbreviation($feedGame->away->abbr);
			$awayScore = $feedGame->away->score->T;
			$homeTeam = Team::normalizeAbbreviation($feedGame->home->abbr);
			$homeScore = $feedGame->home->score->T;

			if ($this->update == 'true') {
				$conditions = array(
					'season' => $season,
					'week' => $week,
					'awayTeam.abbreviation' => $awayTeam,
					'homeTeam.abbreviation' => $homeTeam,
					'awayTeam.score' => array('$exists' => false),
					'homeTeam.score' => array('$exists' => false),
					'winner' => array('$exists' => false),
					'push' => array('$exists' => false)
				);

				$game = Games::first(compact('conditions'));

				if ($game) {
					$game->awayTeam->score = $awayScore;
					$game->homeTeam->score = $homeScore;

					$game->save();
				}
			}
			else {
				$this->out($season . ' ' . $week . ' ' . $awayTeam . ' ' . $awayScore . ', ' . $homeTeam . ' ' . $homeScore);
			}
		}
	}

	public function run() {
		$this->loadNflScores();
		$this->determineWinners();
	}

}

?>
