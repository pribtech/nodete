/*******************************************************************************
 * Author: Matthew Vandenbussche
 * 
 *Copyright IBM Corp. 2010 All rights reserved.
 *
 *Licensed under the Apache License, Version 2.0 (the "License");
 *you may not use this file except in compliance with the License.
 *You may obtain a copy of the License at
 *
 *	http://www.apache.org/licenses/LICENSE-2.0
 *
 *Unless required by applicable law or agreed to in writing, software
 *distributed under the License is distributed on an "AS IS" BASIS,
 *WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *See the License for the specific language governing permissions and
 *limitations under the License.
 *********************************************************************************/

TABLE_COLUMN_RENDERING_MODULES_DELTA_COLUMN_TYPE_DEF.set("type Name", {
	
	currentDataReturn : "",
	
	dataHistoryRetrieval : "",
	
	DataToArchive : "",
	
	firstArchiveReturn : "",
	
	inlineFunctionProcessor : function(tableObject, rowToRender, columnObject, accessPoint) {
		columnObject.type; // Default type
		columnObject.dataType; // Default data type
		columnObject.columnIndex; // Column to manipulate
		columnObject.columnSecondaryIndex; // second column to act on
		columnObject.name; // column object name
		columnObject.interval; // interval in seconds
	}
});