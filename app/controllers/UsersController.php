<?php

namespace app\controllers;

use lithium\security\Auth;
use lithium\security\Password;
use app\extensions\helper\Date;
use app\extensions\helper\User;
use app\models\Users;

class UsersController extends \lithium\action\Controller {

	public function add() {
		if (User::isAdmin()) {
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

			$editCheck = Password::check($this->request->data['password'], $user->password) || User::isAdmin();

			if ($editCheck && ($this->request->data['password1'] != '') && ($this->request->data['password1'] == $this->request->data['password2'])) {
				$user->password = Password::hash($this->request->data['password1']);
			}

			if ($this->request->data['nickname'] != '') {
				$user->nickname = $this->request->data['nickname'];
			}

			if ($this->request->data['eligible']) {
				$user->makeEligibleFor(Date::getSeason());
			}
			else {
				$user->removeEligibilityFor(Date::getSeason());
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
		if (User::isAdmin()) {
			$order = ['firstName' => 'ASC'];
			$users = Users::all(compact('order'));
		}
		else {
			$this->redirect('/');
		}

		return compact('users');
	}

}

?>
