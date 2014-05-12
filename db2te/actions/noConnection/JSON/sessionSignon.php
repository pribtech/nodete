<?php
/*******************************************************************************
  *  Author: Peter Prib
 * 
 * Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2014 All rights reserved.
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
try {
	
/*
	$services = getenv('VCAP_SERVICES');
	if(!$services)
		throw new Exception('Requires IBM Bluemix and SSO application');
	$servicesArray=json_decode($services, true);
	foreach(json_decode($services, true) as $serviceName => $serviceType) {
		$parts=explode('-',$serviceName);
		$vcapService=$parts[0];
		if($vcapService=='SSO')
			$SSOservices=$serviceType;
	}
	if(!isset($SSOservices))
		throw new Exception('Requires SSO application');
	foreach($SSOservices as $index => $service) {
		$credentials=$service["credentials"];
	}
	if(!isset($credentials))
		throw new Exception('SSO application credentials not found');
	session_start();
	
	if(!isset($_GET['oauth_token']) && $_SESSION['state']==1) $_SESSION['state'] = 0;

	$consumer_key = 'sOdxIgNm8cuseKoj3HFM';  // sOdxIgNm8cuseKoj3H
	$consumer_secret = '8y5eyMup8h0AmDeqppOI'; //8y5eyMup8h0AmDeqppOI	
	

//	"profile_resource":"https://idaas.ng.bluemix.net/idaas/resources/profile.jsp",
	
	$req_url = 'https://idaas.ng.bluemix.net/sps/oauth20sp/oauth20/token'; // "token_url"
	$acc_url = 'https://idaas.ng.bluemix.net/idaas/resources/tokeninfo.jsp'; //"tokeninfo_resource"
	$api_url = 'https://idaas.ng.bluemix.net/idaas/openid';   //"openidProviderURL"
	$authurl = 'https://idaas.ng.bluemix.net/sps/oauth20sp/oauth20/authorize';  //"authorize_url"
	
	$oauth = new OAuth($consumer_key,$consumer_secret,OAUTH_SIG_METHOD_HMACSHA1,OAUTH_AUTH_TYPE_URI);
	$oauth->enableDebug();
	if(!isset($_GET['oauth_token']) && !$_SESSION['state']) {
		$request_token_info = $oauth->getRequestToken($req_url);
		$_SESSION['secret'] = $request_token_info['oauth_token_secret'];
		$_SESSION['state'] = 1;
		header('Location: '.$authurl.'?oauth_token='.$request_token_info['oauth_token']);
		exit;
	} else if($_SESSION['state']==1) {
		$oauth->setToken($_GET['oauth_token'],$_SESSION['secret']);
		$access_token_info = $oauth->getAccessToken($acc_url);
		$_SESSION['state'] = 2;
		$_SESSION['token'] = $access_token_info['oauth_token'];
		$_SESSION['secret'] = $access_token_info['oauth_token_secret'];
	}
	$oauth->setToken($_SESSION['token'],$_SESSION['secret']);
	$oauth->fetch("$api_url/user.json");

	$json = json_decode($oauth->getLastResponse());
/*			
    $oauth->setToken($request_token,$request_token_secret);
    $access_token_info = $oauth->getAccessToken("https://example.com/oauth/access_token");
    if(!empty($access_token_info)) {
        print_r($access_token_info);
        
     $request_token_info = $oauth->getRequestToken("https://example.com/oauth/request_token");
    if(!empty($request_token_info)) { 
Array

    [oauth_token] => some_token
    [oauth_token_secret] => some_token_secret

*

https://idaas.ng.bluemix.net/sps/oauth20sp/oauth20/authorize?client_id=sOdxIgNm8cuseKoj3HFM&response_type=code&scope=profile&state=test&redirect_uri=http://pribdb2te.ng.bluemix.net/db2te/action.php?action=sessionIBMSSO

*/       
	$consumer_key = 'sOdxIgNm8cuseKoj3HFM';
	$consumer_secret = '8y5eyMup8h0AmDeqppOI';	

	$link='https://idaas.ng.bluemix.net/sps/oauth20sp/oauth20/token';
//	$data="client_id=".$consumer_key."&client_secret=".$consumer_secret."&grant_type=authorization_code&code=abcd1234&redirect_uri=<your_application_redirect_uri>";
	$data="client_id=".$consumer_key."&client_secret=".$consumer_secret."&grant_type=authorization_code&code=abcd1234";
	
	if(!function_exists('curl_version'))
		throw new Exception('Feed data requires PHP curl extension enabled.');
	$cURL = curl_init();
	
	
	curl_setopt($cURL, CURLOPT_URL,$link);
	curl_setopt($cURL, CURLOPT_POSTFIELDS,$data);
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
	if($RawData==null ||  $RawData=="")
		throw new Exception('Not data.');
	if(preg_match('/^Not Found/', $RawData) > 0) 
		throw new Exception('Not found.');
	$response=json_decode($RawData,true);
	if(array_key_exists('error',$response))
		throw new Exception($response['error_description']);
				

//	{\"error\":\"invalid_client\",\"error_description\":\"FBTOAU204E An invalid secret was provided for the client with identifier: 'sOdxIgNm8cuseKoj3HFM'.\"}"}
	
	$returnObject = array(
		 'returnCode' => 'true'
		,'returnValue' => 'Successfully signed on data'.$RawData
		);
} catch(Exception $e) {
	$returnObject = array(
		 'returnCode' => 'false'
		,'returnValue' => 'Session signon '.$e->getmessage()
		);
/*
} catch(OAuthException $e) {
	$returnObject = array(
		 'returnCode' => 'false'
		,'returnValue' => 'Session signon '.$e->lastResponse
		);
*/
}

echo json_encode($returnObject);