<?php

namespace app\extensions\helper;

class Game extends \lithium\template\Helper {

	public function line($line) {
		if ($line === 0.0) {
			return 'PK';
		}
		else if ($line > 0) {
			return '+' . number_format($line, 1);
		}
		else if ($line < 0) {
			return number_format($line, 1);
		}
		else {
			return '--';
		}
	}

}

?>
