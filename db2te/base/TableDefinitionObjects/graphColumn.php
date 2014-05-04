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

ArrayEncodeTableDefinition::$GENERIC_XML_OBJECTS['c_graph'] = 'TableDefinitionObject_GRAPH_COLUMN';
ArrayEncodeTableDefinition::$GENERIC_XML_OBJECTS['axisdataset'] = 'TableDefinitionObject_GRAPH_COLUMN';

function TableDefinitionObject_GRAPH_COLUMN(&$mainNode, &$returnObject, &$displayElements, &$displayColumns, $isMainTableObject=true)
{
	if($isMainTableObject) return;
	if(!isset($returnObject['axisdataset'])) $returnObject['axisdataset'] = array();

	$AxisDataSet = array();
	$AxisDataSet['name'] = strtoupper($mainNode->getAttribute("name", "default"));
	$AxisDataSet['size'] = 2;
	$AxisDataSet['linesize'] = 1;

	if($mainNode->hasChildNodes()) {			
		foreach($mainNode->childNodes as $childNode) {
			switch (strtolower($childNode->nodeName)) {
				case 'g_description':
				case 'label':								
					$AxisDataSet['label'] = trim($childNode->textContent == "" ? "No label" : $childNode->textContent);
					break;								
				case 'g_x_categories':
				case 'x_axis_labels':
					$AxisDataSet['axisType'] = "x_axis_labels";
					break;
				case 'g_y_categories':
				case 'y_axis_labels':
					$AxisDataSet['axisType'] = "y_axis_labels";
					break;
				case 'category_field':  //To be used with pie charts
					$AxisDataSet['axisType'] = "category_field";
					break;
				case 'data_field':			//To be used with pie charts
					$AxisDataSet['axisType'] = "data_field";
					break;								
				case 'style':
				case 'datastyle':
					$AxisDataSet['dataStyle'] = array();
					foreach($childNode->childNodes as $styleNode) {
						switch(strtolower($styleNode->nodeName)) {
							case 'g_type':
							case 'graph_type':
								$AxisDataSet['dataStyle']['type'] = trim($styleNode->textContent == "" ? "" : $styleNode->textContent);
								break;
							case 'color':
								$AxisDataSet['dataStyle']['color'] = trim($styleNode->textContent == "" ? "" : $styleNode->textContent);
								break;
							case 'size':
								$AxisDataSet['dataStyle']['size'] = trim($styleNode->textContent == "" ? 2 : $styleNode->textContent);
								break;
							case 'linesize':
								$AxisDataSet['dataStyle']['lineSize'] = trim($styleNode->textContent == "" ? 1 : $styleNode->textContent);
								break;
						}
					}
					break;
				default:
					if(!isset($AxisDataSet['graphType'])) 
						$AxisDataSet['graphType'] = "graph_data";
				break;					
			} //switch
		} //foreach
	}
	$returnObject['axisdataset'][$AxisDataSet['name']] = $AxisDataSet;
}
