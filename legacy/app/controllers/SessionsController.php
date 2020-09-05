<?php

namespace app\controllers;

use lithium\security\Auth;

class SessionsController extends \lithium\action\Controller {

	public function add() {
		if ($this->request->data) {
			if (Auth::check('default', $this->request)) {
				return $this->redirect('/');
			}
			else {
				return $this->redirect('/login');
			}
		}
	}

	public function delete() {
		Auth::clear('default');
		return $this->redirect('/');
	}

}

?>
