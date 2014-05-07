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
function checkPasswordForDB2Connect(object) {
	object.setStyle({background: ( object.value == "" ? "#FF7777" : "#77FF77" )});
	object.focus();
}

CORE_CLIENT_ACTIONS.set("DBConnectionNewConnectionForm",Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		$super(callParameters.uniqueID + "_ConnectionForm", "DBConnectionNewConnectionForm");
			
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		this.callParameters = callParameters;
		
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		
		if(parentPanel != null)
			parentPanel.registerNestedObject(this.elementUniqueID, this);
		this.connectionLocation=-1;
		this.defaultDriver=(this.callParameters.TE_DATABASE_LOGIN_DATABASE_DRIVER==null?null:this.callParameters.TE_DATABASE_LOGIN_DATABASE_DRIVER)
		this.callback='getPanel(\'' + this.parentStageID + '\', \'' + this.parentWindowID + '\', \'' + this.parentPanelID + '\').nestedObject.get(\'' + this.elementUniqueID + '\')';
		this.draw();
	},
	setConnectionLocation: function(connectionLocation) {
		if(connectionLocation==null) return;
		if(connectionLocation<0) return;
		this.connection = CONNECTION_MANAGER_CONNECTION_LIST[connectionLocation];
		if(this.connection==null) return;
		this.connectionLocation=connectionLocation;
		this.defaultDriver = this.connection['databaseDriver'];
		this.draw();
	},
	setDriver: function(defaultDriver) {
		this.defaultDriver = defaultDriver;
		this.draw();
	},
	draw: function() {
		var menu = [];
		var thisObject = this;
		var output = '<div class="groupTableTitle">Connect to a database </div>'
				+ '<span class="groupTableContent">' 
				+ '<table width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td style="vertical-align: bottom;">'
				+		'<table width=100% cellpadding="3px" style="position:static;padding-top:5px;">'
				+ 		'<tbody>'
				+ 			'<tr><td align="left"><b>Previous connections</b></td><td >'
				+ 				'<select type="text" style="width:30em;" onchange="'+this.callback+'.setConnectionLocation(this.value);">'
				+ 					(this.connectionLocation<0?'<option selected="selected" value="-1" ></option>':'');
		var CONNECTION_MANAGER_CONNECTION_LIST_Length = CONNECTION_MANAGER_CONNECTION_LIST.length;
		for(var i = 0; i < CONNECTION_MANAGER_CONNECTION_LIST_Length; i++)
			output +=	 			'<option '+ (i==this.connectionLocation?' selected="selected"':'') +'value="' + i + '" >' + CONNECTION_MANAGER_CONNECTION_LIST[i]['description'].escapeHTML() + '</option>';
		output += 				'</select></td></tr>'
				+			'<tr><td align="left"><b>Driver</b></td><td >';
				 
		/* This global object is dynamically loaded with supported drivers based on presence of connection files.*/
		var selectedDriver=null;
		if( GLOBAL_TE_SUPPORTED_DRIVERS == undefined )
			output += 'failed to load drivers';
		else {
			output += '<select id="'+ this.elementUniqueID +'_TE_DATABASE_LOGIN_DATABASE_DRIVER" type="text" style="width:30em;" name="TE_DATABASE_LOGIN_DATABASE_DRIVER" onchange="'+this.callback+'.setDriver(this.value);">';                       
			
			GLOBAL_TE_SUPPORTED_DRIVERS.each(function(pair) {
				if(thisObject.defaultDriver==null)
					if(pair.value.default) thisObject.defaultDriver=pair.key;
				output += 				'<option value="' + pair.key  + '" '+(thisObject.defaultDriver==pair.key?'selected=""selected"':'')+'>' + pair.value.name  + '</option>';
			});
			output +='</select>';
		}
		
		output += 				'</td></tr>';

		var selectedDriverDetails=GLOBAL_TE_SUPPORTED_DRIVERS.get(thisObject.defaultDriver);
		if(selectedDriverDetails==null) {
			GLOBAL_TE_SUPPORTED_DRIVERS.each(function(pair) {
				if(thisObject.defaultDriver==null) 
					thisObject.defaultDriver=pair.key;
			});
			selectedDriverDetails=GLOBAL_TE_SUPPORTED_DRIVERS.get(thisObject.defaultDriver);
		}

		if(selectedDriverDetails!=null)
			for(column in selectedDriverDetails.attributes) {
				var attributes=selectedDriverDetails.attributes[column];
				if(this.connection == null)
					var value= (this.callParameters[attributes.name]==null? (attributes.value==null?null:attributes.value)  : this.callParameters[attributes.name] ) 
				else
					var value= this.connection[column];
				output +=		'<tr><td align="left"><b>'+ attributes.title+'</b></td><td style="text-align:left;" ><input type="'+ attributes.type+'" id="' + this.elementUniqueID + '_' + attributes.name + '" name="'+ attributes.name+'" style="'+ attributes.style+'" '
									+ (value==null?'':'value="'+value+'" ')
									+ (attributes.onkeyup==null?'':'onkeyup="'+attributes.onkeyup+'" ')
									+ '/></td></tr>';
			}
		
		output +=		'</tbody></table>'
					+	'</td></tr>'
					+ '<tr><td align="left"'+(this.callParameters.ERROR_MSG == null?'':' style="background:#FF7777;" ')+' id="' + this.elementUniqueID + '_ERROR_MSG" name="ERROR_MSG">'+(this.callParameters.ERROR_MSG == null?'':this.callParameters.ERROR_MSG)+'</td></tr>'
					+ '</tbody></table></span>';
		
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		if(parentPanel != null)
			parentPanel.setContent(output, 'Connection Form', "");
	}
}));