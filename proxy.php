<?php

include('lib/php8backports.php');

$url = urldecode($_SERVER['QUERY_STRING']);

$host = parse_url($url, PHP_URL_HOST);

if (!str_ends_with($host, ".cdninstagram.com")) {
	// TODO: 403
	return;
}

$header = array();
$ch = curl_init($url);
foreach (getallheaders() as $name => $value) {
	if (strtolower($name) == 'host') {
		$value = $host;
	} else if (strtolower($name) == 'referer') {
		continue;
	}
	$header[] = "$name: $value";
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $data) {
	$locationMatch = preg_match('/location:([\W]+)?(.*)/i', $data, $matches);
	if ($locationMatch) {
		header('location: /proxy.php?' . urlencode($matches[2]));
	} else {
		header($data);
	}
	return strlen($data);
});
curl_exec($ch);
curl_close($ch);
