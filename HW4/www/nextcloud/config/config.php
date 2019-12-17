<?php
$CONFIG = array (
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
  'logfile' => '/var/log/nextcloud/nextcloud.log',
  'memcache.local' => '\\OC\\Memcache\\APCu',
  'instanceid' => 'oc7a7ay5d7sp',
  'passwordsalt' => 'y7AWUQ6tvDnHLEZ0dpuLt59cU97ETD',
  'secret' => '3I1xlGxC/caFD+dm9awpTIewjQ7dGuKL5MKjZ9aMcELhn//r',
  'trusted_domains' =>  
  array (
	  0 => 'localhost',
	  1 => 'mysahw4.nctu.me',
  ),
  'datadirectory' => '/usr/local/www/nextcloud/data',
  'dbtype' => 'mysql',
  'version' => '16.0.4.1',
  'overwrite.cli.url' => 'http://localhost',
  'dbname' => 'nextcloud',
  'dbhost' => 'localhost',
  'dbport' => '',
  'dbtableprefix' => 'oc_',
  'mysql.utf8mb4' => true,
  'dbuser' => 'nc',
  'dbpassword' => 'A081056',
  'installed' => true,
);
