<?php
/*******************************************************************************
 *  Copyright IBM Corp. 2007 All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *********************************************************************************/
	require_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectXMLNode_" . XML_PARSING_ENGINE . ".php");
	require_once(PHP_INCLUDE_BASE_DIRECTORY . "JSONEncodeAction.php");

	echo "
		GLOBAL_TE_SUPPORTED_DRIVERS = \$H();\n
		";
	
	loadDriversList(TE_DRIVERS_BASE_DIRECTORY);

	function driverDetails($driver,$className) {
		return json_encode(array(
				 'name' 		=> $driver
				,'default'		=> ($className=="Connection_IBM_DB2"?true:false)
				,'attributes'	=> (version_compare(PHP_VERSION, '5.3.0') >= 0
						?$className::getAttributes()
						:eval('return ' . $className.'::getAttributes();')
						)
			));				
	}

	function loadDriversList($location) {	
		// if the current expected directory is not a directory return
		if(is_dir($location) === false) return "";
	
		// Acquire a list of files in the directory sorted ascending
		$fileInDir = scandir($location, 0);
		
		sort($fileInDir);
		
		foreach($fileInDir as $currentFile) {
			// Look for XML files that start with 'menu_' and end with '.xml' while ignoring case
			if(preg_match('/^DBConnection_.*\.php$/i', $currentFile )) {
				try {
					include_once(PHP_INCLUDE_BASE_DIRECTORY . $currentFile);
				} catch (Exception $e){
					continue;
				}
				$className = substr($currentFile, 2, -4);
				if($className === false) continue;
				if (version_compare(PHP_VERSION, '5.3.0') >= 0) {
						$isPHPExtension		= $className::$isPHPExtension;
						$requiredExtension	= $className::$requiredDBExtension;
						$reqMinVersion		= $className::$requiredDBExtensionMinVersion;
						$driverOK			= $className::driverCheck();
				} else {
						$isPHPExtension		= eval('return ' . $className . '::$isPHPExtension;');
						$requiredExtension	= eval('return ' . $className . '::$requiredDBExtension;');
						$reqMinVersion		= eval('return ' . $className . '::$requiredDBExtensionMinVersion;');
						$driverOK			= eval('return ' . $className . '::driverCheck();');
				}
				if($requiredExtension === false) continue;
				if($isPHPExtension) {
					if(!$driverOK) continue;
//					$extension_version = phpversion($requiredExtension);
//					if($extension_version === false)
//						continue;	
//					if($reqMinVersion != null) {
//						if($extension_version >= $reqMinVersion) {
							$driver = str_replace("DBConnection_","","$currentFile");
							$driver = str_replace(".php","","$driver");

							echo " var value=
									GLOBAL_TE_SUPPORTED_DRIVERS.set('$driver', ".driverDetails($driver,$className).");\n";	
//						}
//						continue;
//					}
				} 
				$driver = str_replace("DBConnection_","","$currentFile");
				$driver = str_replace(".php","","$driver");
				echo "GLOBAL_TE_SUPPORTED_DRIVERS.set('$driver', ".driverDetails($driver,$className).");\n";		
			}
		}
	}
