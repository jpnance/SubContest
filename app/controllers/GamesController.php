<?php

namespace app\controllers;

use Exception;
use lithium\security\Auth;
use app\models\Games;

class GamesController extends \lithium\action\Controller {

	public function pick($gameId, $team) {
		$action = 'pick';

		$conditions = ['_id' => $gameId];
		$fields = ['awayTeam', 'homeTeam', 'kickoff'];
		$game = Games::first(compact('conditions'));

		$pick = $team;

		$success = false;
		$user = Auth::check('default');

		if ($user) {
			try {
				$success = $game->pick($user['username'], $team);
			}
			catch (Exception $e) {
				$success = false;
				$error = $e->getMessage();
			}
		}
		else {
			$success = false;
			$error = 'You must be logged in to make a pick.';
		}

		return compact('success', 'action', 'pick', 'game', 'error');
	}

	public function unpick($gameId) {
		$action = 'unpick';

		$conditions = ['_id' => $gameId];
		$fields = ['kickoff'];
		$game = Games::first(compact('conditions'));

		$success = false;
		$user = Auth::check('default');

		if ($user) {
			try {
				$success = $game->unpick($user['username']);
			}
			catch (Exception $e) {
				$success = false;
				$error = $e->getMessage();
			}
		}
		else {
			$success = false;
			$error = 'You must be logged in to make a pick.';
		}

		return compact('success', 'action', 'game', 'error');
	}

}

?>
