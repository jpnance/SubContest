<?php

namespace app\extensions\command;

use app\models\Games;

class Types extends \lithium\console\Command {

	public function run() {
		$conditions = array(
			'homeTeam.score' => array('$exists' => true),
			'awayTeam.score' => array('$exists' => true)
		);

		$games = Games::all(compact('conditions'));

		foreach ($games as $game) {
			$game->awayTeam->score = doubleval($game->awayTeam->score);
			$game->homeTeam->score = doubleval($game->homeTeam->score);

			$game->save();
		}
	}

}

?>
