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

if( !isset($GLOBALS["mqLoader"]) || $GLOBALS["mqLoader"] == null || !$GLOBALS["mqLoader"]) 
	if(file_exists(MQ_JARS)) {
		$GLOBALS["mqLoader"] = new JavaClassLoader(MQ_JARS,'mq.jar');
		$GLOBALS["mqLoader"]->getClass('mq.MqWrapper');
		
/**
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQChannelDefinition');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQChannelExit');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQConnectionSecurityParameters');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQDistributionList');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQDistributionListItem');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQEnvironment');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQExitChain');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQExternalReceiveExit');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQExternalSecurityExit');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQExternalSendExit');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQExternalUserExit');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQGetMessageOptions');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQJavaLevel');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQManagedObject');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQMD');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQMessage');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQPoolToken');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQProcess');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQPutMessageOptions');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQQueue');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQQueueManager');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQReceiveExitChain');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQSendExitChain');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQSimpleConnectionManager');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQC');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQReceiveExit');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQSecurityExit');
		$GLOBALS["mqLoader"]->getClass('com.ibm.mq.MQSendExit');
*/
	}
?>