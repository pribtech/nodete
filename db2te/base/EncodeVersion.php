<?php
/*******************************************************************************
 *  Author: Peter Prib
 * 	Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2013 All rights reserved.
 *  Copyright IBM Corp. 2007 All rights reserved.
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

function EncodeVersion(&$node,&$returnObject) {
		$returnObject["DBMS"] = $node->getAttribute("DBMS", null);
		$returnObject["minVersion"] = floatval(trim($node->getAttribute("minVersion", 0)));
		$returnObject["minFixPack"] = intval(trim($node->getAttribute("minFixPack", 0)));
		$returnObject["maxVersion"] = floatval(trim($node->getAttribute("maxVersion", 0)));
		$returnObject["feature"] = trim($node->getAttribute("feature", ""));
		$returnObject["noFeature"] = trim($node->getAttribute("noFeature", ""));
		$returnObject["context"] = strtolower($node->getAttribute("context", null));
		$returnObject["notContext"] = strtolower($node->getAttribute("notContext", null));
}