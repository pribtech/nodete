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
TE_session_start();
$IBMSSOcode=$_SESSION['IBMSSOcode'];
TE_session_write_close();

try {
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
	$token_url=$credentials['token_url'];
	$profile_resource=$credentials['profile_resource'];
	$tokeninfo_resource=$credentials['tokeninfo_resource'];
	$openidProviderURL=$credentials['openidProviderURL'];
	$authorize_url=$credentials['authorize_url'];
/*

//	"profile_resource":"https://idaas.ng.bluemix.net/idaas/resources/profile.jsp",
	
	$req_url = 'https://idaas.ng.bluemix.net/sps/oauth20sp/oauth20/token'; // "token_url"
	$acc_url = 'https://idaas.ng.bluemix.net/idaas/resources/tokeninfo.jsp'; //"tokeninfo_resource"
	$api_url = 'https://idaas.ng.bluemix.net/idaas/openid';   //"openidProviderURL"
	$authurl = 'https://idaas.ng.bluemix.net/sps/oauth20sp/oauth20/authorize';  //"authorize_url"
	
https://idaas.ng.bluemix.net/sps/oauth20sp/oauth20/authorize?client_id=sOdxIgNm8cuseKoj3HFM&response_type=code&scope=profile&state=test&redirect_uri=http://pribdb2te.ng.bluemix.net/db2te/action.php?action=sessionIBMSSO

*/       
	$consumer_key = 'sOdxIgNm8cuseKoj3HFM';
	$consumer_secret = '8y5eyMup8h0AmDeqppOI';	

	$link='https://idaas.ng.bluemix.net/sps/oauth20sp/oauth20/token';
//	$data="client_id=".$consumer_key."&client_secret=".$consumer_secret."&grant_type=authorization_code&code=abcd1234&redirect_uri=<your_application_redirect_uri>";
	$data="client_id=".$consumer_key."&client_secret=".$consumer_secret."&grant_type=authorization_code&code=".$IBMSSOcode;
/*
 * expected response
 * 
  { 
  "expires_in":3599,
  "scope":"profile",
  "access_token":"lCn1oPFA6SJXKyWW7xpF",
  "token_type":"bearer",
  "refresh_token":"JgDXOI5uSEVTUn9DbKhB4lv1XN9aZe2rxrTVmDZ8"
}

"Authorization: bearer <your_bearer_token>" https://idaas.ng.bluemix.net/idaas/resources/profile.jsp
 should  then give
 
 {
  "firstName":["Test"],
  "lastName":["User"],
  "name":["Test User"],
  "email":["testuser@mailinator.com"],
  "userRealm":"www.ibm.com",
  "userDisplayName":["testuser@mailinator.com"],
  "username":"http:\/\/www.ibm.com\/testuser@mailinator.com",
  "userUniqueID":["http:\/\/www.ibm.com\/XXXXXXXXXX"],
  "AUTHENTICATION_LEVEL":"2",
  "AZN_CRED_CREATE_TIME":"2013-12-11T01:11:31Z",
  "idaas.verified_email":["testuser@mailinator.com"]}
  

 */	
	if(!function_exists('curl_version'))
		throw new Exception('IBMSSO user details requires PHP curl extension enabled.');
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