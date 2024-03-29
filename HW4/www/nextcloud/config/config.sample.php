<?php

/** This is the bare minimum configuration for the bundled installer
  * to function properly.  
  */

$CONFIG = array (

/** The FreeBSD package separates apps into bundled apps and user-
  * installed apps. If this 'apps_paths' array is missing from
  * your config, your Nextcloud installation is broken 
  */
  'apps_paths' =>
  array (
    0 =>
    array (
      'path' => '/usr/local/www/nextcloud/apps',
      'url' => '/apps',
      'writable' => true,
    ),
    1 =>
    array (
      'path' => '/usr/local/www/nextcloud/apps-pkg',
      'url' => '/apps-pkg',
      'writable' => false,
    ),
  ),

// Log-files belong in the appropriate location
  'logfile' => '/var/log/nextcloud/nextcloud.log',

// Enable user caching when option is enabled
  'memcache.local' => '\OC\Memcache\APCu',
);
