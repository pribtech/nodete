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


CORE_CLIENT_ACTIONS.set("clusterOverview", Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		
		$super(callParameters.uniqueID + "_clusterOverview", "clusterOverview");

		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		this.parentPageID = callParameters.uniqueID;
		
		this.loadInProgress = false;
		this.pageCallParameters = callParameters;
		clusterOverview.set(this.elementUniqueID, this);
		this.firstLoad = true;
		this.parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		this.parentPanel.registerNestedObject(this.elementUniqueID, this);
		this.parentPanel.refreshType = "callback";
		this.parentPanel.refreshCallback = 'clusterOverview.get("' + this.elementUniqueID + '").retrieveData()';
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
		POSTDATA['SQL[HOST]']			= "SELECT HOSTNAME, STATE, INSTANCE_STOPPED, ALERT FROM SYSIBMADM.DB2_CLUSTER_HOST_STATE ORDER BY HOSTNAME ASC FOR READ ONLY";
		POSTDATA['SQL[INSTANCE]']		= "SELECT ID, HOME_HOST, CURRENT_HOST, TYPE, STATE, ALERT, DB_PARTITION_NUM, LOGICAL_PORT, NETNAME FROM table(sysproc.db2_get_instance_info(null, '', '', '', null)) ORDER BY HOME_HOST ASC FOR READ ONLY";
		POSTDATA.action 				= "executeSQL";
		POSTDATA.returntype 			= 'JSON';
		POSTDATA.displayXML 			= true;
		POSTDATA.displayCLOB			= true;
		POSTDATA.displayXMLinline 		= true;
		POSTDATA.displayCLOBinline 		= true;
		POSTDATA.displayBLOB 			= true;
		POSTDATA.displayDBCLOB 			= true;
		POSTDATA.returnFromRow			= 0;
		POSTDATA.maxRowReturn			= 1000;
		POSTDATA.USE_CONNECTION = ACTIVE_DATABASE_CONNECTION;
		
		new Ajax.Request(ACTION_PROCESSOR, {
			'parameters': POSTDATA,
			'method': 'post',
			'onCreate': function() {
				thisObject.parentPanel.startServerLoadIndicator();
				if(thisObject.firstLoad)
					thisObject.setError("<table id='" + this.elementUniqueID + "_Object_To_Fit_To_Panel' style='width:100%;height:100%;position:static;'  cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center' valign='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr><tr><td align='center'><h2>Loading Data</h2></td></tr></table>");
			},
			'onComplete' : function() {
				thisObject.parentPanel.clearLoadIndicator();
				thisObject.firstLoad = false;
				thisObject.loadInProgress = false;
			},
			'onSuccess': function(transport) {
				thisObject.parentPanel.setClientLoadIndicator();
				var result = transport.responseJSON;
				if(result == null) {
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
					thisObject.DB2_HOST_DATA		= result.returnValue.STMTReturn['HOST'].resultSet[0];
					thisObject.DB2_INSTANCE_DATA	= result.returnValue.STMTReturn['INSTANCE'].resultSet[0];
					thisObject.renderData();
				}
			},
			'onException': function(transport,exception) {
				openModalAlert("Exception while loading table data: "+(exception==null ? transport.statusText : ( typeof(exception)=="object" ? exception.name+" : "+exception.description : exception )));
			},
			'onFailure': function(transport,exception) {
				openModalAlert("Error loading table data: "+(exception==null ? transport.statusText : ( typeof(exception)=="object" ? exception.name+" : "+exception.description : exception )));
			}
		});
	},
	
	renderData: function() {
		if(ACTIVE_CIRCLE_MENU != null) {
			setTimeout(this.callBackText + ".renderData();", 500);
			return;
		}
		
		//these two lists store the Hosts and Instances that were updated all avalible host and instances should be updated if not they should be removed from the display
		var updatedHostList = [];
		var updatedHostListStore = [];
		var updatedInstancesList = [];
		var updatedInstancesListStore = [];
		var updatedGuestList = [];
		var updatedGuestListStore = [];
		
		this.clearError();
		
		var length = parseInt(this.DB2_HOST_DATA.rowsReturned);
		var i = 0;
		var rowData = null;
		var output;
		var container = null;
		var datalen = 0;
		
		for(i=0; i<length; i++) {
			//Return data column positions
			//0 - HOSTNAME
			//1 - STATE
			//2 - INSTANCE_STOPPED
			//3 - ALERT
			
			rowData = this.DB2_HOST_DATA.data[i];
			if(rowData[0].indexOf('.') != -1)
				rowData[0] = rowData[0].substr(0, rowData[0].indexOf('.'));
			updatedHostList[rowData[0]] = true;
			updatedHostListStore.push(rowData[0]);

			container = $(this.elementUniqueID + "_HOST_" + rowData[0]);
			if(container == null) {
				output  = '<table id="' + this.elementUniqueID + '_HOST_' + rowData[0] + '" cellspacing="0" cellpadding="0" style="-webkit-box-shadow: 0 1px 2px rgba(0,0,0,.5);background:-webkit-gradient(linear, left top, left bottom, from(#ff7200), to(#ff8c26));-webkit-border-radius:5px;border:1px solid #b0b4cf;margin: 3px; margin-bottom:10px;float: left; width: 150px; text-align: center;"';
				if(IS_TOUCH_SYSTEM)
					output += ' ontouchstart="' + this.callBackText + '.openMemberSelectMenu(event,\'' + rowData[0] + '\')" '
							+ ' onmousedown="' + this.callBackText + '.openMemberSelectMenu(event,\'' + rowData[0] + '\')" '
							+ ' onmouseup="CIRCLE_MENU_CLOSE(event, true)" ontouchend="CIRCLE_MENU_CLOSE(event, true);" onmousemove="CIRCLE_MENU_MOVE(event)" ontouchmove="CIRCLE_MENU_MOVE(event)" ';
				output += '>'
						+ '	<tbody id="' + this.elementUniqueID + '_HOST_GROUP_HOLDER_' + rowData[0] + '">'
						+		'<tr>'
						+			'<td>'
						+				'<table id="' + this.elementUniqueID + '_HOST_TITLEBAR_' + rowData[0] + '" ' +  (IS_TOUCH_SYSTEM ? "" : 'oncontextmenu="openGeneralContextMenu(' + this.callBackText + '.openServerContextMenu(event, \'' + rowData[0] + '\')); return false;" ' ) + ' cellspacing="0" cellpadding="0" style="';

				if(IS_TOUCH_SYSTEM)
					output += (rowData[1] == "ACTIVE" ? '-webkit-box-shadow: 0 1px 2px rgba(0,0,0,.5);background:-webkit-gradient(linear, left top, left bottom, from(#00ff00), to(#aaFFaa));' : 'background-color: #ddd;' );
				else 
					output += (rowData[1] == "ACTIVE" ? 'background-color:lime;' : 'background-color: #ddd;' );

				output += 'width: 100%;">'
						+ '					<tbody>'
						+ '						<tr>'
						+ '							<td id="' + this.elementUniqueID + '_HOST_REPAIR_' + rowData[0] + '" style="padding-left: 5px; width: 10px;">';
				if(rowData[2] == 'YES')
						output += '<img width="10" height="10" src="./images/clusterIndicators/TE_maintenance.png"/>';
				output += '							</td>'
						+ '							<td id="' + this.elementUniqueID + '_HOST_ALERT_' + rowData[0] + '" alight="right" style="width: 10px; padding-left: 1px; padding-right: 5px;" center="">';
				if(rowData[3] == 'YES')
						output += '<img src="./images/clusterIndicators/TE_alerts.png"/>';
				output += '							</td>'
						+ '							<td id="' + this.elementUniqueID + '_HOST_TITLE_' + rowData[0] + '" style="padding: 3px 10px 3px 5px; text-align: center;">'
						+ "<b>" + rowData[0] + (rowData[1] == "INACTIVE" ? "&nbsp;-&nbsp;INACTIVE" : "") + "</b>"
						+ '							</td>'
						+ '							<td id="' + this.elementUniqueID + '_HOST_TITLE_' + rowData[0] + '" style="width: 20px; padding-left: 1px; padding-right: 5px;">'
						+ '							</td>'
						+ '						</tr>'
						+ '					</tbody>'
						+ '				</table>'
						+ '			</td>'
						+ '		</tr>'
						+ '		<tr id="' + this.elementUniqueID + '_HOST_RESOURCES_' + rowData[0] + '">'
						+ '			<td style="">'
						+ '				<table cellspacing="0" cellpadding="0" style="float: left; width: 100%; text-align: center;">'
						+ '					<tbody><tr>'
						+ '					<td id="' + this.elementUniqueID + '_HOST_RESOURCES_CONTAINER_' + rowData[0] + '" align="center">'
						+ '					</td></tr></tbody>'
						+ '				</table>'
						+ '			</td>'
						+ '		</tr>'
						+ '	</tbody>'
						+ '</table>';
					
				$(this.elementUniqueID + '_mainDisplayArea').insert(output);
			} else {
				if(!IS_TOUCH_SYSTEM) {
					var value = rowData[1] == "ACTIVE" ? 'lime' : '#ddd';
					$(this.elementUniqueID + '_HOST_TITLEBAR_' + rowData[0]).setStyle({'background-color' : value});
				}
				$(this.elementUniqueID + '_HOST_REPAIR_' + rowData[0]).update(rowData[2] == 'YES' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_maintenance.png"/>' : "");
				$(this.elementUniqueID + '_HOST_ALERT_' + rowData[0]).update(rowData[3] == 'YES' ? '<img src="./images/clusterIndicators/TE_alerts.png"/>' : "");
				$(this.elementUniqueID + '_HOST_TITLE_' + rowData[0]).update("<b>" + rowData[0] + (rowData[1] == "INACTIVE" ? "&nbsp;-&nbsp;INACTIVE" : "") + "</b>");
			}
		}
		length = this.DB2_INSTANCE_DATA.data.length;
		for(i=0; i<length; i++) {
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
			for(var j=0;j<rowData.length;j++)
				if (rowData[j]==null) rowData[j]="";
			datalen = rowData[1].length < rowData[2].length ? rowData[1].length : rowData[2].length;
			
			if(rowData[1].indexOf('.') != -1)
				rowData[1] = rowData[1].substr(0, rowData[1].indexOf('.'));
			if(rowData[2].indexOf('.') != -1)
				rowData[2] = rowData[2].substr(0, rowData[2].indexOf('.'));
			
			updatedInstancesList[this.elementUniqueID + "_INSTANCE_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3]] = true;
			updatedInstancesListStore.push(this.elementUniqueID + "_INSTANCE_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3]);
			container = $(this.elementUniqueID + "_INSTANCE_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3]);
			
			if(container == null) {
				output  = '<table id="' + this.elementUniqueID + "_INSTANCE_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3] + '" ' + (IS_TOUCH_SYSTEM ? "" : 'oncontextmenu="openGeneralContextMenu(' + this.callBackText + '.openInstanceContextMenu(event, ' + rowData[0] + ')); return false;"' ) + ' cellspacing="0" cellpadding="0" style="cursor: help; width: 100%; background-color: #fff;" onclick="clusterOverview.get(\'' + this.elementUniqueID + '\').instanceDetails(' + i + ')">'
						+ ' <tbody><tr>'
						+ '  <td id="' + this.elementUniqueID + "_INSTANCE_ALERT_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3] + '" style="padding-left: 1px; padding-right: 1px; width:0px; text-align: center;">'
						+ rowData[5] == "YES" ? '<img src="./images/clusterIndicators/TE_alerts.png"/>' : ''
						+ '  </td>'
						+ '  <td id="' + this.elementUniqueID + "_INSTANCE_RED_LIGHT_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3] + '" style="padding: 1px; width: 0px;" center="">'
						+ rowData[4] == 'STOPPED' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_offline.png"/>' : (rowData[4] == 'ERROR' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_Error.png"/>' : '<img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/>')
						+ '  </td>'
						+ '  <td id="' + this.elementUniqueID + "_INSTANCE_YELLOW_LIGHT_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3] + '" style="padding: 1px; width: 0px;" center="">'
						+ rowData[4] == 'RESTARTING'  ? '<img width="10" height="10" src="./images/clusterIndicators/TE_restarting.png"/>' : (rowData[4] == 'WAITING_FOR_FAILBACK' || rowData[4].substr(0, 7) == 'CATCHUP' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_warning.png"/>' : '<img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/>')
						+ '  </td>'
						+ '  <td id="' + this.elementUniqueID + "_INSTANCE_GREEN_LIGHT_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3] + '" style="padding-left: 1px; padding-right: 1px; width: 0px;" center="">'
						+ rowData[4] == 'STARTED' || rowData[4] == 'PEER' || rowData[4] == 'PRIMARY' || rowData[4] == 'BECOMING_PRIMARY' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_nominal.png"/>' :  '<img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/>'
						+ '  </td>'
						+ '  <td id="' + this.elementUniqueID + "_INSTANCE_PRIMARY_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3] + '" style="padding-left: 1px; padding-right: 1px; width: 0px;" center="">'
						+ rowData[4] == 'PRIMARY' || rowData[4] == 'BECOMING_PRIMARY' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_checkmark.png"/>' : ''
						+ '  </td>'
						+ '  <td id="' + this.elementUniqueID + "_INSTANCE_TITLE_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3] + '" style="padding-left: 10px; padding-right: 5px;">'
						+ (rowData[3] == "CA" || rowData[3] == "CF" ? "<nobr>Cluster caching facility</nobr>" : "<nobr>DB2 member " + rowData[0] + "</nobr>")
						+ '</td>'
						+ ' </tr></tbody>'
						+ '</table>';
				
				if(rowData[1] == rowData[2])
					$(this.elementUniqueID + '_HOST_RESOURCES_CONTAINER_' + rowData[1]).insert(output);
				else {
					updatedGuestList[rowData[1] + "_" + rowData[2]] = true;
					updatedGuestListStore.push(rowData[1] + "_" + rowData[2]);
					var guestResource = $(this.elementUniqueID + '_HOST_GUEST_RESOURCES_CONTAINER_' + rowData[1] + "_" + rowData[2]);
					
					if(guestResource == null) {
						var groupHolder = $(this.elementUniqueID + '_HOST_GROUP_HOLDER_' + rowData[2]);
						if(groupHolder != null) {
							var group = '<tr id="' + this.elementUniqueID + '_HOST_GUEST_RESOURCES_' + rowData[1] + "_" + rowData[2] + '">'
									+ 		'<td style="">';
									+ 			'<table cellspacing="0" cellpadding="0" style="float: left; width: 100%; text-align: center;">'
									+ 			'<tbody><tr>'
									+ 				'<td style="background-color: #cacbd9;">'
									+ 					'Light&nbsp;restart&nbsp;for&nbsp;' + rowData[1]
									+ 				'</td>'
									+ 			'</tr>'
									+ 			'<tr><td id="' + this.elementUniqueID + '_HOST_GUEST_RESOURCES_CONTAINER_' + rowData[1] + "_" + rowData[2] + '" align="center">'
									+ 				'</td></tr></tbody>'
									+ 			'</table>'
									+ 		'</td>'
									+ 	'</tr>';
							groupHolder.insert(group);
							guestResource = $(this.elementUniqueID + '_HOST_GUEST_RESOURCES_CONTAINER_' + rowData[1] + "_" + rowData[2]);
						}
					}
				}
				if(guestResource != null)
					guestResource.insert(output);
			} else {
				if(rowData[1] != rowData[2]) {
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
					 (rowData[3] == "CA" || rowData[3] == "CF" ? "<nobr>Cluster caching facility</nobr>" : "<nobr>DB2 member " + rowData[0] + "</nobr>")
					 );
				$(this.elementUniqueID + "_INSTANCE_PRIMARY_" + rowData[0] + "_" + rowData[1] + "_" + rowData[2] + "_" + rowData[3]).update(	 
					rowData[4] == 'PRIMARY' || rowData[4] == 'BECOMING_PRIMARY' ? '<img width="10" height="10" src="./images/clusterIndicators/TE_checkmark.png"/>' : ''
					);
			}
		}

		var value = null;
		var oldHosts = this.DisplayedHosts;
		this.DisplayedHosts = [];
		
		while(value = oldHosts.pop()) {
			if(updatedHostList[value] == null) 
				$(this.elementUniqueID + "_HOST_" + value).remove();
		}
		var resourceHolder = null;
		while(value = updatedHostListStore.pop()) {
			if($(this.elementUniqueID + '_HOST_RESOURCES_CONTAINER_' + value).empty())
				$(this.elementUniqueID + '_HOST_RESOURCES_' + value).hide();
			else
				$(this.elementUniqueID + '_HOST_RESOURCES_' + value).show();
			this.DisplayedHosts.push(value);
		}

		oldHosts = this.DisplayedGuestINSTANCES;
		this.DisplayedGuestINSTANCES = [];
		while(value = oldHosts.pop()) {
			if(updatedGuestList[value] == null)
				if($(this.elementUniqueID + '_HOST_GUEST_RESOURCES_' + value) != null)
					$(this.elementUniqueID + '_HOST_GUEST_RESOURCES_' + value).remove();
		}
		while(value = updatedGuestListStore.pop()) this.DisplayedGuestINSTANCES.push(value);
		
		oldHosts = this.DisplayedINSTANCES;
		this.DisplayedINSTANCES = [];
		while(value = oldHosts.pop()) {
			if(updatedInstancesList[value] == null)
				if($(value) != null)
					$(value).remove();
		}
		while(value = updatedInstancesListStore.pop()) this.DisplayedINSTANCES.push(value);
	},
	
	openMemberSelectMenu: function(event, hostID) {
		if( event.touches && event.touches.length) { 
			CORE_Current_Mouse_X = event.touches[0].clientX;
			CORE_Current_Mouse_Y = event.touches[0].clientY;
		} else { 
			CORE_Current_Mouse_X = event.clientX;
			CORE_Current_Mouse_Y = event.clientY;
		}
		
		var rowData = null;
		var menuArray = [];
        var memberOnHost = false;
		//Return data column positions
		//0 - HOSTNAME
		//1 - STATE
		//2 - INSTANCE_STOPPED
		//3 - ALERT

		var length = parseInt(this.DB2_HOST_DATA.rowsReturned);
		for(i=0; i<length; i++) {
			rowData = this.DB2_HOST_DATA.data[i];
			if(rowData[0] == hostID)
				break;
		}
		var menuData = this.openServerContextMenu(event, hostID);
		if(menuData != false) {
			menuArray.push({
				nodeType: "branch",
				elementValue : "Host: " + rowData[0],
				elementSubNodes : menuData
			});
		}
		
		length = this.DB2_INSTANCE_DATA.data.length;
		for(var i=0; i<length; i++) {
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
			if(rowData[2] == hostID) {
				menuData = this.openInstanceContextMenu(event, rowData[0]);
				if(menuData != false) {
					menuArray.push({
						nodeType: "branch",
						elementValue : (rowData[3] == "CA" || rowData[3] == "CF" ? "Cluster caching facility" : "DB2 member " + rowData[0]),
						elementSubNodes : menuData
					});
				}
			}
		}
		openGeneralContextMenu(menuArray);
	},
	
	openServerContextMenu: function(event, hostID) {
		var hostData = null;
		var menuArray = [];
        var memberOnHost = false;
        var showQuery = "false";
		//Return data column positions
		//0 - HOSTNAME
		//1 - STATE
		//2 - INSTANCE_STOPPED
		//3 - ALERT

		var length = parseInt(this.DB2_HOST_DATA.rowsReturned);
		for(i=0; i<length; i++) {
			hostData = this.DB2_HOST_DATA.data[i];
			if(hostData[0] == hostID)
				break;
		}
        length = this.DB2_INSTANCE_DATA.data.length;
        for(i=0; i<length; i++) {
            if(this.DB2_INSTANCE_DATA.data[i][1] == hostData[0] & this.DB2_INSTANCE_DATA.data[i][3] != "CF") {
                memberOnHost = true;
                break;
            }
        }
		menuArray.push({
			nodeType : "leaf",
			elementValue : "Run command on this host",
			elementAction : "onClick=\"commandRunner.runRawCommandOnHost(event, '', '" + hostData[0] + "', true);\""
		});

		if(hostData[1] == "ACTIVE") {

/******************************************************
* Use When enabling failure
****************************************************/
		
			if(memberOnHost && HMC_COD_ENABLED) {
				menuArray.push({
            		nodeType : "line"
                });
				menuArray.push({
					nodeType : "leaf",
					elementValue : "Cause hardware failure with COD",
					elementAction : "onClick=\"" + this.callBackText + ".runspecialcommand('" + hostData[0] + "', " + showQuery + ");'"
				});
			}
			menuArray.push({
				nodeType : "line"
			});
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Cause hardware failure",
				elementAction : "onClick=\"commandRunner.runCommandOnHost(event, 'CAUSE_HARDWARE_FAILURE', '" + hostData[0] + "', " + showQuery + ");\""
			});
			if(HMC_COD_ENABLED) {
/**************************************************
* Use when recovering from a COD failure
***********************************************/
				alert("error");
				menuArray.push({
					nodeType : "leaf",
					elementValue : "Fix hardware failure",
                   				elementAction : "onClick=\"" + this.callBackText + ".runspecialcommand('" + hostData[0] + "', true);'"
				});
			} else {
/********************************************
* Other wise use bellow
******************************************************/
				menuArray.push({
                	nodeType : "leaf",
                	elementValue : "Fix hardware failure",
					elementAction : "onClick=\"commandRunner.runCommandOnHost(event, 'FIX_HARDWARE_FAILURE', '" + hostData[0] + "', " + showQuery + ");\""
				});
			}
            menuArray.push({
            	nodeType : "line"
            });
			menuArray.push({
				nodeType : "leaf",
				elementValue : "List all errors",
				elementAction : "onClick=\"commandRunner.runCommand(event, 'DB2CLUSTER_LIST_ALERTS', " + showQuery + ");\""
			});
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Clear all errors",
				elementAction : "onClick=\"commandRunner.runCommand(event, 'DB2CLUSTER_CLEAR_ALERTS', " + showQuery + ");\""
			});

		}
		if(hostData[3] == "YES") {
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Clear instance errors",
				elementAction : "onClick=\"commandRunner.runCommand(event, 'DB2CLUSTER_CLEAR_ALERTS', " + showQuery + ", {HOSTNAME:'" + hostData[0] + "'});\""
			});
		}
		if(menuArray.length != 0)
			return menuArray;
		
		Event.stop(event);
		return false;
	},

	runspecialcommand: function(host, isRestore) {
		var thisObject = this;
		var POSTDATA = new Object();
		POSTDATA.action                 = "sshCommand";
		POSTDATA.mode                   = "EXEC";
		POSTDATA.returntype             = 'JSON';
		POSTDATA.command                = (isRestore
											? "rsh " + host + " -l root ifconfig ib0 inet up; echo \"Restoring infiniband interface\";"
											: "rsh " + host + " -l root ifconfig ib0 inet down;echo \"Bringing infiniband interface down\"; "
											);	
		POSTDATA.USE_CONNECTION         = ACTIVE_DATABASE_CONNECTION;
		POSTDATA.definedConnection      = true;
		POSTDATA.sshHost                = host;
		POSTDATA.sshUser                = "db2sdin1";
		POSTDATA.sshPassword            = "blu3g0ld";
		new Ajax.Request(ACTION_PROCESSOR, {
			'parameters': POSTDATA,
			'method': 'post',
			'onSuccess': function(transport) {
				openModalAlert("<div style='width:500px'><pre><code>" + transport.responseJSON.returnValue.outputs[0] + "</code></pre></div>");
				var POSTDATA = new Object();
				POSTDATA.action                 = "sshCommand";
				POSTDATA.returntype             = 'JSON';
				POSTDATA.command				= ( isRestore ? HMC_COD_RESTOR_COMMAND : HMC_COD_ENABLE_COMMAND ); 
				POSTDATA.USE_CONNECTION         = ACTIVE_DATABASE_CONNECTION;
				POSTDATA.mode                   = "EXEC";
				POSTDATA.definedConnection      = true;
				POSTDATA.sshHost                = HMC_HOST;
				POSTDATA.sshUser                = HMC_USER;
				POSTDATA.sshPassword            = HMC_PASSWORD;
				new Ajax.Request(ACTION_PROCESSOR, {
					'parameters': POSTDATA,
					'method': 'post',
					'onSuccess': function(transport) {
					 			}
				});
			}
		});
    },

	openInstanceContextMenu: function(event, instanceID) {
		var hostData = null;
		var menuArray = [];
		var showQuery = "false";
		
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

		for(i=0; i<length; i++) {
			hostData = this.DB2_INSTANCE_DATA.data[i];
			if(hostData[0] == instanceID)
				break;
		}
		if(hostData[4] == "STARTED") {
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Stop DB2 member",
				elementAction : "onClick=\"commandRunner.runCommand(event, 'DB2_STOP_FORCE_MEMBER', " + showQuery + ", {HOSTID:'" + hostData[0] + "'});\""
			});
		} else if(hostData[4] == "PEER" || hostData[4] == "PRIMARY") {
				menuArray.push({
                                nodeType : "leaf",
                                elementValue : "Fail cluster caching facility",
				elementAction : "onClick=\"commandRunner.runCommandOnHost(event, 'FAIL_CF', '" + hostData[2] + "', " + showQuery + ", {HOSTID:'" + hostData[0] + "'});\""
                        });
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Stop cluster caching facility",
				elementAction : "onClick=\"commandRunner.runCommand(event, 'DB2_STOP_MEMBER', " + showQuery + ", {HOSTID:'" + hostData[0] + "'});\""
			});
		} else if(hostData[4] == "STOP" || hostData[4] == "STOPPED") {
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Start DB2 member",
				elementAction : "onClick=\"commandRunner.runCommand(event, 'DB2_START_MEMBER', " + showQuery + ", {HOSTID:'" + hostData[0] + "'});\""
			});
		}
		
		if(hostData[3] == "MEMBER") {
			menuArray.push({
				nodeType : "leaf",
				elementValue : "Cause recoverable error",
				elementAction : "onClick=\"commandRunner.runCommandOnHost(event, 'FAIL_MEMBER', '" + hostData[2] + "', " + showQuery + ", {HOSTID:'" + hostData[0] + "'});\""
			});
			if(hostData[5] == "YES") {
				menuArray.push({
					nodeType : "leaf",
					elementValue : "Clear member errors",
					elementAction : "onClick=\"commandRunner.runCommand(event, 'DB2CLUSTER_CLEAR_ALERTS_MEMBER', " + showQuery + ", {HOSTID:'" + hostData[0] + "'});\""
				});
			}
		}	
		if(hostData[3] == "CF") {
			if(hostData[5] == "YES") {
				menuArray.push({
					nodeType : "leaf",
					elementValue : "Clear cluster caching facility errors",
					elementAction : "onClick=\"commandRunner.runCommand(event,'DB2CLUSTER_CLEAR_ALERTS_MEMBER', " + showQuery + ", {HOSTID:'" + hostData[0] + "'});\""
				});
			}
			if(hostData[4] == "PEER") {
				menuArray.push({
					nodeType : "leaf",
					elementValue : "Make primary",
					elementAction : "onClick=\"commandRunner.runCommand(event, 'DB2_CF_MAKE_PRIMARY', " + showQuery + ");\""
				});
			}
		}	
		if(menuArray.length != 0)
			return menuArray;
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
		var menu = null;
		var output = "<div id='" + this.elementUniqueID + "_mainDisplayArea'";
		if(IS_TOUCH_SYSTEM)
			output += " style='font-size:16px;'";
		output += "></div>"
				+ "<div id='" + this.elementUniqueID + "_tableErrorDisplayArea'></div>";
		var info = "<span><h2>About the Cluster Overview</h2></span>";
		info += "The Cluster Overview represents a high level view of the cluster. The cluster is displayed as a series of hosts (physical machine, logical partition of a physical machine (LPAR) or a virtual machine) with their respective members displayed within. Hosts may also contain guest members started in restart light mode. Members in a restart light mode are unable to be restarted on their home hosts and have been restarted on a guest. This is done to allow the member to recover to a point of consistency as fast as possible so that other active members can access and change the database objects that were locked by the abnormally terminated member. Members in a restart light mode will not accept new connections."
			+ "<span><h3>Hosts</h3></span>"
			+ "<table>"
			+	"<tr><td<img src='./images/clusterIndicators/TE_maintenance.png'/></td><td>Off line for maintenance</td></tr>"
			+	"<tr><td><img src='./images/clusterIndicators/TE_alerts.png'/></td><td>An alert flag has been set</td></tr>"
			+ "</table>"
			+ "<span><h3>Instances</h3></span>"
			+ "<table>"
			+	"<tr><td><img src='./images/clusterIndicators/TE_alerts.png'/></td><td>Alert flag has been set, click to see more details</td></tr>"
			+ "</table>"
			+ "<table><tr><td colspan='2'><b>Member</b></td>"
			+ 		"</td><td colspan='2'><b>CF</b></td>"
			+	"</tr>"
			+	'<tr><td></td><td></td><td><img width="10" height="10" src="./images/clusterIndicators/TE_checkmark.png"/></td><td>Primary</td></tr>'
			+	'<tr><td><table><tr><td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>'
			+	 	'<td><img width="10" height="10" src="./images/clusterIndicators/TE_restarting.png"/></td>'
			+		'<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td></tr></table>'
			+		"</td><td>Restarting</td>"
			+		'<td><table><tr><td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>'
			+			'<td><img width="10" height="10" src="./images/clusterIndicators/TE_restarting.png"/></td>'
			+			'<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td></tr></table>'
			+		"</td><td>Restarting</td></tr>"
			+	'<tr><td><table><tr><td><img width="10" height="10" src="./images/clusterIndicators/TE_offline.png"/></td>'
			+		'<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>'
			+		'<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td></tr></table>'
			+		"</td><td>Offline</td>"
			+		'<td><table><tr><td><img width="10" height="10" src="./images/clusterIndicators/TE_offline.png"/></td>'
			+			'<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>'
			+			'<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td></tr></table>'
			+		"</td><td>Offline</td></tr>"
			+'	<tr><td><table><tr><td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>'
			+'		<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>'
			+'		<td><img width="10" height="10" src="./images/clusterIndicators/TE_nominal.png"/></td></tr></table>'
			+		"</td><td>Online</td>"
			+		'<td><table><tr><td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>'
			+			'<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>'
			+			'<td><img width="10" height="10" src="./images/clusterIndicators/TE_nominal"/></td></tr></table>'
			+			 "</td><td>Online</td></tr>"
			+	'<tr><td><table><tr><td><img width="10" height="10" src="./images/clusterIndicators/TE_restarting.png"/></td>'
			+		'<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>'
			+		'<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td></tr></table>'
			+		"</td><td>Error</td>"
			+		'<td><table><tr><td><img width="10" height="10" src="./images/clusterIndicators/TE_restarting.png"/></td>'
			+			'<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>'
			+			'<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td></tr></table>'
			+		"</td><td>Error</td></tr>"
			+	'<tr><td><table><tr><td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>'
			+		'<td><img width="10" height="10" src="./images/clusterIndicators/TE_waiting.png"/></td>'
			+		'<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td></tr></table>'
			+		"</td><td>Waiting&nbsp;to&nbsp;restart&nbsp;on&nbsp;home&nbsp;host</td>"
			+		'<td><table><tr><td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td>'
			+		'<td><img width="10" height="10" src="./images/clusterIndicators/TE_waiting.png"/></td>'
			+		'<td><img width="10" height="10" src="./images/clusterIndicators/TE_nothing.png"/></td></tr></table>'
			+		"</td><td>Catchup</td></tr>"
			+ 		"</table>"
			+	"</td></tr></table>";
		this.parentPanel.setContent(output, "Cluster Overview", info, null, menu);
		this.retrieveData();
	},
	
	setError: function(message) {
		var contentArea = $(this.elementUniqueID + "_mainDisplayArea");
		var errorArea = $(this.elementUniqueID + "_tableErrorDisplayArea");
		if(contentArea != null)
			contentArea.hide();
		if(errorArea != null) {
			errorArea.show();
			errorArea.update(message);
		}
	},
	
	clearError: function() {
		var contentArea = $(this.elementUniqueID + "_mainDisplayArea");
		var errorArea = $(this.elementUniqueID + "_tableErrorDisplayArea");
		if(contentArea != null)
			contentArea.show();
		if(errorArea != null) {
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
		var output = "<table><tbody>"
					+ 	"<tr><td>ID</td><td>:</td><td>" + rowData[0] + "</td></tr>"
					+	"<tr><td>Home host</td><td>:</td><td>" + rowData[1] + "</td></tr>"
					+	"<tr><td>Current host</td><td>:</td><td>" + rowData[2] + "</td></tr>"
					+	"<tr><td>Type</td><td>:</td><td>" + rowData[3] + "</td></tr>"
					+	"<tr><td>State</td><td>:</td><td>" + rowData[4] + "</td></tr>"
					+	"<tr><td>Alert</td><td>:</td><td>" + rowData[5] + "</td></tr>"
					+	"<tr><td>Database partition number</td><td>:</td><td>" + rowData[6] + "</td></tr>"
					+	"<tr><td>Logical port</td><td>:</td><td>" + rowData[7] + "</td></tr>"
					+	"<tr><td>Network name</td><td>:</td><td>" + rowData[8] + "</td></tr>"
					+ "</tbody></table>";
		
		if(GENERAL_BLANK_POPUP != null)
			GENERAL_BLANK_POPUP.close();
		show_GENERAL_BLANK_POPUP("", output);
	}
}));
