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

var clusterOverview = $H();


CORE_CLIENT_ACTIONS.set("memberOverview", Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		
		$super(callParameters.uniqueID + "_memberOverview", "memberOverview");

		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		this.parentPageID = callParameters.uniqueID;
		
		this.loadInProgress = false;


		this.pageCallParameters = callParameters;

		clusterOverview.set(this.elementUniqueID, this);

		this.firstLoad = true;
		
		var parentPanel = getWindow(this.parentStageID, this.parentWindowID).WindowContainers.get(this.parentPanelID);
		parentPanel.registerNestedObject(this.elementUniqueID, this);
		
		parentPanel.refreshType = "callback";
		parentPanel.refreshCallback = 'clusterOverview.get("' + this.elementUniqueID + '").retrieveData()';
		
		this.DB2_HOST_DATA = null;
		this.DB2_INSTANCE_DATA = null;
		
		this.DisplayedHosts 	= [];
		this.DisplayedINSTANCES = [];
		this.DisplayedGuestINSTANCES = [];
		
		this.draw();
	},
	
	retrieveData: function() {
		
		if(this.loadInProgress) return;
		this.loadInProgress = true;
		
		var thisObject = this;
		
		var sqlCount = 0;
		
		var POSTDATA = new Object();
		POSTDATA.action 				= "pureScale/db2instance";
		POSTDATA.returntype 			= 'JSON';
		POSTDATA.USE_CONNECTION = ACTIVE_DATABASE_CONNECTION;
		


		new Ajax.Request(ACTION_PROCESSOR, {
					'parameters': POSTDATA,
					'method': 'post',
					'onCreate': function() {
						if(thisObject.firstLoad)
							thisObject.setError("<table id='" + this.elementUniqueID + "_Object_To_Fit_To_Panel' style='width:100%;height:100%;position:static;'  cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center' valign='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr><tr><td align='center'><h2>Loading Data</h2></td></tr></table>");
					},
					'onComplete' : function() {
						thisObject.firstLoad = false;
						thisObject.loadInProgress = false;
					},
					'onSuccess': function(transport) {
						var result = transport.responseJSON;
						if(result == null)
						{
							thisObject.setError("An invalid JavaScript object was returned");
							return;
						}
						if(result.flagGeneralError == true && result.connectionError == true)
							initiateConnectionRefresh();
						if(result.flagGeneralError == true ||  isReturnCodeNotOK(result)) {
							thisObject.setError(getReturnErrorMessage(result));
							return;
						}
						
						if(result != null) {
							thisObject.DB2_HOST_DATA	= result.returnValue.host;
							thisObject.DB2_INSTANCE_DATA	= result.returnValue.member;

							thisObject.renderData();
						}
					},
					'onException': function(transport) {
						alert("Exception while loading table data");
					},
					'onFailure': function(transport) {
						alert("Error loading table data");
					}
			});
	},
	
	renderData: function() {
		
		//these two lists store the Hosts and Instances that were updated all avalible host and instances should be updated if not they should be removed from the display
		var updatedHostList = [];
		var updatedHostListStore = [];
		
		var updatedInstancesList = [];
		var updatedInstancesListStore = [];
		
		var updatedGuestList = [];
		var updatedGuestListStore = [];
		
		this.clearError();
		
		var length = 0;
		
		var i = 0;
		
		var rowData = null;
		
		var output;

		var serverUseList = {};

		length = this.DB2_INSTANCE_DATA.data.length;
			
		for(i=0; i<length; i++)
		{
			//Return data column positions
			//0 - ID
			//1 - HOME_HOST
			//2 - CURRENT_HOST
			//3 - TYPE
			//4 - STATE
			//5 - ALERT
			//6 - DB_PARTITION_NUM
			//7 - LOGICAL_PORT
			//8 - NETNAME

			rowData = this.DB2_INSTANCE_DATA.data[i];

			if(rowData[3] == "CA" || rowData[3] == "CF")
			{
				if(serverUseList[rowData[1]] == null) serverUseList[rowData[1]] = false;
				if(serverUseList[rowData[2]] == null) serverUseList[rowData[2]] = false;
			}
			else
			{
				serverUseList[rowData[1]] = true;
				serverUseList[rowData[2]] = true;
			}
		}
		
		
		//Host update
		length = parseInt(this.DB2_HOST_DATA.rowsReturned);
		
		var container = null;
		
		var datalen = 0;
		
		for(i=0; i<length; i++)
		{
			//Return data column positions
			//0 - HOSTNAME
			//1 - STATE
			//2 - INSTANCE_STOPPED
			//3 - ALERT

			
			
			rowData = this.DB2_HOST_DATA.data[i];
			if(rowData[0].indexOf('.') != -1)
				rowData[0] = rowData[0].substr(0, rowData[0].indexOf('.'));
			
			if(!serverUseList[rowData[0]]) continue;

			updatedHostList[rowData[0]] = true;
			updatedHostListStore.push(rowData[0]);

			container = $(this.elementUniqueID + "_HOST_" + rowData[0]);
			
			if(container == null)
			{
				output  = '<table id="' + this.elementUniqueID + '_HOST_' + rowData[0] + '" cellspacing="0" cellpadding="0" style="border:1px solid #b0b4cf;margin: 3px; float: left; width: 150px; text-align: center;">'
				output += '	<tbody id="' + this.elementUniqueID + '_HOST_GROUP_HOLDER_' + rowData[0] + '">';
				output += '		<tr>';
				output += '			<td>';
				output += '				<table id="' + this.elementUniqueID + '_HOST_TITLEBAR_' + rowData[0] + '" oncontextmenu="clusterOverview.get(\'' + this.elementUniqueID + '\').openServerContextMenu(event, \'' + rowData[0] + '\')" cellspacing="0" cellpadding="0" style="background-color: ' + (rowData[1] == "ACTIVE" ? 'lime' : '#ddd' ) + '; width: 100%;">';
				output += '					<tbody>';
				output += '						<tr>';
				output += '							<td id="' + this.elementUniqueID + '_HOST_REPAIR_' + rowData[0] + '" style="padding-left: 5px; width: 10px;">';
					if(rowData[2] == 'YES')
						output += '<img width="10" height="10" src="./images/clusterIndicators/TE_maintenance.png"/>';
				output += '							</td>';
				output += '							<td id="' + this.elementUniqueID + '_HOST_ALERT_' + rowData[0] + '" alight="right" style="width: 10px; padding-left: 1px; padding-right: 5px;" center="">';
					if(rowData[3] == 'YES')
						output += '<img src="./images/clusterIndicators/TE_alerts.png"/>';
				output += '							</td>';
				output += '							<td id="' + this.elementUniqueID + '_HOST_TITLE_' + rowData[0] + '" style="padding: 3px 10px 3px 5px; text-align: center;">';
				output += "<b>" + rowData[0] + (rowData[1] == "INACTIVE" ? "&nbsp;-&nbsp;INACTIVE" : "") + "</b>";
				output += '							</td>';
				
				output += '							<td id="' + this.elementUniqueID + '_HOST_TITLE_' + rowData[0] + '" style="width: 20px; padding-left: 1px; padding-right: 5px;">';
				output += '							</td>';
				
				output += '						</tr>';
				output += '					</tbody>';
				output += '				</table>';
				output += '			</td>';
				output += '		</tr>';
				output += '		<tr id="' + this.elementUniqueID + '_HOST_RESOURCES_' + rowData[0] + '">';
				output += '			<td style="">';
				output += '				<table cellspacing="0" cellpadding="0" style="float: left; width: 100%; text-align: center;">';
				output += '					<tbody><tr>';
				output += '					<td id="' + this.elementUniqueID + '_HOST_RESOURCES_CONTAINER_' + rowData[0] + '" align="center">';
				output += '					</td></tr></tbody>';
				output += '				</table>';
				output += '			</td>';
				output += '		</tr>';
				output += '	</tbody>';
				output += '</table>';
				$(this.elementUniqueID + '_mainDisplayArea').insert(output);
			}
			else
			{
				var value = rowData[1] == "ACTIVE" ? 'lime' : '#ddd';
				$(this.elementUniqueID + '_HOST_TITLEBAR_' + rowData[0]).setStyle({'background-color' : value});
				$(this.elementUniqueID + '_HOST_REPAIR_' + rowData[0]).update(rowData[2] == 'YES' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_maintenance.png"/>' : "");
				$(this.elementUniqueID + '_HOST_ALERT_' + rowData[0]).update(rowData[3] == 'YES' ? '<img src="./images/clusterIndicators/TE_alerts.png"/>' : "");
				$(this.elementUniqueID + '_HOST_TITLE_' + rowData[0]).update("<b>" + rowData[0] + (rowData[1] == "INACTIVE" ? "&nbsp;-&nbsp;INACTIVE" : "") + "</b>");
			}
			
		}
		
		length = this.DB2_INSTANCE_DATA.data.length;
			
		for(i=0; i<length; i++)
		{
			//Return data column positions
			//0 - ID
			//1 - HOME_HOST
			//2 - CURRENT_HOST
			//3 - TYPE
			//4 - STATE
			//5 - ALERT
			//6 - DB_PARTITION_NUM
			//7 - LOGICAL_PORT
			//8 - NETNAME

			rowData = this.DB2_INSTANCE_DATA.data[i];
			
			if(rowData[3] == "CA" || rowData[3] == "CF") continue;

			datalen = rowData[1].length < rowData[2].length ? rowData[1].length : rowData[2].length;
			
			if(rowData[1].indexOf('.') != -1)
				rowData[1] = rowData[1].substr(0, rowData[1].indexOf('.'));
			if(rowData[2].indexOf('.') != -1)
				rowData[2] = rowData[2].substr(0, rowData[2].indexOf('.'));
			
			updatedInstancesList[this.elementUniqueID + "_INSTANCE_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3]] = true;
			updatedInstancesListStore.push(this.elementUniqueID + "_INSTANCE_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3]);
			container = $(this.elementUniqueID + "_INSTANCE_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3]);
			
			if(container == null)
			{
				output  = '<table id="' + this.elementUniqueID + "_INSTANCE_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3] + '" oncontextmenu="clusterOverview.get(\'' + this.elementUniqueID + '\').openInstanceContextMenu(event, ' + rowData[0] + ')" cellspacing="0" cellpadding="0" style="cursor: help; width: 100%; background-color: #fff;" onclick="clusterOverview.get(\'' + this.elementUniqueID + '\').instanceDetails(' + i + ')">';
				output += ' <tbody><tr>';
				output += '  <td id="' + this.elementUniqueID + "_INSTANCE_ALERT_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3] + '" style="padding-left: 1px; padding-right: 1px; width:0px; text-align: center;">';
				output += rowData[5] == "YES" ? '<img src="./images/clusterIndicators/TE_alerts.png"/>' : '';
				output += '  </td>';
				output += '  <td id="' + this.elementUniqueID + "_INSTANCE_RED_LIGHT_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3] + '" style="padding: 1px; width: 0px;" center="">';
				output += rowData[4] == 'STOPPED' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_offline.png"/>' : (rowData[4] == 'ERROR' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_Error.png"/>' : '<img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/>');
				output += '  </td>';
				output += '  <td id="' + this.elementUniqueID + "_INSTANCE_YELLOW_LIGHT_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3] + '" style="padding: 1px; width: 0px;" center="">';
				output += rowData[4] == 'RESTARTING'  ? '<img width="10" height="10" src="./images/clusterIndicators/TE_restarting.png"/>' : (rowData[4] == 'WAITING_FOR_FAILBACK' || rowData[4].substr(0, 7) == 'CATCHUP' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_warning.png"/>' : '<img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/>');
				output += '  </td>';
				output += '  <td id="' + this.elementUniqueID + "_INSTANCE_GREEN_LIGHT_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3] + '" style="padding-left: 1px; padding-right: 1px; width: 0px;" center="">';
				output += rowData[4] == 'STARTED' || rowData[4] == 'PEER' || rowData[4] == 'PRIMARY' || rowData[4] == 'BECOMING_PRIMARY' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_nominal.png"/>' :  '<img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/>';
				output += '  </td>';
				output += '  <td id="' + this.elementUniqueID + "_INSTANCE_PRIMARY_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3] + '" style="padding-left: 1px; padding-right: 1px; width: 0px;" center="">';
				output += rowData[4] == 'PRIMARY' || rowData[4] == 'BECOMING_PRIMARY' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_checkmark.png"/>' : '';
				output += '  </td>';
				output += '  <td id="' + this.elementUniqueID + "_INSTANCE_TITLE_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3] + '" style="padding-left: 10px; padding-right: 5px;">';
				output += (rowData[3] == "CA" || rowData[3] == "CF" ? "<nobr>PowerHA pureScale</nobr>" : "<nobr>DB2 Member " + rowData[0] + "</nobr>");
				output += '</td>';
				output += ' </tr></tbody>';
				output += '</table>';
				
				if(rowData[1] == rowData[2])
				{
					$(this.elementUniqueID + '_HOST_RESOURCES_CONTAINER_' + rowData[1]).insert(output);
				}
				else
				{
					updatedGuestList[rowData[1] + "_" + rowData[2]] = true;
					updatedGuestListStore.push(rowData[1] + "_" + rowData[2]);
					var guestResource = $(this.elementUniqueID + '_HOST_GUEST_RESOURCES_CONTAINER_' + rowData[1] + "_" + rowData[2]);
					
					if(guestResource == null)
					{
						var groupHolder = $(this.elementUniqueID + '_HOST_GROUP_HOLDER_' + rowData[2]);
						var group = '		<tr id="' + this.elementUniqueID + '_HOST_GUEST_RESOURCES_' + rowData[1] + "_" + rowData[2] + '">';
						group += '			<td style="">';
						group += '				<table cellspacing="0" cellpadding="0" style="float: left; width: 100%; text-align: center;">';
						group += '					<tbody><tr>';
						group += '						<td style="background-color: #cacbd9;">';
						group += '							Restart&nbsp;light&nbsp;for&nbsp;' + rowData[1];
						group += '						</td>';
						group += '					</tr>';
						group += '					<tr><td id="' + this.elementUniqueID + '_HOST_GUEST_RESOURCES_CONTAINER_' + rowData[1] + "_" + rowData[2] + '" align="center">';
						group += '					</td></tr></tbody>';
						group += '				</table>';
						group += '			</td>';
						group += '		</tr>';
						groupHolder.insert(group);
						guestResource = $(this.elementUniqueID + '_HOST_GUEST_RESOURCES_CONTAINER_' + rowData[1] + "_" + rowData[2]);
					}
					guestResource.insert(output);
				}
				
			}
			else
			{
				if(rowData[1] != rowData[2])
				{
					updatedGuestList[rowData[1] + "_" + rowData[2]] = true;
					updatedGuestListStore.push(rowData[1] + "_" + rowData[2]);
				}
				$(this.elementUniqueID + "_INSTANCE_ALERT_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3]).update(
					 rowData[5] == "YES" ? '<img src="./images/clusterIndicators/TE_alerts.png"/>' : ''
					 );
				$(this.elementUniqueID + "_INSTANCE_RED_LIGHT_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3]).update(
					 rowData[4] == 'STOPPED' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_offline.png"/>' : (rowData[4] == 'ERROR' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_error.png"/>' : '<img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/>')
					 );
				$(this.elementUniqueID + "_INSTANCE_YELLOW_LIGHT_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3]).update(
					 rowData[4] == 'RESTARTING' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_warning.png"/>' : (rowData[4] == 'WAITING_FOR_FAILBACK'  || rowData[4].substr(0, 7) == 'CATCHUP' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_restarting.png"/>' : '<img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/>')
					 );
				$(this.elementUniqueID + "_INSTANCE_GREEN_LIGHT_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3]).update(
					 rowData[4] == 'STARTED' || rowData[4] == 'PEER' || rowData[4] == 'PRIMARY' || rowData[4].substr(0, 7) == 'CATCHUP' || rowData[4] == 'BECOMING_PRIMARY' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_nominal.png"/>' : '<img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/>'
					 );
				$(this.elementUniqueID + "_INSTANCE_TITLE_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3]).update(
					 (rowData[3] == "CA" || rowData[3] == "CF" ? "<nobr>PowerHA pureScale</nobr>" : "<nobr>DB2 Member " + rowData[0] + "</nobr>")
					 );
				$(this.elementUniqueID + "_INSTANCE_PRIMARY_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3]).update(	 
					rowData[4] == 'PRIMARY' || rowData[4] == 'BECOMING_PRIMARY' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_checkmark.png"/>' : ''
					);
				
			}
		}

		var value = null;
		var oldHosts = this.DisplayedHosts;
		this.DisplayedHosts = [];
		
		while(value = oldHosts.pop())
		{
			if(updatedHostList[value] == null)
			{
				$(this.elementUniqueID + "_HOST_" + value).remove();
			}
		}
		var resourceHolder = null;
		while(value = updatedHostListStore.pop()) 
		{
			if($(this.elementUniqueID + '_HOST_RESOURCES_CONTAINER_' + value).empty())
				$(this.elementUniqueID + '_HOST_RESOURCES_' + value).hide();
			else
				$(this.elementUniqueID + '_HOST_RESOURCES_' + value).show();
				
			this.DisplayedHosts.push(value);
		}

		oldHosts = this.DisplayedGuestINSTANCES;
		this.DisplayedGuestINSTANCES = [];
		while(value = oldHosts.pop())
		{
			if(updatedGuestList[value] == null)
			{
				if($(this.elementUniqueID + '_HOST_GUEST_RESOURCES_' + value) != null)
					$(this.elementUniqueID + '_HOST_GUEST_RESOURCES_' + value).remove();
			}
		}
		while(value = updatedGuestListStore.pop()) this.DisplayedGuestINSTANCES.push(value);
		
		oldHosts = this.DisplayedINSTANCES;
		this.DisplayedINSTANCES = [];
		while(value = oldHosts.pop())
		{
			if(updatedInstancesList[value] == null)
			{
				if($(value) != null)
					$(value).remove();
			}
		}
		while(value = updatedInstancesListStore.pop()) this.DisplayedINSTANCES.push(value);
	},
	
	
	openServerContextMenu: function(event, hostID) {
		var hostData = null;
		var menuArray = [];

		//Return data column positions
		//0 - HOSTNAME
		//1 - STATE
		//2 - INSTANCE_STOPPED
		//3 - ALERT

		var length = parseInt(this.DB2_HOST_DATA.rowsReturned);

		for(i=0; i<length; i++)
		{
			hostData = this.DB2_HOST_DATA.data[i];
			if(hostData[0] == hostID)
				break;
		}
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Run command on this host",
				elementAction : "onClick='clusterOverview.get(\"" + this.elementUniqueID + "\").runCommandOnHost(\"\", \"" + hostData[0] + "\");'"
			});
			if(hostData[1] == "ACTIVE")
			{

				menuArray.push({
					nodeType : "leaf",
					elementValue : "Cause hardware failure",
					elementAction : "onClick='clusterOverview.get(\"" + this.elementUniqueID + "\").runCommandOnHost(\"./hardwareFail\", \"" + hostData[0] + "\", false);'"
				});
				menuArray.push({
					nodeType : "leaf",
					elementValue : "Fix hardware failure",
					elementAction : "onClick='clusterOverview.get(\"" + this.elementUniqueID + "\").runCommandOnHost(\"./hardwareRestore\", \"" + hostData[0] + "\", false);'"
				});

				menuArray.push({
					nodeType : "leaf",
					elementValue : "List all errors",
					elementAction : "onClick='clusterOverview.get(\"" + this.elementUniqueID + "\").runCommand(\"db2cluster -list -alert\");'"
				});
				menuArray.push({
					nodeType : "leaf",
					elementValue : "Clear all errors",
					elementAction : "onClick='clusterOverview.get(\"" + this.elementUniqueID + "\").runCommand(\"db2cluster -clear -alert\");'"
				});

			}

			if(hostData[3] == "YES")
			{
				menuArray.push({
					nodeType : "leaf",
					elementValue : "Clear instance errors",
					elementAction : "onClick='clusterOverview.get(\"" + this.elementUniqueID + "\").runCommand(\"db2cluster -clear -alert -instance " + hostData[0] + "\");'"
				});
			}

		if(menuArray.length != 0)
		{
			openGeneralContextMenu(menuArray);
		}
		
		Event.stop(event);
		return false;
	},

	runCommandOnHost: function(command, hostID, ask) {

		ask = ask == null ? true : ask;
		if(ask)
			command = prompt("Run command on server:", command);

		if(command == null) return;

		var thisObject = this;
		
		this.clearError();
		
		var sqlCount = 0;
		
		var POSTDATA = new Object();
		POSTDATA.action 		= "sshCommandOnSystem";
		POSTDATA.returntype 		= 'JSON';
		POSTDATA.command 		= command;
		POSTDATA.system 		= hostID;
		POSTDATA.USE_CONNECTION 	= ACTIVE_DATABASE_CONNECTION;

		new Ajax.Request(ACTION_PROCESSOR, {
					'parameters': POSTDATA,
					'method': 'post',
					'onCreate': function() {
					},
					'onComplete' : function() {
					},
					'onSuccess': function(transport) {
openModalAlert("<div style='width:400px;'><pre><code>" + transport.responseJSON.returnValue.outputs[0].replace(/(\n\$)|(^\$)/g, "") + "</code></pre></div>");
},
					'onException': function(transport) {},
					'onFailure': function(transport) {}
			});
	},

	runCommand: function(command, ask) {

		ask = ask == null ? true : ask;
		if(ask)
			command = prompt("Run command on server:", command);

		if(command == null) return;	


		var thisObject = this;
		
		this.clearError();
		
		var sqlCount = 0;
		
		var POSTDATA = new Object();
		POSTDATA.action 		= "sshCommand";
		POSTDATA.returntype 		= 'JSON';
		POSTDATA.command 		= command;
		POSTDATA.USE_CONNECTION 	= ACTIVE_DATABASE_CONNECTION;

		new Ajax.Request(ACTION_PROCESSOR, {
					'parameters': POSTDATA,
					'method': 'post',
					'onCreate': function() {
					},
					'onComplete' : function() {
					},
					'onSuccess': function(transport) {
openModalAlert("<div style='width:400px;'><pre><code>" + transport.responseJSON.returnValue.outputs[0].replace(/(\n\$)|(^\$)/g, "") + "</code></pre></div>");
},
					'onException': function(transport) {},
					'onFailure': function(transport) {}
			});
	},

	openInstanceContextMenu: function(event, instanceID) {
		var hostData = null;
		var menuArray = [];
		
		//Return data column positions
		//0 - ID
		//1 - HOME_HOST
		//2 - CURRENT_HOST
		//3 - TYPE
		//4 - STATE
		//5 - ALERT
		//6 - DB_PARTITION_NUM
		//7 - LOGICAL_PORT
		//8 - NETNAME

		var length = parseInt(this.DB2_INSTANCE_DATA.rowsReturned);

		for(i=0; i<length; i++)
		{
			hostData = this.DB2_INSTANCE_DATA.data[i];
			if(hostData[0] == instanceID)
				break;
		}
		
		if(hostData[4] == "STARTED")
		{
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Stop DB2 member",
				elementAction : "onClick='clusterOverview.get(\"" + this.elementUniqueID + "\").runCommand(\"db2stop " + instanceID +"\");'"
			});
		} else if(hostData[4] == "PEER" || hostData[4] == "PRIMARY")
		{
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Stop PowerHA pureScale",
				elementAction : "onClick='clusterOverview.get(\"" + this.elementUniqueID + "\").runCommand(\"db2stop " + instanceID +"\");'"
			});
		} else if(hostData[4] == "STOP" || hostData[4] == "STOPPED")
		{
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Start DB2 member",
				elementAction : "onClick='clusterOverview.get(\"" + this.elementUniqueID + "\").runCommand(\"db2start " + instanceID +"\");'"
			});
		}
		
		if(hostData[3] == "MEMBER")
		{
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Cause recoverable error",
				elementAction : "onClick='clusterOverview.get(\"" + this.elementUniqueID + "\").runCommandOnHost(\"./killm " + hostData[0] + "\", \"" + hostData[2] + "\", false);'"
			});
			if(hostData[5] == "YES")
			{
				menuArray.push({
					nodeType : "leaf",
					elementValue : "Clear member errors",
					elementAction : "onClick='clusterOverview.get(\"" + this.elementUniqueID + "\").runCommand(\"db2cluster -clear -alert -member " + hostData[0] + "\");'"
				});
			}
		}	
		if(hostData[3] == "CF")
		{
			if(hostData[5] == "YES")
			{
				menuArray.push({
					nodeType : "leaf",
					elementValue : "Clear PowerHA pureScale errors",
					elementAction : "onClick='clusterOverview.get(\"" + this.elementUniqueID + "\").runCommand(\"db2cluster -clear -alert -member " + hostData[0] + "\");'"
				});
			}
			if(hostData[4] == "PEER")
			{
				menuArray.push({
					nodeType : "leaf",
					elementValue : "Make primary",
					elementAction : "onClick='clusterOverview.get(\"" + this.elementUniqueID + "\").runCommand(\"db2rocme 1 PRIMARY $USER 900 :$CF_ID :$HOST WRITEPLF\");'"
				});
			}
			else if(hostData[4] == "STOP")
			{
				;
			}
		}	
		if(menuArray.length != 0)
		{
			openGeneralContextMenu(menuArray);
		}
		Event.stop(event);
		return false;
	},
	
	executSSHCommand: function(confirmCommand, confirmationText, commandText, clusterExecutionHost)
	{
		if(this.currentSelectedConnectionRow != null && this.connectionDataTable != null)
		{
			var connectiondescription = this.connectionDataTable[this.currentSelectedConnectionRow]['description'];
			var tempParamObject = $H();
			tempParamObject.set('CONFIRM_COMMAND', (confirmCommand == true ? 'true' : 'false'));
			tempParamObject.set('COMMAND_TEXT', commandText);
			tempParamObject.set('CLUSTER_EXECUTION_HOST', clusterExecutionHost);
			tempParamObject.set('CONFIRMATION_TEXT', confirmationText);
			runClientAction(this.elementUniqueID + "_SSH_COMMAND_EXECUTION", GLOBAL_ACTION_SCRIPT_STORE.get('SSH_COMMAND_EXECUTION'), null, null, null, tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
		}
	},
	
	draw: function() {

			var output = "<div id='" + this.elementUniqueID + "_mainDisplayArea'></div>";
			output += "<div id='" + this.elementUniqueID + "_tableErrorDisplayArea'></div>";
			
			
			var info = "<span><h2>About the Cluster Overview</h2></span>";
			info += "The Cluster Overview represents a high level view of the cluster. The cluster is displayed as a series of hosts (physical machine, logical partition of a physical machine (LPAR) or a virtual machine) with their respective members displayed within. Hosts may also contain guest members started in restart light mode. Members in a restart light mode are unable to be restarted on their home hosts and have been restarted on a guest. This is done to allow the member to recover to a point of consistency as fast as possible so that other active members can access and change the database objects that were locked by the abnormally terminated member. Members in a restart light mode will not accept new connections.";
			info += "<span><h3>Hosts</h3></span>";
			info += "<table>";
			info += "<tr><td<img src='./images/clusterIndicators/TE_maintenance.png'/></td><td>Off line for maintenance</td></tr>";
			info += "<tr><td><img src='./images/clusterIndicators/TE_alerts.png'/></td><td>An alert flag has been set</td></tr>";
			info += "</table>";
			info += "<span><h3>Instances</h3></span>";
			info += "<table>";
			info += "<tr><td><img src='./images/clusterIndicators/TE_alerts.png'/></td><td>Alert flag has been set, click to see more details</td></tr>";
			info += "</table>";

			info += "<table><tr><td colspan='2'><b>Member</b></td>";
			info += "</td><td></td>";
			info += "</tr>"
			
			info += '<tr><td><table><tr><td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>';
			info += '<td><img width="10" height="10" src="./images/clusterIndicators/TE_restarting.png"/></td>';
			info += '<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td></tr></table>';
			info += "</td><td>Restarting</td>";
			info += "</td><td></td></tr>";
						
			info += '<tr><td><table><tr><td><img width="10" height="10" src="./images/clusterIndicators/TE_offline.png"/></td>';
			info += '<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>';
			info += '<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td></tr></table>';
			info += "</td><td>Offline</td>";
			info += "</td><td></td></tr>";
			
			info += '<tr><td><table><tr><td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>';
			info += '<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>';
			info += '<td><img width="10" height="10" src="./images/clusterIndicators/TE_nominal.png"/></td></tr></table>';
			info += "</td><td>Online</td>";
			info += "</td><td></td></tr>";
			
			
			info += '<tr><td><table><tr><td><img width="10" height="10" src="./images/clusterIndicators/TE_restarting.png"/></td>';
			info += '<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>';
			info += '<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td></tr></table>';
			info += "</td><td>Error</td>";
			info += "</td><td></td></tr>";
			
			info += '<tr><td><table><tr><td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>';
			info += '<td><img width="10" height="10" src="./images/clusterIndicators/TE_waiting.png"/></td>';
			info += '<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td></tr></table>';
			info += "</td><td>Waiting&nbsp;to&nbsp;restart&nbsp;on&nbsp;home&nbsp;host</td>";
			info += "</td><td></td></tr>";
			
			info += "</table>";
			
			
			
			info += "</td></tr></table>";
			getWindow(this.parentStageID, this.parentWindowID).WindowContainers.get( this.parentPanelID ).setContent(output, "Cluster members", info, null, null);
			
			this.retrieveData();
			
	},
	
	setError: function(message) {
		var contentArea = $(this.elementUniqueID + "_mainDisplayArea");
		var errorArea = $(this.elementUniqueID + "_tableErrorDisplayArea");
		if(contentArea != null)
			contentArea.hide();
		if(errorArea != null)
		{
			errorArea.show();
			errorArea.update(message);
		}
	},
	
	clearError: function() {
		var contentArea = $(this.elementUniqueID + "_mainDisplayArea");
		var errorArea = $(this.elementUniqueID + "_tableErrorDisplayArea");
		if(contentArea != null)
			contentArea.show();
		if(errorArea != null)
		{
			errorArea.hide();
			errorArea.update("");
		}
	},
	
	instanceDetails: function(i) {
		
		//Return data column positions
		//0 - ID
		//1 - HOME_HOST
		//2 - CURRENT_HOST
		//3 - TYPE
		//4 - STATE
		//5 - ALERT
		//6 - DB_PARTITION_NUM
		//7 - LOGICAL_PORT
		//8 - NETNAME
			
		var rowData = this.DB2_INSTANCE_DATA.data[i];
		var output = "<table><tbody>";
		
		output += "<tr><td>ID</td><td>:</td><td>" + rowData[0] + "</td></tr>";
		output += "<tr><td>Home host</td><td>:</td><td>" + rowData[1] + "</td></tr>";
		output += "<tr><td>Current host</td><td>:</td><td>" + rowData[2] + "</td></tr>";
		output += "<tr><td>Type</td><td>:</td><td>" + rowData[3] + "</td></tr>";
		output += "<tr><td>State</td><td>:</td><td>" + rowData[4] + "</td></tr>";
		output += "<tr><td>Alert</td><td>:</td><td>" + rowData[5] + "</td></tr>";
		output += "<tr><td>Database partition number</td><td>:</td><td>" + rowData[6] + "</td></tr>";
		output += "<tr><td>Logical port</td><td>:</td><td>" + rowData[7] + "</td></tr>";
		output += "<tr><td>Network name</td><td>:</td><td>" + rowData[8] + "</td></tr>";
		
		output += "</tbody></table>"
		
		if(GENERAL_BLANK_POPUP != null)
			GENERAL_BLANK_POPUP.close();
		show_GENERAL_BLANK_POPUP("", output);
		
	}
	
}));
