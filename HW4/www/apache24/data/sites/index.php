<!DOCTYPE html5>
<html>
<?php
	$url=$_SERVER['REQUEST_URI'];
	$a=explode('~',$url)[1];
	echo $a;
	echo file_get_contents("/usr/local/www/nextcloud/data/".$a."/files/public_html/index.html",'r');
?>
</html>
