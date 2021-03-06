<?php

namespace app\extensions\helper;

class Date extends \lithium\template\Helper {

	public static function getSeason() {
		return 2019;
	}

	public static function getWeek($timestamp = null) {
		$now = time();

		if ($timestamp) {
			$now = strtotime($timestamp);
		}

		$start = mktime(0, 0, 0, 9, 5, 2019);

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

		return $week;
	}

}

?>
