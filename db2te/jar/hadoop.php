<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2013 All rights reserved.
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

if( isset($GLOBALS["hadoopLoader"]) )  
	if( $GLOBALS["hadoopLoader"] != null ) 
		if($GLOBALS["hadoopLoader"]) 
			return; 
if(HADOOP_HOME==null) return;  
if(HADOOP_HOME=="") return;  
$files = @scandir(HADOOP_HOME);
foreach($files as $file)
	if(preg_match('/hadoop-core*/i', $file) ) $jarfile=$file;
if(!isset($jarfile)) return;
if(DEBUG_LOG_2_CONSOLE)	error_log("hadoop hadoopLoader start",0);
$GLOBALS["hadoopLoader"] = new JavaClassLoader(HADOOP_HOME.$jarfile,HADOOP_HOME.'lib/');
$GLOBALS["hadoopLoader"]->getClass('org.apache.hadoop.conf.Configuration');
$GLOBALS["hadoopLoader"]->getClass('org.apache.hadoop.mapreduce.Job');
$GLOBALS["hadoopLoader"]->getClass('org.apache.hadoop.mapred.JobConf');
$GLOBALS["hadoopLoader"]->getClass('org.apache.hadoop.mapred.JobClient');
$GLOBALS["hadoopDriverLoaded"]=($GLOBALS["org.apache.hadoop.conf.Configuration"]!=null);
if(DEBUG_LOG_2_CONSOLE)	error_log("hadoop hadoopLoader completed",0);
 
?>