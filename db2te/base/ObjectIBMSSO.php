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
include_once(PHP_INCLUDE_BASE_DIRECTORY . "initializeSession.php");

function getIBMSSO () {
	TE_session_start();
	if(isset($_SESSION['IBMSSO'])) 
		$object=unserialize($_SESSION['IBMSSO']);
	TE_session_write_close();
	if(isset($object))
		if($object !== null ) return $object;
	return new IBMSSO();
}
function saveIBMSSO (&$object) {
	TE_session_start();
	$_SESSION['IBMSSO']=serialize($object);
	TE_session_write_close();
}
class IBMSSO {
	private $token_url;
	private $profile_resource;
	private $tokeninfo_resource;
	private $openidProviderURL;
	private $authorize_url;
	private $state;
	private $code;
	private $consumer_key = 'sOdxIgNm8cuseKoj3HFM';
	private $consumer_secret = '8y5eyMup8h0AmDeqppOI';
	private $tokenBearer;
	
	public function __construct() {
		$this->state=session_id();
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
 		$this->token_url=$credentials['token_url'];
 		$this->$profile_resource=$credentials['profile_resource'];
 		$this->$tokeninfo_resource=$credentials['tokeninfo_resource'];
 		$this->$openidProviderURL=$credentials['openidProviderURL'];
 		$this->$authorize_url=$credentials['authorize_url'];
 		saveIBMSSO($this);
 	}
	function __destruct() {
    }
    function getSignonURL() {
    	return $this->$authorize_url."?client_id=".$this->consumer_key."&response_type=code&scope=profile&state=".$this->state."&redirect_uri=".( isset($_SERVER["HTTP_REFERER"]) ? $_SERVER["HTTP_REFERER"] : $_SERVER["SERVER_NAME"].dirname($_SERVER['PHP_SELF'])).ACTION_PROCESSOR."?action=sessionIBMSSO";
    }
    
    function setCode() {
   		if($this->state !== getParameter('state'))
			throw new Exception("States don't match, different session call");
    	$this->code = getParameter('code');
    	saveIBMSSO();
	}
	function getState($state) {
		return $this->state;
	}
	function getResponse($url,$data) {
		error_log("trace get reponse url: ".$url." data:".$data,0);
		$cURL = curl_init();
		curl_setopt($cURL, CURLOPT_URL,$url);
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
		if ($curl_errno > 0)
			throw new Exception($curl_error);
		if($RawData==null ||  $RawData=="")
			throw new Exception('Not data.');
		if(preg_match('/^Not Found/', $RawData) > 0)
			throw new Exception('Not found.');
		$response=json_decode($RawData,true);
		if(array_key_exists('error',$response))
			throw new Exception($response['error_description']);
		error_log("trace reponse: ".var_export($response,true),0);
		
	}
	function getBearer() {
		$this->tokenBearer=$this->getResponse(
			 $this->profile_resource 
			,"Authorization: bearer ".$this->getBearerToken()
			);
/*
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
	}
	function getBearerToken() {
		if($this->tokenBearer!=null) return $this->tokenBearer['access_token'];
		$this->tokenBearer=$this->getResponse(
			 $this->token_url 
			,"client_id=".$this->consumer_key."&client_secret=".$this->consumer_secret."&grant_type=authorization_code&code=".$this->code
			);
/* token should have form:
   		{
		"expires_in":3599,
		"scope":"profile",
		"access_token":"xxxx",
		"token_type":"bearer",
		"refresh_token":"xxxxx"
		}
 */
		return $this->tokenBearer['access_token'];
	}
}
