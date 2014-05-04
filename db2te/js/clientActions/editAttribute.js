/*******************************************************************************
 *  Author: Peter Prib
 * 
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2012 All rights reserved.
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
CORE_CLIENT_ACTIONS.set("editAttribute",Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		$super(callParameters.uniqueID + "_EditTimestamp", "EditTimestamp");
			
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;

		this.callParameters = callParameters;
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		
		this.callingTableID = this.callParameters['#Calling_Table_ID'];
		if(parentPanel != null)
			parentPanel.registerNestedObject(this.elementUniqueID, this);
		this.draw();
	},
	
	draw: function() {
		var output="";
		try{
			switch (this.callParameters.type) {
				case 'xml' :
					var POSTDATA = new Object();
					POSTDATA.primaryContainer = this.PrimaryContainer;
					POSTDATA.uniqueID = this.elementUniqueID;
					POSTDATA.stageID = this.parentStageID;
					POSTDATA.windowID = this.parentWindowID;
					POSTDATA.panelID = this.elementName;
					POSTDATA.USE_CONNECTION = getActiveDatabaseConnection();
					POSTDATA.refreshEnabled = ( this.pageHeaders == null ? "false" : this.pageHeaders.refreshEnabled );
					var action = CORE_CLIENT_ACTIONS.get('chartNodal');
					if(action == null)
						alter('failed to load chartNodal');
					else
						new action(POSTDATA);
					return;
				case 'date' :
					output=this.convertDate(this.callParameters.element.value);
					break;
				case 'time' :
					output=this.convertTime(this.callParameters.element.value);
					break;
				case 'timestamp' :
					output=this.convertTimestamp(this.callParameters.element.value);
					break;
				default:
					output="<h1>Error</h1><h2>Unknown Type<h2>"+this.callParameters.type;
			}
		} catch(e) {
			output="<h1>Error</h1>"+ e;
		}
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		if(parentPanel != null) {
			parentPanel.setContent(output, this.callParameters['title'], "");
			parentPanel.setOKaction(this,this.setValue);
		}
	},
	
	convertDate: function(value) {
		if (value==null ) value="current";
		switch (value.toLowerCase()) {
			case '':
			case 'current':
				var d=new Date();
				year=d.getFullYear();
				month=d.getMonth()+1;
				day=d.getDate();
				break;
			default:
				year=parseInt(value.substr(0,4),10);
				month=parseInt(value.substr(5,2),10);
				day=parseInt(value.substr(8,2),10);
				break;
		}
		return output = '<table><tr>'
					+'<td><select id="'+this.elementUniqueID+'_year">'+columnTypeInputOptionsRange(year,year-4,year+1)+'</select></td><td>-</td>'
					+'<td><select id="'+this.elementUniqueID+'_month">'+columnTypeInputOptionsRange(month,1,12,2,'monthShort')+'</select></td><td>-</td>'
					+'<td><select id="'+this.elementUniqueID+'_day">'+columnTypeInputOptionsRange(day,1,31,2)+'</select></td><td> </td>'
				+'</tr></table>';
	},
	
	convertTime: function(value) {
		if (value==null) value="current";
		switch (value.toLowerCase()) {
			case '':
			case 'current':
				var d=new Date();
				hour=d.getHours();
				minute=d.getMinutes();
				second=d.getSeconds();
				micro='000000';
				break;
			default:
				hour=parseInt(value.substr(0,2),10);
				minute=parseInt(value.substr(3,2),10);
				second=parseInt(value.substr(6,2),10);
				micro=parseInt(value.substr(9,6),10);
				break;
		}
		return output = '<table><tr>'
					+'<td><select id="'+this.elementUniqueID+'_hour">'+columnTypeInputOptionsRange(hour,0,23,2)+'</select></td><td>:</td>'
					+'<td><select id="'+this.elementUniqueID+'_minute">'+columnTypeInputOptionsRange(minute,0,59,2)+'</select></td><td>:</td>'
					+'<td><select id="'+this.elementUniqueID+'_second">'+columnTypeInputOptionsRange(second,0,59,2)+'</select></td><td>.</td>'
					+'<td><input id="'+this.elementUniqueID+'_micro" size="6" maxsize="6" type="text" value="'+micro+'"/></td>'
				+'</tr></table>';
	},
	
	convertTimestamp: function(value) {
		return '<table><tr><td>'+this.convertDate(value)+'</td><td>'+this.convertTime(value.substr(11))+'</td></tr></table>'
	},
	
	getDate: function() {
		var value="";
		var select = $(this.elementUniqueID+'_year');
		value = select.options[select.selectedIndex].value;
		select = $(this.elementUniqueID+'_month');
		value += '-'+select.options[select.selectedIndex].value;
		select = $(this.elementUniqueID+'_day');
		value += '-'+select.options[select.selectedIndex].value;
		return value;
	},

	getTime: function() {
		var value="";
		select = $(this.elementUniqueID+'_hour');
		value += select.options[select.selectedIndex].value;
		select = $(this.elementUniqueID+'_minute');
		value += ':'+select.options[select.selectedIndex].value;
		select = $(this.elementUniqueID+'_second');
		value += ':'+select.options[select.selectedIndex].value;
				+ '.'+$(this.elementUniqueID+'_micro').value;
		return value;
	},
	
	getTimestamp: function() {
		return this.getDate()+" "+this.getTime();
	},

	setValue: function(thisObject) {
		switch (thisObject.callParameters.type) {
			case 'date':
				thisObject.callParameters.element.value=thisObject.getDate();
				break;
			case 'time':
				thisObject.callParameters.element.value=thisObject.getTime();
				break;
			case 'timestamp':
				thisObject.callParameters.element.value=thisObject.getTimestamp();
				break;
		}
		if(thisObject.callParameters.element)
			if(thisObject.callParameters.element.onchange)
				thisObject.callParameters.element.onchange();
	}
	
}));