<?php

namespace app\extensions\helper;

class Team extends \lithium\template\Helper {

	public function className($team) {
		return strtolower($team->abbreviation);
	}

	public function name($team) {
		if ($team->abbreviation == 'LAC') {
			return 'LA Chargers';
		}
		else if ($team->abbreviation == 'LAR') {
			return 'LA Rams';
		}
		else if ($team->abbreviation == 'NYG') {
			return 'NY Giants';
		}
		else if ($team->abbreviation == 'NYJ') {
			return 'NY Jets';
		}
		else {
			return $team->location;
		}
	}

	public static function normalizeAbbreviation($abbreviation) {
		if ($abbreviation == 'JAC') {
			return 'JAX';
		}
		else if ($abbreviation == 'LA') {
			return 'LAR';
		}
		else {
			return $abbreviation;
		}
	}
}

?>
