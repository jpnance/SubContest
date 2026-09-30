var request = require('superagent');

/**
 * Push alert to the coinflipper ntfy topic (production only).
 *
 * @param {string} message
 * @param {Object} [options]
 * @param {string} [options.priority] - ntfy priority: min, low, default, high, urgent
 * @returns {Promise}
 */
function coinflipperAlert(message, options) {
	options = options || {};

	if (process.env.NODE_ENV !== 'production') {
		console.log('[NOTIFICATIONS] Skipping ntfy (non-production):', message.split('\n')[0]);
		return Promise.resolve();
	}

	var body = new Date().toISOString() + ' ' + message;
	var priority = options.priority || 'high';

	return request
		.post('https://ntfy.sh/coinflipper')
		.set('Priority', priority)
		.send(body)
		.then(function () {
			console.log('[NOTIFICATIONS] Sent ntfy alert:', message.split('\n')[0]);
		})
		.catch(function (error) {
			console.error('[NOTIFICATIONS] Failed to send ntfy alert:', error.message);
		});
}

module.exports = {
	coinflipperAlert: coinflipperAlert
};
