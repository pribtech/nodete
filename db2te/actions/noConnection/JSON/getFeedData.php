<?php

include_once(PHP_INCLUDE_BASE_DIRECTORY . "ArrayEncodeFeed.php");
include_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectFeedSourceManager.php");

$sourceList = feedSourceManager::retrieveAllSources();

ArrayEncodeFeed::$maxItemsToReturn = getParameter('returnCount', 10);

$FeedData = array();
$FeedDataFromAllSources = array();
try {
	if($sourceList == null) 
		throw new Exception('Empty RSS Feed list');
	foreach($sourceList as $source) {
		if($source == null) 
			throw new Exception('a source is null');
		if(!$source['enabled'])
			continue;
		if($source['link'] == 'SELF')
			$link = ( isset($_SERVER["HTTP_REFERER"]) ? $_SERVER["HTTP_REFERER"] : $_SERVER["SERVER_NAME"].dirname($_SERVER['PHP_SELF'])).'rss.php';
		else
			$link = $source['link'];
			
		if(!function_exists('curl_version'))
			throw new Exception('Feed data requires PHP curl extension enabled.');
		$cURL = curl_init();
		
		curl_setopt($cURL, CURLOPT_URL,$link);
		curl_setopt($cURL, CURLOPT_RETURNTRANSFER,1);
		curl_setopt($cURL, CURLOPT_TIMEOUT,10);
		curl_setopt($cURL, CURLOPT_HEADER, 0);
		curl_setopt($cURL, CURLOPT_SSL_VERIFYHOST, 0);
		curl_setopt($cURL, CURLOPT_SSL_VERIFYPEER, 0);
		$RawData = curl_exec($cURL);
		$curl_errno = curl_errno($cURL);
		$curl_error = curl_error($cURL);
		curl_close($cURL);
		if ($curl_errno > 0) {
			$FeedDataFromAllSources[]=errorFeed( $source['title'], $curl_error );
			continue;
		}
//		$RawData = @file_get_contents($link);
		if($RawData==null ||  $RawData=="") {
			$FeedDataFromAllSources[]=errorFeed( $source['title'], 'No data' );
			continue; 
		}
		if(preg_match('/^Not Found/', $RawData) > 0) {
			$FeedDataFromAllSources[]=errorFeed( $source['title'], $RawData );
			continue; 
		}
		$Feed = ArrayEncodeFeed::fromString($RawData);
		if($Feed==null || !isset($Feed['description']) ) {
			$FeedDataFromAllSources[]=errorFeed( $source['title'], 'No RSS data' );
			continue;
		}
		$Feed ['title'] = $source['title'];
		$FeedDataFromAllSources[] = $Feed;
	}

	if($FeedDataFromAllSources == null)
		throw new Exception('Could not retrieve data from sources.');
	$FeedData['returnCode'] = true;
	$FeedData['returnValue'] = $FeedDataFromAllSources;
} catch(Exception $e) {
	$FeedData['returnCode'] = false;
	$FeedData['returnValue'] =  "Failed: ".$e->getmessage();
}

function errorFeed(&$title, $error) {
	return array('title' => $title.'   ERROR: '.$error , 'items' => array() ) ;
}
		
echo json_encode($FeedData);