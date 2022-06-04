<?php

require_once __DIR__ . '/lib/rssbridge.php';

Configuration::verifyInstallation();
Configuration::loadConfiguration();

if (!isset($argv)) {
	die("CLI only");
}

$bridgeFac = new \BridgeFactory();
$bridgeFac->setWorkingDir(PATH_LIB_BRIDGES);

$bridge = $bridgeFac->create('InstagramBridge');
$bridge->loadConfiguration();

$accounts = file_get_contents("instagram_accounts.txt");
$accounts = explode("\n", $accounts);

foreach($accounts as $acc) {
	$acc = trim($acc);
	if (!$acc) continue;

	print("crawling $acc\n");
	try {
		$data = getContents(
			'https://i.instagram.com/api/v1/users/web_profile_info/?username=' . $acc,
			array(
				'X-IG-App-ID: 936619743392459'
			)
		);

		$json = json_decode($data);
		print("done\n");
		$bridge->setCacheData('instagram_user_' . $acc, $json);

	} catch (Exception $e) {
		print($e->getMessage() . "\n");
	}
	print("---------\n\n");
	sleep(rand(5, 10));
}
