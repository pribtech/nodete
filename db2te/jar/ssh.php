<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2010 All rights reserved.
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
require_once("jar/java.php");
if( !isset($GLOBALS["sshLoader"]) || $GLOBALS["sshLoader"] == null || !$GLOBALS["sshLoader"]) {
	$GLOBALS["sshLoader"] = new JavaClassLoader(
    	 JAR_BASE_DIRECTORY.'/sshClient.jar'
    	,JAR_BASE_DIRECTORY.'/mina-core-2.0.0-RC1.jar'
    	,JAR_BASE_DIRECTORY.'/slf4j-api-1.4.3.jar'
    	,JAR_BASE_DIRECTORY.'/slf4j-simple-1.4.3.jar'
    	,JAR_BASE_DIRECTORY.'/sshd-core-0.4.0.jar'
		);
	$GLOBALS["sshLoader"]->getClass('SshProcessor');
	$GLOBALS["sshDriverLoaded"]=($GLOBALS["SshProcessor"]!=null);
}
/*
java_last_exception_clear();

try {
	$step='sshClient';
    $url0=new Java('java.net.URL','jar:file:'.__DIR__.'/sshClient.jar!/');
	$step='mina-core-2.0.0-RC1';
    $url1=new Java('java.net.URL','jar:file:'.__DIR__.'/mina-core-2.0.0-RC1.jar!/');
	$step='slf4j-api-1.4.3';
    $url2=new Java('java.net.URL','jar:file:'.__DIR__.'/slf4j-api-1.4.3.jar!/');
	$step='slf4j-simple-1.4.3';
    $url3=new Java('java.net.URL','jar:file:'.__DIR__.'/slf4j-simple-1.4.3.jar!/');
	$step='sshd-core-0.4.0.jar!';
    $url4=new Java('java.net.URL','jar:file:'.__DIR__.'/sshd-core-0.4.0.jar!/');
    $urlArray=array($url0,$url1,$url2,$url3,$url4);
	$step='URLClassLoader';
	$classLoader=new Java('java.net.URLClassLoader',$urlArray);
	$step='Class';
	$class = new Java('java.lang.Class');
	$step='SshProcessor';
	$SshClass = $class->forName('SshProcessor',false,$classLoader);
	$GLOBALS["SshClass"] = $SshClass; 
	
} catch (JavaException $e) {
	throw new Exception('ssh load class '. $step.' failed error: '.$e->getCause().' jar directory: '.__DIR__.' check java bridge working correctly');
} 
*/
?>