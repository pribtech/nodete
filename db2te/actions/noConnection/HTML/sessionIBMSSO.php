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
include_once(PHP_INCLUDE_BASE_DIRECTORY . "ObjectIBMSSO.php");
try{
	$ibmsso=getIBMSSO();
	$ibmsso->setCode();
	echo "<div id='title'>IBM SSO Check successfull, now get details</div>";
	$bearer=$ibmsso->getBearer();
	echo <<<ENDSCRIPT
<script type="text/javascript">
var ibmssoBear = $bearer;
alert("test "+$bearer);

loadNewPageLayout(
		{target			: 'signon'
		,windowStage	: "DefaultStage"
		,raiseToTop		: "y"
		,title			: 'IBM SSO Success - Get Details'
		,content	 :
			{type				: "panel"
			,name				: "main"
			,PrimaryContainer	: true
			,ContentType		: "LINK"
			,data:
				{type:"ACTION"
				,data:
					{parameters:
						{action: "displayJSON"
						,\$source: ibmssoBear
						}
					}
				}
			}
		});					
</script>
ENDSCRIPT;
	
} catch (Exception $e){
	echo "<div id='title'>IBM SSO Check -".$e->getmessage()."</div>";
	error_log($e->getmessage()."");
}
?>