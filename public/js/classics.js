$(document).ready(function() {
	$('body').on('click', 'a.team-button', function(e) {
		var $this = $(e.currentTarget);
		var actionLink = $this.attr('href');

		$.get(actionLink, function(data) {
			if (data.success) {
				var $game = $('#game-' + data.gameId);

				$game.find('div.card').removeClass('border-secondary');

				if (data.teamId) {
					$game.find('div.card').addClass('border-secondary');
				}

				$game.find('a.team-button').each(function(i, teamButton) {
					var $this = $(teamButton);

					$this.removeClass('btn-secondary').addClass('btn-outline-secondary');
					$this.attr('href', '/pick/' + $this.data('teamId') + '/' + data.gameId);

					if ($this.data('teamId') == data.teamId) {
						$this.removeClass('btn-outline-secondary').addClass('btn-secondary');
						$this.attr('href', '/unpick/' + $this.data('teamId') + '/' + data.gameId);
					}

					$this.blur();
				});

				$('#game-' + data.gameId).find('li.team-row').each(function(i, teamRow) {
					var $this = $(teamRow);

					$this.removeClass('bg-light-gray');

					if ($this.attr('id') == 'team-row-' + data.teamId) {
						$this.addClass('bg-light-gray');
					}
				});
			}
		}).catch((error) => {
			$('#modal .modal-body').text(error.responseJSON.message);
			$('#modal').modal('show');
		});

		e.preventDefault();
	});

	$('form[name=login]').on('click', 'button', function(e) {
		var $this = $(e.currentTarget);
		var $form = $($this.parents('form')[0]);

		$this.attr('disabled', true);
		e.preventDefault();

		$.post($form.attr('action'), $form.serializeArray(), function() {
			window.location = '/login?success=email-sent';
		}).fail(function(response) {
			if (response.status == 400) {
				window.location = '/login?error=invalid-email';
			}
			else if (response.status == 404) {
				window.location = '/login?error=not-found';
			}
			else {
				window.location = '/login?error=unknown';
			}
		});
	});
});
