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

}

?>
