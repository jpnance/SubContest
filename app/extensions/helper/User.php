<?php

namespace app\extensions\helper;

use lithium\security\Auth;

class User extends \lithium\template\Helper {

	public function isLoggedIn() {
		return (Auth::check('default') != false);
	}

}

?>
