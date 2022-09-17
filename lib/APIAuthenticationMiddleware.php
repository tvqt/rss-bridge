<?php

/**
 * This file is part of RSS-Bridge, a PHP project capable of generating RSS and
 * Atom feeds for websites that don't have one.
 *
 * For the full license information, please view the UNLICENSE file distributed
 * with this source code.
 *
 * @package Core
 * @license http://unlicense.org/ UNLICENSE
 * @link    https://github.com/rss-bridge/rss-bridge
 */

final class APIAuthenticationMiddleware
{
    public function __invoke(): void
    {
        $accessTokenInConfig = Configuration::getConfig('api', 'access_token');
        if (!$accessTokenInConfig) {
            throw new \Exception('API authentication is disabled in this instance', 403);
        }

        $header = trim($_SERVER['HTTP_AUTHORIZATION'] ?? '');
        $position = strrpos($header, 'Bearer ');

        if ($position !== false) {
            $accessTokenGiven = substr($header, $position + 7);

            if ($accessTokenGiven != $accessTokenInConfig) {
                return;
            }

            throw new \Exception('Incorrect access token', 403);
        }

        throw new \Exception('No access token given', 403);
    }
}
