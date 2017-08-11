<?php

namespace app\controllers;

use lithium\security\Auth;
use app\extensions\helper\Date;
use app\models\Games;
use app\models\Users;

class WeeksController extends \lithium\action\Controller {

	public function view($week = null) {
		if (!isset($week)) {
			$week = Date::getWeek();
		}

		date_default_timezone_set('US/Eastern');

		$conditions = ['season' => Date::getSeason(), 'week' => intval($week)];
		$order = ['kickoff' => 'ASC', 'awayTeam.abbreviation' => 'ASC'];
		$fields = ['awayTeam', 'homeTeam', 'kickoff', 'line', 'picks', 'push', 'winner'];

		$games = Games::all(compact('conditions', 'order', 'fields'));

		foreach ($games as $game) {
			if ($game->hasStarted()) {
				$awayPicks = [];
				$homePicks = [];

				if (isset($game->picks)) {
					foreach ($game->picks as $username => $pick) {
						$user = Users::findByUsername($username);
						$displayName = $user->nickname;

						if ($pick == $game->awayTeam->abbreviation) {
							array_push($awayPicks, $displayName);
						}
						else if ($pick == $game->homeTeam->abbreviation) {
							array_push($homePicks, $displayName);
						}
					}
				}

				sort($awayPicks);
				sort($homePicks);

				$game->awayTeam->picks = $awayPicks;
				$game->homeTeam->picks = $homePicks;
			}
		}

		$user = Auth::check('default');
		$username = $user['username'];

		return compact('games', 'week', 'username');
	}

}

?>
