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
/* This is a prototype for a table manipulation module all modules should be based off of this framework.
 * Only function (actions) you wish to have enabled should be present in you modules.
 *
 * the module name is a 2 part name where the fist part represents a class and the seconded part a description. 
 * Each part should match the pattern /[a-zA-Z][a-zA-Z0-9]* / (No underscore, no spaces, no symbols)
 */
TABLE_MANIPULATION_MODULES.set("ModuleClass_ModuleName", {
	
	
	//When present this object should return a menu JSON object to be added to the top right table menu bar
	panelLeftMenuObject: function(tableObject, menuArray) {},
	

	//When present this should add an action to the table column title. return should be HTML encased in cell tags '<TD>' + Your content + '</TD>'
	columnHeaderInterface: function(displayObject, tableObject) {},
	
	
	cellMouse2DownMenuObject: function(tableObject, menuArray, rowNumber, columnType, columnName) {},
	
	cellMouse1ClickAction: function(tableObject, rowNumber, columnType, columnName) {},
	
	cellMouse1DoubleClickAction: function(tableObject, rowNumber, columnType, columnName) {},
	
	cellMouseDownAction: function(tableObject, rowNumber, columnType, columnName) {},
	
	
	
	columnMouse2DownMenuObject: function(tableObject, menuArray, columnType, columnName) {},
	
	columnMouse1ClickAction: function(tableObject, columnType, columnName) {},
	
	columnMouse1DoubleClickAction: function(tableObject, columnType, columnName) {},
	
	columnMouseDownAction:function(tableObject, columnType, columnName) {},
	
	
	
	
	rowMouse2DownMenuObject: function(tableObject, menuArray, rowNumber) {},
	
	rowMouse1ClickAction: function(tableObject, rowNumber) {},
	
	rowMouse1DoubleClickAction: function(tableObject, rowNumber) {},
	
	rowMouseDownAction: function(tableObject, rowNumber) {},
	
	
	
	
	columnHeadMouse2DownMenuObject: function(tableObject, menuArray, columnType, columnName) {},
	
	columnHeadMouse1ClickAction: function(tableObject, columnType, columnName) {},
	
	columnHeadMouse1DoubleClickAction: function(tableObject, columnType, columnName) {},
	
	columnHeadMouseDownAction:function(tableObject, columnType, columnName) {},
	
	
	
	
	rowHeadMouse2DownMenuObject: function(tableObject, menuArray, rowNumber) {},
	
	rowHeadMouse1ClickAction: function(tableObject, rowNumber) {},
	
	rowHeadMouse1DoubleClickAction: function(tableObject, rowNumber) {},
	
	rowHeadMouseDownAction: function(tableObject, rowNumber) {}
});