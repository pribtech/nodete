<?php
/*******************************************************************************
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

ArrayEncodeTableDefinition::$ROOT_XML_OBJECTS['balancecolumn'] = 'TableDefinitionObject_BALANCE_COLUMN';

function TableDefinitionObject_BALANCE_COLUMN(&$childNode, &$returnObject, &$displayElements, &$displayColumns) {
	
	if(!isset($returnObject["components"]['balancecolumn'])) $returnObject["components"]['balancecolumn'] = array();
	
	$componentAvalibility = array();
	$componentAvalibility['value'] = true;
	
	$aBalancecolumn = array();
							
	$aBalancecolumn['name']		= trim(strtoupper($childNode->getAttribute("name")));

	$aBalancecolumn['primaryColumn']		= strtoupper($childNode->getAttribute("primaryColumn"));
	$aBalancecolumn['averageColumn']		= strtoupper($childNode->getAttribute("averageColumn"));
	$aBalancecolumn['upperBoundColumn']		= strtoupper($childNode->getAttribute("upperBoundColumn"));
	$aBalancecolumn['lableColumn']		= strtoupper($childNode->getAttribute("lableColumn"));
	$aBalancecolumn['lableColumnWidth']		= strtoupper($childNode->getAttribute("lableColumnWidth"));
	$aBalancecolumn['minWidth']		= strtoupper($childNode->getAttribute("minWidth", "100"));
	$aBalancecolumn['title']		= $childNode->getAttribute("title");

	$aBalancecolumn['isSearchable'] = false;
	$aBalancecolumn['canDrill'] 	= false;
	$aBalancecolumn['sort_enable']	= false;
	
	$returnObject["components"]["balancecolumn"][$aBalancecolumn['name']] = $aBalancecolumn;

}