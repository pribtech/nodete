<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2011 All rights reserved.
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
require_once("./config.php");
$rssCacheTimeout=60;
class checks {
	private	$healthSQL = array(
		 'DB2'	=> array(
		 	array(
				"sql"=>"
SELECT coalesce('Backup old '||TIMESTAMPDIFF(16,CHAR(LAST_BACKUP - current timestamp))||' days','Never backed up!!!') 
FROM table(SNAP_GET_DB('', -2) ) a 
where LAST_BACKUP is null or  TIMESTAMPDIFF(16,CHAR(LAST_BACKUP - current timestamp)) > 3
		 			"
				,"title"=>"Backup Age too old"
				,"description"=>"Backup Age too old"
				)
			)
		,'MYSQL' => array(
			)
		);
	private $id;
	private $rssOutput="";
	private $rssItemCount=0;
	function checkIfTooManyItems() {
		if($this->rssItemCount++<1000) return;
		throw new Exception("Too many items to list");
	}
	function setConnectId($id) {$this->id=$id;}
	function setError($msg) { $this->setItem("Access","<![CDATA[".$msg."]]>");}
	function setItem($title,$description,$currentTimestamp = null) {
		$this->rssItemCount++;
		if($currentTimestamp==null) $currentTimestamp = date("D, d M Y H:i:s T");
		$this->rssOutput .= "<item><title>connection: ".$this->id." - ".$title."</title>"
								."<pubDate>".$currentTimestamp."</pubDate>"
								."<update>".$currentTimestamp."</update>"
										."<link></link>"
								."<description>".$description."</description>"
   	     					."</item>";
	}
	function execute(&$connection) {
		$ok=true;
		$testCount=0;
		foreach ($this->healthSQL["DB2"] as &$check) {
			try{
				$testCount++;
				$stmt = $connection->newStatement($check["sql"]);
				if(!$stmt->execSuccessful()) 
					throw new Exception($stmt->errorMsg() ." statement: ".$check["sql"]);
				$result = $stmt->fetch();
				if(!$stmt->execSuccessful()) 
					throw new Exception($stmt->errorMsg() ." Fetch failed, statement: ".$check["sql"]);
				if(!($result = $stmt->fetch())) continue;
				$this->setItem($check["title"],$result[0]."  ".$check["description"]);
				$ok=false;
			} catch (Exception $e) {
				$this->setError($e->getMessage());
				$ok=false;
				continue;
			}
			$this->checkIfTooManyItems();
		}
		try{
			$stmt = $connection->newStatement("select 1 from syscat.tables where tabschema='s#db2mc ' and tabname='ALERT'");
			if(!$stmt->execSuccessful()) 
				throw new Exception("Error in check for alert table, error: ".$stmt->errorMsg() );
			if(!($result = $stmt->fetch()))
				throw new Exception("No alert history table found");
			$stmt = $connection->newStatement('select a.name,a.description,h.value,h.id,h.SAMPLE_TS from "s#db2mc".ALERT_HISTORY h join "s#db2mc".ALERT a on h.name=a.name where h.sample_ts>current timestamp - 3 days order by h.sample_ts desc');
			if(!$stmt->execSuccessful()) 
				throw new Exception("Error in listings alerts, error: ".$stmt->errorMsg() );
			while($result = $stmt->fetch()) {
				$pubtime=substr($result[4],0,10)."T".substr($result[4],11,8)."Z";
				$this->setItem($result[1],$result[0]." = ".$result[2]." for ".$result[3], $pubtime);
				$ok=false;
				$this->checkIfTooManyItems();
			}
		} catch (Exception $e) {
			$this->setError($e->getMessage());
			$ok=false;
		}
		if($ok) $this->setItem("OK","No issues found, number of metrics tested: ".$testCount);
	}
	function getRss() {return $this->rssOutput;}
}

$cachingActive = (version_compare(PHP_VERSION, '5.2.0')<=0)?false: (extension_loaded('apc') && version_compare(phpversion('apc'),'3.0.17')>0);
$rss = ($cachingActive ? apc_fetch('rss') : false );
if ( $rss==false ) {
	$currentTimestamp = date("D, d M Y H:i:s T");
	$httpReferer = isset($_SERVER["HTTP_REFERER"]) ? $_SERVER["HTTP_REFERER"] : $_SERVER["SERVER_NAME"].dirname($_SERVER['PHP_SELF']);
 	$rss = "<?xml version=\"1.0\"?>"
           		."<rss version=\"2.0\">"
                	."<channel>"
                    	."<title>DB2TE</title>"
                    	."<link>".$httpReferer."/rss.php</link>"
."<description>The Technology Explorer (TE) is a light weight, web based console for DB2 and MySQL for Linux, UNIX and Windows. 
Part of the features are an RSS feed to provide monitoring information if certain conditions apply.
To activate the server to has be configured.  See installation instructions for details.  
</description>"
                    ."<language>en-us</language>"
                    ."<pubDate>".$currentTimestamp."</pubDate>"
                    ."<lastBuildDate>$currentTimestamp</lastBuildDate>"
                    ."<docs>".$httpReferer."</docs>"
                    ."<managingEditor>db2te@".$_SERVER["SERVER_NAME"]."</managingEditor>"
                    ."<webMaster>db2te@".$_SERVER["SERVER_NAME"]."</webMaster>"
            ;
	$rss .= "<item><title>Technology Explorer (TE) monitoring RSS feed</title>"
			."<link>".$httpReferer."</link>"
			."<pubDate>".$currentTimestamp."</pubDate>"
			."<description>This is a test feed to see if caching is working.  Build timestamp is $currentTimestamp."
			." If this time stamp changes within ".$rssCacheTimeout." seconds it means caching hasn't been turned on at the server.</description>"
     		."</item>";
 	     	
   	$check=new Checks();
   	try{
   		$connectionProfile = new connectManagerNodes();
		$connectionProfile->checkHealth($check);
	} catch (Exception $e) {
		$check->setError('Connect build '.$e);
	}
	$rss .= $check->getRss();
	$rss .= "</channel></rss>";
	if ($cachingActive) 
		apc_store('rss',$rss,$rssCacheTimeout);
}

header("Content-Type: application/rss+xml");
echo $rss;
?> 
 