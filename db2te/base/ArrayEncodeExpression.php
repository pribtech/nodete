<?php
/*******************************************************************************
 *  Author: Peter Prib
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2013 All rights reserved.
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

function ArrayEncodeExpression(&$node) {
	$expression = array();
	$expression['operator'] = strtolower($node->getAttribute("operator"));
	switch ($expression['operator']) {
		case 'column':
		case 'parameter':
			$expression['name'] = $node->getAttribute("name");
			break;
		case 'constant':
			$expression['value'] = $node->getAttribute("value");
			break;
		default:
			$operands=array();
			foreach ($node->childNodes as $childNode)
				switch (strtolower($childNode->nodeName)) {
					case 'expresssion':
					case 'operator':
					case 'operand':
						$operands[]=ArrayEncodeExpression($childNode);
						break;
				}
			$expression['operands']=$operands;
	}
	return $expression;
}

