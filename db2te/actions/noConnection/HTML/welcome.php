<?php
require_once(JAR_BASE_DIRECTORY . "java.php");
?>
<div class="generalHTML">
<div id="title">Welcome to the Technology Explorer for IBM DB2 <?php echo TE_VERSION ?></div>

<p>
<table>
	<tr>
		<td><img src="./images/logo.jpg"/></td>
		<td><h1>The Technology Explorer for IBM DB2 <?php echo TE_VERSION ?></h1></td>
		<td><img src="./images/frygmaLogo.jpg" height="80" /></td>
		</tr>
</table>
<table border="0" cellspacing="0" cellpadding="5">
  <tr>
	<td class="tableText">
The Technology Explorer (TE) is a light weight, web based console for DB2 for Linux, UNIX and Windows. 
The Technology Explorer strives to be a teaching tool for all users of DB2. 
Whether you're just starting to use DB2, or have been for years,
there are tutorials for you around many aspects of DB2.
Part of what makes the TE such a great teaching tool is that it doesn't just explain to you how a system should act,
the Technology Explorer shows you, using your database! 
The TE has a large number of views that show you how your database is actually behaving. 
All of the views the TE uses to teach you about DB2 can be used individually, 
making the TE a very powerful monitoring tool as well.
The Technology Explorer is meant to be a tool for you! 
You can use it, change it, build it. 
Everything is defined using XML so you don't need to be a programmer to make changes.


Instructions for extending the TE can be found on our wiki <a href="http://db2mc.sf.net" target="_blank">db2mc.sf.net</a>. 
The TE team can be contacted for help though our Source Forge site <a href="http://sf.net/projects/db2mc" target="_blank"> sf.net/projects/db2mc</a>. 
While this project was started and is continued to be maintained and extended in an IBM lab, this is a community project. 
We want people who use DB2 for Linux, UNIX and Windows to customize and extend this project and contribute back to the community. 
To provide feedback, suggestions, or report defects go to the db2mc project on SourceForge.net located at <a href="http://sf.net/projects/db2mc" target="_blank">sf.net/projects/db2mc</a>
	</td>
  </tr>
</table>
</p>
<p>
A new feature, the Workload Multiuser Driver (WMD) can be used to drive dynamic workloads against your database and can either be used within tutorials and demos or as a seperate tool within the TE.  
A Java JRE 1.6+ is required as well as an IBM DB2 jcc driver which can be downloaded from the <a href="http://www-01.ibm.com/support/docview.wss?rs=4020&uid=swg27016878" target=_blank">IBM jcc download</a> site.  For instructions on how to install, configure, and use the WMD, please visit the <a href="http://sourceforge.net/apps/mediawiki/db2mc/index.php?title=Workload_Multiuser_Driver" target="_blank"> WMD wiki.</a>
</p>
<p>
Some of the key features of the Technology Explorer are:
<ul>
	<li>A light weight, web based platform for interacting with DB2 Linux, UNIX and Windows servers </li>
	<li>Intergated with BlueMix</li>
	<li>Easily expandable and customizable</li>
	<li>Works with DB2 for Linux, UNIX and Windows Version 9, 9.5, 9.7, 10.1 and 10.5</li> 
	<li>Connect to any DB2 data server using only an IP address</li>
	<li>Contains a wealth of content to highlight, demonstrate and teach you about some of DB2's core features</li>
	<li>Have basic features for other databases</li>
</ul>
</p>
<br/><br/>
Java Bridge <?php if(JAVA_BRIDGE_ACTIVE) $v=java_get_version_info(); echo (JAVA_BRIDGE_ACTIVE?'Installed version '.$v["version"]:'<font style="background-color:RED;">Not Installed  - Dependant features not available</font>')?>
<p>
PHP database driver check:
<table><tr>
<?php
if(DEBUG_LOG_2_CONSOLE)	error_log("Loading connection drivers started in Welcome",0);
try {
	$fileInDir = scandir(PHP_INCLUDE_BASE_DIRECTORY, 0);
	sort($fileInDir);
	foreach($fileInDir as $currentFile) {
		// Look for XML files that start with 'menu_' and end with '.xml' while ignoring case
		if(preg_match('/^DBConnection_.*\.php$/i', $currentFile )) {
			if(DEBUG_LOG_2_CONSOLE)	error_log("Loading connection driver ".$currentFile,0);
			try {
				include_once(PHP_INCLUDE_BASE_DIRECTORY . $currentFile);
				if(DEBUG_LOG_2_CONSOLE)	error_log("Loaded connection driver ".$currentFile,0);
			} catch (Exception $e){
				if(DEBUG_LOG_2_CONSOLE) error_log("error ".$e->getMessage(),0);
				echo '</tr><tr><td>'.$currentFile.'</td><td style="background-color:RED;">PHP module has problem loading, error: '.$e->getMessage().'</td>';
				continue;
			}
			$className = substr($currentFile, 2, -4);
			if($className === false) continue;
			try{
				if (version_compare(PHP_VERSION, '5.3.0') >= 0) {
					$isPHPExtension      = $className::$isPHPExtension;
					$requiredExtension   = $className::$requiredDBExtension;
					$reqMinVersion       = $className::$requiredDBExtensionMinVersion;
				} else {
					$isPHPExtension      = eval('return ' . $className . '::$isPHPExtension;');
					$requiredExtension   = eval('return ' . $className . '::$requiredDBExtension;');
					$reqMinVersion       = eval('return ' . $className . '::$requiredDBExtensionMinVersion;');
				}
			} catch (Exception $e){
				if(DEBUG_LOG_2_CONSOLE) error_log("error ".$e->getMessage(),0);
				echo '</tr><tr><td>'.$currentFile.'</td><td style="background-color:RED;">PHP module has problem with class definition, error: '.$e->getMessage().'</td>';
				continue;
			}
			if($requiredExtension === false) continue;
			echo '</tr><tr><td>'.strtoupper($requiredExtension).'</td>';		
			if($isPHPExtension) {
				$extension_version = phpversion($requiredExtension);
				if($extension_version === false) {
					foreach (get_loaded_extensions() as $i => $ext)
						if($ext==$requiredExtension) break;
					if($ext==$requiredExtension) {
						echo '<td style="background-color:limegreen;">'.strtoupper($requiredExtension).' PHP module detected, version unknown</td>';
						continue;
					}
					echo '<td style="background-color:RED;">PHP module was not found.</td>';
					continue;	
				} elseif($reqMinVersion != null) 
					if($extension_version < $reqMinVersion) {
						echo '<td style="background-color:YELLOW;">Upgrade to latest PHP module. v' . $extension_version . ' is installed a minimum of v' . $reqMinVersion . ' is required.</td>';
						continue;	
					}
				echo '<td style="background-color:limegreen;"> v' . $extension_version . ' PHP module detected</td>';
				continue;
			}
			if(!JAVA_BRIDGE_ACTIVE) {
				echo '<td style="background-color:RED;">PHP Java Bridge not installed"</td>';
				continue;;
			} 
			if (version_compare(PHP_VERSION, '5.3.0') >= 0)
				$driverLoaded = $className::$driverLoaded;
			else
				$driverLoaded = eval('return ' . $className . '::$driverLoaded  ;');
				
			if(!isset($GLOBALS[$driverLoaded]) || ! $GLOBALS[$driverLoaded]) {
				echo '<td style="background-color:RED;">The driver class library location not defined or found.</td>';
				continue;;
			} 
			echo '<td style="background-color:limegreen;"> extension using java bridge module detected</td>';		
		}
	}
} catch (Exception $e){
	error_log('Error loading DBConnections, exception: '.$e->getMessage(),0);
}
if(DEBUG_LOG_2_CONSOLE)	error_log("Loading connection drivers finished ",0);
?>
<tr><table>
</div>
