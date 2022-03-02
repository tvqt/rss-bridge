<?php

if (!function_exists('str_starts_with')) {
	function str_starts_with($haystack, $needle) {
		return (string)$needle !== '' && strncmp($haystack, $needle, strlen($needle)) === 0;
	}
}

if (!function_exists('str_ends_with')) {
	function str_ends_with($haystack, $needle) {
		return $needle !== '' && substr($haystack, -strlen($needle)) === (string)$needle;
	}
}

if (!function_exists('str_contains')) {
	function str_contains($haystack, $needle) {
		return $needle !== '' && mb_strpos($haystack, $needle) !== false;
	}
}

$url = urldecode($_SERVER['QUERY_STRING']);

$host = parse_url($url, PHP_URL_HOST);

if (!str_ends_with($host, ".cdninstagram.com")) {
	http_response_code(403);
	die('Forbidden');
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
