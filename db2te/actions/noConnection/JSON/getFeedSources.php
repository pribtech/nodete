<?php

include_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectFeedSourceManager.php");


$sourceList = array ();
$sourceList = feedSourceManager::retrieveAllSources();


$FeedData = array();
$FeedData['returnCode'] = false;
$FeedData['returnValue'] = 'Unknown error';

if($sourceList != null)
{
	$FeedData['returnCode'] = true;
	$FeedData['returnValue'] = $sourceList ;
}

				
echo json_encode($FeedData);