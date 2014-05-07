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

include_once(PHP_INCLUDE_BASE_DIRECTORY . "JSONEncodeMenu.php");

$menuRoot = MAIN_MENU_ROOT_DIRECTORY;
$rootNode = getParameter('rootCallBack');
$baseMenuFolder = getParameter('baseMenuFolder');
$filterList = getParameter('filterList');
$substiturtionList = getParameter('subList');
                
JSONEncodeMenu::$defaultStage = getParameter('defaultStage', JSONEncodeMenu::$defaultStage);
JSONEncodeMenu::$defaultTarget = getParameter('defaultPanel', JSONEncodeMenu::$defaultTarget);
JSONEncodeMenu::$defaultWindow = getParameter('defaultWindow', JSONEncodeMenu::$defaultWindow);
$branchSQLXML = "";
if($rootNode != null) {
	if(substr($rootNode,0,1)=='{') {
		$menu=json_decode($rootNode,true);
		$rootDirectory=$menu["rootDirectory"];
		$branchDirectory = $menu["branchDirectory"];
		$branchSQLXML = str_replace('@@@','"',$menu["branchSQLXML"]);  /* fix to over come double quote issue */
		$branchSQLPredicate = $menu["branchSQLPredicate"];
		$branchXML = $menu["branchXML"];
		$branchXSL = $menu["branchXSL"];
		$onErrorMenu = $menu["onErrorMenu"];
		$dropParent = $menu["dropParent"];
		$filter = $menu["filter"];
		$menulocation=$menu["menulocation"];
		$DBMS=$menu["DBMS"];
	} else {
		$node = new XMLNode();
		if($node->loadXML(file_get_contents($rootNode)) !== false) {
			$rootDirectory = trim($node->getAttribute("rootDirectory"));
			$branchDirectory = trim($node->getAttribute("branchDirectory"));
			$branchSQLXML = trim($node->getAttribute("branchSQLXML"));
			$branchSQLPredicate = trim($node->getAttribute("branchSQLPredicate"));
			$branchXML = trim($node->getAttribute("branchXML"));
			$branchXSL = trim($node->getAttribute("branchXSL"));
			$onErrorMenu = trim($node->getAttribute("onErrorMenu"));
			$dropParent = trim($node->getAttribute("dropParent"));
			$filter = trim($node->getAttribute("filter"));
			$menulocation=substr(dirname($rootNode),strlen($menuRoot));
			$DBMS = trim($node->getAttribute("DBMS"));
		}
	}

	if($rootDirectory != "") {
		$menuRoot = $rootDirectory;
	} elseif($branchDirectory != "") {
		$filepos = strrpos( $rootNode, "/");
		$menuRoot = substr($rootNode, 0, $filepos) . "/" . $branchDirectory;
	}
	
	if($filter != "") {
		if($filterList = null) 
			$filterList = array();
		$filterList[] = $filter;
	}
} else if($baseMenuFolder != null) {
	$menuRoot = $baseMenuFolder;
} 

if(isset($branchXML) && $branchXML !== "") {
	echo "(" . json_encode(JSONEncodeMenu::encodeMenuXML($branchXML, $menuRoot, $filterList,$branchXSL,$dropParent,$onErrorMenu,$menulocation)) . ")";
} else if(isset($branchSQLXML) && $branchSQLXML !== "") {
	if(isset($DBMS))
		if($DBMS!==null)
			if(!connectionManager::isDBMS($DBMS))
				return;
	connectionManager::getConnection(getParameter('USE_CONNECTION'));
	echo "(" . json_encode(JSONEncodeMenu::encodeMenuSQLXML($branchSQLXML, $menuRoot, $filterList,$branchXSL,$branchSQLPredicate,$dropParent,$onErrorMenu,$menulocation)) . ")";
} else {
	echo "(" . json_encode(JSONEncodeMenu::encodeMenuFolder(".", $menuRoot, $filterList)) . ")";
}
?>