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
	private $client_id;
	private $client_secret;
	private $tokenBearer;
	private $bearer;
	private $redirectBase;
	
	public function __construct() {
		$this->state=session_id();
 		$this->setServices();
		$this->setClientSettings();
		if(isset($_SERVER["HTTP_REFERER"]))
			$this->redirectBase=$_SERVER["HTTP_REFERER"];
		else
			$this->redirectBase=$_SERVER["HTTP_HOST"]."/".$_SERVER['PHP_SELF'];
		
 		saveIBMSSO($this);
 	}
	function __destruct() {
    }
    public function getRedirect($action) {
    	return "&redirect_uri=".$this->redirectBase.ACTION_PROCESSOR."?action=".$action;
	}
    public function getSignonURL() {
    	return $this->authorize_url."?client_id=".$this->client_id."&response_type=code&scope=profile&state=".$this->state.$this->getRedirect("sessionIBMSSO");
   }
	public function getUserName() {
		return $this->getBearer()['userUniqueID'];
    }
	public function getBearer() {
		if($this->bearer==null)
			$this->bearer=$this->getResponse(
				 $this->profile_resource 
				,"Authorization: Bearer ".$this->getBearerAccessToken()   // or access_token=????
				);
		return $this->bearer;
/*
 * 
 * if reposnse 401  - <html>401</html>
 * then curl -d "client_id=mobileClient&grant_type=refresh_token&refresh_token=WtFQMWtU88cRdxNoCYl8FJwU7wiAnLbrY0peYSWa" \
    https://tfim01.demos.ibm.com/FIM/sps/oauth20sp/oauth20/token
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
	function getBearerAccessToken() {
		$token=$this->getBearerToken();
		return $token['access_token'];
	}
	function getBearerToken() {
		if($this->tokenBearer!=null)
			return $this->tokenBearer;
		$this->tokenBearer=$this->getResponse(
			 $this->token_url 
			,"client_id=".$this->client_id."&client_secret=".$this->client_secret."&grant_type=authorization_code&code=".$this->code.$this->getRedirect("sessionIBMSSO")
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
		if($this->tokenBearer==null) 
			throw new Exception('SSO application bearer token null');
		return $this->tokenBearer;
	}
    function getClientSettings(&$valueArray,$key) {
    	if(!is_array($valueArray))
    		throw new Exception('SSO application key: '.$key.' invalid return array: '.var_export($valueArray,true));
 		if(!array_key_exists($key,$valueArray))
 			throw new Exception('SSO application '.$key.' not found');
 		$this->$key=$valueArray[$key];
    }
	function getResponse($url,$data,$convert2Array=true) {
		$cURL = curl_init();
		curl_setopt($cURL, CURLOPT_URL,$url);
		curl_setopt($cURL, CURLOPT_POSTFIELDS,$data);
		curl_setopt($cURL, CURLOPT_RETURNTRANSFER,1);
		curl_setopt($cURL, CURLOPT_TIMEOUT,10);
		curl_setopt($cURL, CURLOPT_HEADER, 0);
		curl_setopt($cURL, CURLOPT_SSL_VERIFYHOST, 0);
		curl_setopt($cURL, CURLOPT_SSL_VERIFYPEER, 0);
		$rawData = curl_exec($cURL);
		$curl_errno = curl_errno($cURL);
		$curl_error = curl_error($cURL);
		curl_close($cURL);
		if ($curl_errno > 0)
			throw new Exception($curl_error);
		if($rawData==null ||  $rawData=="")
			throw new Exception('No data returned');
		if(preg_match('/^Not Found/', $rawData) > 0)
			throw new Exception('Not found.');
		$response=json_decode($rawData,true);
		if($response==null) {
			error_log("IBMSSO getResponse url: ".$url." data: ".$data." response: ".$rawData,0);
			throw new Exception($rawData);
		}
		if(is_array($response)) {
			if(array_key_exists('error',$response))
				throw new Exception($response['error_description']);
		}
		return ($convert2Array?$response:$rawData);
	}
	function getState($state) {
		return $this->state;
	}
	function setClientSettings() {
 		$setting = getenv('TE_IBMSSO');
 		if(!$setting) {
 			if(SSO_CLIENT==false) return;
 			$setting=SSO_CLIENT;
 		}
 		$settingArray=json_decode(stripslashes($setting), true);
 		if(!$settingArray) {
 			error_log("TE_IBMSSO could not be decoded as json, value: ".(isset($setting)?$setting:'null'));
 			throw new Exception('Decode TE_IBMSSO failed');
 		}
 		$this->getClientSettings($settingArray,'client_id');
 		$this->getClientSettings($settingArray,'client_secret');
    }
    function getUserFeatures($user=null) {
    	if($user==null) $user=$this->getUserName();
    	$users = getenv('SSO_USER_FEATURES');
    	if(!$users) {
    		if(SSO_USER_FEATURES==false) return;
    		$users=SSO_USER_FEATURES;
    	}
    	$userArray=json_decode($users, true);
    	if(!$userArray)
    		throw new Exception('Decode SSO_USER_FEATURES failed');
    	if(!array_key_exists($user, $userArray)) return;
    	$features=implode(",",$userArray[$user]);
    	TE_session_start();
    	$_SESSION['BASE_FEATURES']=$features;
    	TE_session_write_close();
    	return $features;
    }
    public function setCode() {
   		if($this->state !== getParameter('state'))
			throw new Exception("States don't match, different session call");
    	$this->code = getParameter('code');
    	saveIBMSSO($this);
	}
    function decodeSSO($credentials) {
 		$this->getClientSettings($credentials,'token_url');
 		$this->getClientSettings($credentials,'profile_resource');
 		$this->getClientSettings($credentials,'tokeninfo_resource');
 		$this->getClientSettings($credentials,'openidProviderURL');
 		$this->getClientSettings($credentials,'authorize_url');
    }
    function setServices() {
    	if(SSO) 
    		if(!is_bool(SSO)) {
    			$this->decodeSSO(json_decode(SSO, true));
    			return;
	    	}
    	if(!BLUEMIX) 
    		throw new Exception('Requires SSO defined in preferences or IBM Bluemix');
    	$services = getenv('VCAP_SERVICES');
 		if(!$services)
 			throw new Exception('Requires to be bound with SSO service or SSO defined in preferences');
 		$servicesArray=json_decode($services, true);
 		if(!$servicesArray)
 			throw new Exception('Decode VCAP services failed');
 		foreach($servicesArray as $serviceName => $serviceType) {
 			$parts=explode('-',$serviceName);
 			$vcapService=$parts[0];
 			if($vcapService=='SSO' || $vcapService=='single.sign.on')  
 				$SSOservices=$serviceType;
 		}
 		if(!isset($SSOservices))
 			throw new Exception('Requires SSO application');
 		foreach($SSOservices as $index => $service) {
 			$credentials=$service["credentials"];
 		}
 		if(!isset($credentials))
 			throw new Exception('SSO application credentials not found');
 		$this->decodeSSO($credentials);
    }
}
