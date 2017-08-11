<?php

namespace app\controllers;

use lithium\security\Auth;
use lithium\security\Password;
use app\models\Users;

class UsersController extends \lithium\action\Controller {

	public function add() {
		$sessionCheck = Auth::check('default');

		if ($sessionCheck && $sessionCheck['username'] == 'jpnance') {
			$user = Users::create($this->request->data);

			if ($this->request->data) {
				if ($user->save()) {
					$this->redirect('Users::add');
				}
			}
		}

		return compact('user');
	}

	public function edit($username = null) {
		$sessionCheck = Auth::check('default');

		if ($this->request->data) {
			$conditions = ['_id' => $this->request->data['_id']];
			$user = Users::first(compact('conditions'));

			$editCheck = Password::check($this->request->data['password'], $user->password) || ($sessionCheck && $sessionCheck['username'] == 'jpnance');

			if ($editCheck && ($this->request->data['password1'] != '') && ($this->request->data['password1'] == $this->request->data['password2'])) {
				$user->password = Password::hash($this->request->data['password1']);
			}

			$user->save();
		}
		else {
			if ($username) {
				$user = Users::findByUsername($username);
			}
			else {
				$conditions = ['username' => $sessionCheck['username']];
				$user = Users::first(compact('conditions'));
			}
		}

		return compact('user');
	}

	public function index() {
		$sessionCheck = Auth::check('default');

		if ($sessionCheck && $sessionCheck['username'] == 'jpnance') {
			$order = ['firstName' => 'ASC'];
			$users = Users::all(compact('order'));
		}

		return compact('users');
	}

}

?>
