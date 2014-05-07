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
if( getenv('VCAP_APPLICATION')) {
	setDefine("CLOUD", true);
	setDefine("VCAP_APPLICATION", json_decode(getenv('VCAP_APPLICATION'), true));
	setDefine("VCAP_SERVICES", getenv('VCAP_SERVICES'));
	if( getenv('VCAP_APP_PORT'))
		setDefine("VCAP_APP_PORT", getenv('VCAP_APP_PORT'));
} else 
	setDefine("CLOUD", false);
