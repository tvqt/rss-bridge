<?php
/**
 * This file is part of RSS-Bridge, a PHP project capable of generating RSS and
 * Atom feeds for websites that don't have one.
 *
 * For the full license information, please view the UNLICENSE file distributed
 * with this source code.
 *
 * @package	Core
 * @license	http://unlicense.org/ UNLICENSE
 * @link	https://github.com/rss-bridge/rss-bridge
 */

class CacheAction extends ActionAbstract {
	public function execute() {
		$accessTokenInConfig = Configuration::getConfig('cache', 'access_token');
		if (!$accessTokenInConfig) {
			throw new \Exception('Editing cache is disabled in this instance', 403);
			returnServerError();
		}

		$accessTokenGiven = $_POST['access_token'] ?? '';
		if ($accessTokenGiven != $accessTokenInConfig) {
			throw new \Exception('Incorrect access token', 403);
		}

		$bridge = array_key_exists('bridge', $this->userData) ? $this->userData['bridge'] : null;

		$key = $this->userData['key']
			 or returnClientError('You must specify a key!');

		$asJson = $this->userData['as_json'] ?? false;

		$bridgeFac = new \BridgeFactory();
		$bridgeFac->setWorkingDir(PATH_LIB_BRIDGES);

		// whitelist control
		if(!$bridgeFac->isWhitelisted($bridge)) {
			throw new \Exception('This bridge is not whitelisted', 401);
			die;
		}

		$bridge = $bridgeFac->create($bridge);
		$bridge->loadConfiguration();
		$value = $_POST['value'];
		if ($asJson) {
			$value = json_decode($value);
		}
		$bridge->setCacheData($key, $value);

		header('Content-Type: text/plain');
		echo 'done';
	}
}
