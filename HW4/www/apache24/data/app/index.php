<?php
	$name=$_GET['name'];
	$url=$_SERVER['REQUEST_URI'];
	$cal=explode("/",$url)[2];
?>
<!DOCTYPE html5>
<html>
<body>
<?php
	if($name=='' && $cal==''){
		echo "<h1>route: /</h1>";
	} else if( $name=='') {
		$n=explode('+',$cal);
		$cal=(int)$n[0]+$n[1];
		echo "<h1>result: ".$cal."</h1>";
	} else {
		echo "<h1>Hello, ".$name."</h1>";
	}

?>
<h1>A081056 SA HW4</h1>
</body>
</html>
