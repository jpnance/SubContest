<?php

namespace app\models;

use lithium\storage\Cache;

class Users extends \lithium\data\Model {

	public static function findByUsername($username) {
		$conditions = ['username' => $username];
		$user = self::first(compact('conditions'));

		return $user;
	}

	public function isEligibleFor($entity, $trySeason) {
		foreach ($entity->seasons as $season) {
			if ($season == $trySeason) {
				return true;
			}
		}

		return false;
	}

	public function makeEligibleFor($entity, $trySeason) {
		$seasons = $entity->seasons->to('array');

		foreach ($seasons as $season) {
			if ($season == $trySeason) {
				return;
			}
		}

		array_push($seasons, $trySeason);

		$entity->seasons = $seasons;
	}

	public function removeEligibilityFor($entity, $trySeason) {
		$seasons = $entity->seasons->to('array');

		foreach ($seasons as $i => $season) {
			if ($season == $trySeason) {
				unset($seasons[$i]);
				array_values($seasons[$i]);
			}
		}

		$entity->seasons = $seasons;
	}
}

?>
