<?php

namespace app\controllers;

use app\models\Games;
use app\models\Users;

class StandingsController extends \lithium\action\Controller {

	public function index() {
		$start = time(0, 0, 0, 9, 8, 2016);
		$now = time();

		$days = intval(($now - $start) / 86400);

		if ($days < 7) {
			$week = 1;
		}
		else {
			$week = intval(($days / 7) + 1);
		}

		if ($week > 17) {
			$week = 17;
		}

		$userConditions = ['seasons' => 2016];
		$userFields = ['username', 'nickname'];
		$users = Users::all(['conditions' => $userConditions, 'fields' => $userFields]);

		$gameConditions = [
			'season' => 2016,
			'picks' => ['$exists' => true],
			'$or' => [
				['winner' => ['$exists' => true]],
				['push' => ['$exists' => true]],
				['week' => $week]
			]
		];
		$gameOrder = ['kickoff' => 'ASC', 'awayTeam.abbreviation' => 'ASC'];
		$gameFields = ['awayTeam', 'homeTeam', 'kickoff', 'line', 'picks', 'push', 'winner'];
		$games = Games::all(['conditions' => $gameConditions, 'order' => $gameOrder, 'fields' => $gameFields]);

		$standings = [];

		foreach ($users as $user) {
			$standings[$user['username']] = ['name' => $user['nickname'], 'score' => 0, 'currentPicks' => []];
		}

		foreach ($games as $game) {
			foreach ($game->picks as $username => $pick) {
				if ($pick == $game->winner) {
					$standings[$username]['score'] += 1;

					if ($game->week == $week) {
						$standings[$username]['currentPicks'][] = ['pick' => $pick, 'result' => 'winner'];
					}
				}
				else if (isset($game->push)) {
					$standings[$username]['score'] += 0.5;

					if ($game->week == $week) {
						$standings[$username]['currentPicks'][] = ['pick' => $pick, 'result' => 'push'];
					}
				}
				else if ($game->winner && $pick != $game->winner) {
					if ($game->week == $week) {
						$standings[$username]['currentPicks'][] = ['pick' => $pick, 'result' => 'loser'];
					}
				}
				else if ($game->week == $week && $game->hasStarted()) {
					$standings[$username]['currentPicks'][] = ['pick' => $pick, 'result' => 'open'];
				}
			}
		}

		foreach ($standings as &$standing) {
			$standing['hiddenPicks'] = 5 - count($standing['currentPicks']);
		}

		uasort($standings, ['self', 'sortStandings']);

		return compact('users', 'standings', 'week');
	}

	private static function sortStandings($a, $b) {
		if ($a['score'] == $b['score']) {
			if ($a['name'] == $b['name']) {
				return 0;
			}

			return ($a['name'] < $b['name']) ? -1 : 1;
		}

		return ($a['score'] > $b['score']) ? -1 : 1;
	}

}

?>
