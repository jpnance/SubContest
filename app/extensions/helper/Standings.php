<?php

namespace app\extensions\helper;

class Standings extends \lithium\template\Helper {

	public function score($score) {
		if (!isset($score)) {
			return '0';
		}
		else if ($score == 0.5) {
			return '&frac12;';
		}
		else {
			$floor = floor($score);
			$half = $score - $floor;

			if ($half > 0) {
				return strval($floor) . ' &frac12;';
			}
			else {
				return strval($score);
			}
		}
	}

	public function showPicks($standings) {
		foreach ($standings as $standing) {
			if ($standing['hiddenPicks'] < 5) {
				return true;
			}
		}

		return false;
	}

}

?>
