/*******************************************************************************
 * Author: Matthew Vandenbussche
 *Copyright IBM Corp. 2013 All rights reserved.
 * 
 *Modified by: Peter Prib
 *Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2009-2013 All rights reserved.
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

var ACTIVE_DATABASE_CONNECTION = window.name;
var CONNECTION_MANAGER_FIRST_LOAD = true;
var ACTIVE_DATABASE_CONNECTION_OBJECT = null;
var ACTIVE_DATABASE_CONNECTION_AUTHENTICATED = false;
var ACTIVE_DATABASE_CONNECTION_VERSION = null;
var ACTIVE_DATABASE_CONNECTION_FIXPAK = null;
var ACTIVE_DATABASE_DBMS = null;

if(ACTIVE_DATABASE_CONNECTION == true || ACTIVE_DATABASE_CONNECTION == 'true') 
	ACTIVE_DATABASE_CONNECTION = null;

var CONNECTION_MANAGER_CONNECTION_LIST = [];

var CONNECTION_MANAGER_TIMER = null;
var CONNECTION_MANAGER_CURRENTLY_UPDATING = false;

function initiateConnectionRefresh() {
	GET_GLOBAL_OBJECT_CLASS("connectionManager").each(function(manager){manager.value.connectionWatcher();});
}

function retrieveTableDataDatabaseConnection(object,retrieveId,useConnection) {
	if(useConnection==null) return;
	
	var selectionRange = ( useConnection.substr(0,1)=='*' ? useConnection.substr(1) : 'SELECTED' );
	var selectionRangeDetail = selectionRange.split('=');
	var connectionList = CONNECTION_MANAGER_CONNECTION_LIST;
	var connectionListLength = connectionList.length;
	for(i=0; i<connectionListLength; i++) {
		switch (selectionRangeDetail[0]) {
			case 'ALL' :
				break;
			case 'CONNECTED' :
				if(!connectionList[i]['connectionStatus']) continue;
				if (selectionRangeDetail.length>1)
					if(selectionRangeDetail[1]!=connectionList[i].databaseDriver) continue;
				break;
			case 'SELECTED' :
				if(useConnection != getDatabaseConnectionId(connectionList[i])) continue;
				object.retrieveTableData(retrieveId, connectionList[i]);
				return;
			default:
				continue;
		}
		object.retrieveTableData(retrieveId, connectionList[i]);
	}
}

function getDatabaseConnectionId(connection) {return connection['description'];}
function getDatabaseConnectionComment(connection) {return connection['comment'];}
function getDatabaseConnectionDatabase(connection) {return connection['database'];}
function getDatabaseConnectionDBMS(connection) {return connection['databaseDriver'];}
function getDatabaseConnectionHostname(connection) {return connection['hostname'];}
function getDatabaseConnectionPortNumber(connection) {return connection['portnumber'];}
function getDatabaseConnectionStatus(connection) {return connection['connectionStatus'];}
function getDatabaseConnectionUser(connection) {return connection['username'];}
function getDatabaseConnectionGroup(connection) {return connection['group'];}

function getActiveConnectionParameters() {
	return { connection:		getActiveDatabaseConnection()
	 		,databaseDriver:	getActiveDatabaseDriver()
	 		,database:			getActiveDatabaseName()
	 		,databaseVersion:	ACTIVE_DATABASE_CONNECTION_VERSION
	 		,databaseDBMS:		ACTIVE_DATABASE_DBMS
	 		,databaseFixpak: 	ACTIVE_DATABASE_CONNECTION_FIXPAK
	 		,databaseFeatures: 	getActiveFeatureList()
	 		,context: 	GLOBAL_CONTEXT.context
	 	};
}

function getActiveFeatureList(connectionObject) {
	var features="";
	if(connectionObject==undefined)	connectionObject=ACTIVE_DATABASE_CONNECTION_OBJECT;
	if(connectionObject==null) return "";
	if(connectionObject['features']==undefined) return ""; 
	if(connectionObject['features']==null) return ""; 
	for(feature in connectionObject['features'] )
		if(connectionObject['features'][feature])
			features+=","+feature;
	return features
}

function getActiveDatabaseConnection() {
	try{ return getDatabaseConnectionStatus(getDatabaseConnectionObjectWithId(ACTIVE_DATABASE_CONNECTION) ) ? ACTIVE_DATABASE_CONNECTION : null ;}
	catch (e) {return  ACTIVE_DATABASE_CONNECTION;}
}

function getActiveDatabaseName() {
	try{ return getDatabaseConnectionDatabase( getDatabaseConnectionObjectWithId(ACTIVE_DATABASE_CONNECTION) ); }
	catch (e) {return  "";}
}

function getActiveDatabaseDriver() {
	try{ return getDatabaseConnectionDBMS( getDatabaseConnectionObjectWithId(ACTIVE_DATABASE_CONNECTION) ); }
	catch (e) {return  "";}
}

function getActiveDatabaseConnectionObject() {return ACTIVE_DATABASE_CONNECTION_OBJECT;}

function getDatabaseConnectionObjectWithId(id) {
	for(i=0; i<CONNECTION_MANAGER_CONNECTION_LIST.length; i++)
		if(id == getDatabaseConnectionId(CONNECTION_MANAGER_CONNECTION_LIST[i]))
			return CONNECTION_MANAGER_CONNECTION_LIST[i];
	throw "not found";
}

function getConnectionWithTag(searchTag) {
	var localCONNECTION_MANAGER_CONNECTION_LIST = CONNECTION_MANAGER_CONNECTION_LIST;
	var searchPatteren = new RegExp(searchTag, 'i');
	for(var i = 0; i<localCONNECTION_MANAGER_CONNECTION_LIST.length; i++)
		if(getDatabaseConnectionComment(localCONNECTION_MANAGER_CONNECTION_LIST[i]).toLowerCase().match(searchTag) != null)
			return getDatabaseConnectionId(localCONNECTION_MANAGER_CONNECTION_LIST[i]);
	return null;
}

function getConnectionObjectWithTag(searchTag) {
	var localCONNECTION_MANAGER_CONNECTION_LIST = CONNECTION_MANAGER_CONNECTION_LIST;
	var searchPatteren = new RegExp(searchTag, 'i');
	for(var i = 0; i<localCONNECTION_MANAGER_CONNECTION_LIST.length; i++) 
		if(getDatabaseConnectionComment(localCONNECTION_MANAGER_CONNECTION_LIST[i]).toLowerCase().match(searchTag) != null)
			return localCONNECTION_MANAGER_CONNECTION_LIST[i];
	return null;
}

function getConnectionDBMS(id) {
	try{ return getDatabaseConnectionDBMS( getDatabaseConnectionObjectWithId(id) ); }
	catch (e) {return  null;}
}

function getConnectionHostname(id) {
	try{ return getDatabaseConnectionHostname( getDatabaseConnectionObjectWithId(id) );}
	catch (e) {return  null;}
}

function getConnectionPortNumber(id) {
	try{ return getDatabaseConnectionPortNumber( getDatabaseConnectionObjectWithId(id) );}
	catch (e) {return  null;}
}

function isCatalogConnection(description) {
	try{var connection=getDatabaseConnectionObjectWithId(id);}
	catch (e) {return  false;}
	
	return ( connection['hostname'] == ""   || connection['portnumber'] == "" ||
			 connection['hostname'] == null || connection['portnumber'] == null );
}

function setActiveDatabaseConnection(object) {
	resetActiveDatabaseConnection();

	ACTIVE_DATABASE_CONNECTION_OBJECT=object;
	if (object!=null)
		if(ACTIVE_DATABASE_CONNECTION_OBJECT['dataServerInfo'] != null) {
			ACTIVE_DATABASE_CONNECTION_VERSION = parseFloat( ACTIVE_DATABASE_CONNECTION_OBJECT['dataServerInfo']['dataServerVersion'] );
			ACTIVE_DATABASE_CONNECTION_FIXPAK = parseInt( ACTIVE_DATABASE_CONNECTION_OBJECT['dataServerInfo']['dataServerFixpack'] , 10);
			ACTIVE_DATABASE_DBMS = ACTIVE_DATABASE_CONNECTION_OBJECT['dataServerInfo']['DBMS'];
			ALL_GLOBAL_OBJECT('nodeFilter',null,'CONTEXTBASE');

			ACTIVE_DATABASE_CONNECTION = ACTIVE_DATABASE_CONNECTION_OBJECT['description'];
			window.name = ACTIVE_DATABASE_CONNECTION;
			GLOBAL_CONSTANTS.set('ACTIVE_DATABASE_CONNECTION', ACTIVE_DATABASE_CONNECTION);
			GLOBAL_CONSTANTS.set('ACTIVE_DATABASE_DESCRIPTION', ACTIVE_DATABASE_CONNECTION_OBJECT['description']);

			var selectedDriverDetails=GLOBAL_TE_SUPPORTED_DRIVERS.get(object.databaseDriver);
			for(var column in selectedDriverDetails.attributes) {
				var attributes=selectedDriverDetails.attributes[column];
				if(attributes.nameActive==null) continue;
				GLOBAL_CONSTANTS.set(attributes.nameActive, ACTIVE_DATABASE_CONNECTION_OBJECT[column]);
			}
	}
}

function resetActiveDatabaseConnection() {
	window.name = 'TE Not Connected';
	ACTIVE_DATABASE_CONNECTION_VERSION = null;
	ACTIVE_DATABASE_CONNECTION_FIXPAK = null;
	ACTIVE_DATABASE_DBMS = null;
	ALL_GLOBAL_OBJECT('nodeFilter',null,'CONTEXTBASE');
	
	var activeList = GLOBAL_CONSTANTS.grep(/ACTIVE_DATABASE/);
	for (var i=0;i<activeList.length;i++)
		GLOBAL_CONSTANTS.set(activeList[i].key, null);
}

function copyDatabaseVersion(inNode,outNode) {
	if(inNode.minVersion!=undefined) outNode.minVersion = inNode.minVersion;
	if(inNode.minFixPack!=undefined) outNode.minFixPack = inNode.minFixPack;
	if(inNode.maxVersion!=undefined) outNode.maxVersion = inNode.maxVersion;
	if(inNode.DBMS!=undefined) outNode.DBMS = inNode.DBMS;
	if(inNode.feature!=undefined) outNode.feature= inNode.feature;
}

function runFunctionBasedOnConnection(thisObject,isFunction,isArgs,isNotFunction,isNotArgs,Node,connectionObject ) {
	if(isDatabaseConnectionVersion(Node,connectionObject)) {
		isFunction.apply(thisObject,isArgs);
		return;
	}
	if(isNotFunction==null) return;  
	isNotFunction.apply(thisObject,isNotArgs);
}

function getValueBasedOnConnection(isValue,isNotValue,Node,connectionObject ) {
	if(isDatabaseConnectionVersion(Node,connectionObject)) return isValue;
	return isNotValue;
}

function isDatabaseConnectionVersion(Node,connectionObject) {
	if(Node==null) return true; 
	if(Node.context!=null) 
		if(GLOBAL_CONTEXT.notInList(Node.context)) return false;
	if(Node.notContext!=null) 
		if(Node.notContext!="") 
			if(GLOBAL_CONTEXT.inList(Node.notContext)) return false;
	if(connectionObject==undefined) {
		connectionObject=ACTIVE_DATABASE_CONNECTION_OBJECT;
		connectionVersion=ACTIVE_DATABASE_CONNECTION_VERSION;
		connectionDBMS=ACTIVE_DATABASE_DBMS;
		connectionFixpak=ACTIVE_DATABASE_CONNECTION_FIXPAK;
	} else {
		if(connectionObject['dataServerInfo'] != null) { 
			connectionVersion = parseFloat( connectionObject['dataServerInfo']['dataServerVersion'] );
			connectionFixpak = parseInt( connectionObject['dataServerInfo']['dataServerFixpack'] , 10);
			connectionDBMS = connectionObject['dataServerInfo']['DBMS'];
		} else {	
			connectionVersion=null;
			connectionDBMS=null;
			connectionFixpak=null;
		}
	}
	if(connectionVersion == null) {
		if (Node.minVersion != 0 && Node.minVersion != null 
		|| 	Node.minFixPack != 0 && Node.minFixPack != null 
		|| 	Node.maxVersion != 0 && Node.maxVersion != null 
		||  Node.DBMS != "ALL" && Node.DBMS != null) 
			return false;
		return true;
	}
	
	if(Node.DBMS != null)
		if(Node.DBMS != connectionDBMS && Node.DBMS != "ALL")
			return false;

	if(Node.feature!=null) 
		if(Node.feature!='') {
			if(connectionObject['features'] == undefined) return false;
			if(connectionObject['features'][Node.feature] == undefined) return false;
			if(connectionObject['features'][Node.feature] == false) return false;
		}
	if(Node.noFeature!=null) 
		if(Node.noFeature!='') {
			if(connectionObject['features'] == undefined) return false;
			if(connectionObject['features'][Node.noFeature] != undefined) return false;
			if(connectionObject['features'][Node.noFeature] == false) return false; 
		}
	
	if( Node.minVersion != 0 && Node.minVersion != null ) {
		if(	Node.minVersion > connectionVersion) return false;
		if(	Node.minVersion == connectionVersion)
			if(Node.minFixPack != 0 && Node.minFixPack != null)
				if(Node.minFixPack > connectionFixpak) return false
	}
	if(Node.maxVersion == 0) return true;
	if(Node.maxVersion == null) return true;
	if(Node.maxVersion < connectionVersion) return false;
	return true;
}

CORE_CLIENT_ACTIONS.set("connectionManager",Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		GLOBAL_CONSTANTS.set('ACTIVE_DATABASE_CONNECTION', ACTIVE_DATABASE_CONNECTION);
		
		$super(callParameters.uniqueID + "_" + getGUID(), "connectionManager");
		
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		
		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID ).registerNestedObject(this.elementUniqueID, this);
		
		this.actions = [];
		this.addAction(false,"newConnection"	,"createNewConnection()"	,"New");
		this.addAction(true	,"setDefault"		,"makeDefaultConnection()"	,"Connect");
		this.addAction(true	,"disconnect"		,"disconnectConnection()"	,"Disconnect");
		this.addAction(true	,"remove"			,"removeConnections()"		,"Remove");
		this.addAction(false,"showAll"			,"showAll()"				,"Show All");
		this.addAction(false,"showOnlyConnected","showOnlyConnected()"		,"Show Only Connected");
		this.addAction(false,"resetFeatures"	,"refreshFeatures()"		,"Reset Features");

		this.connectionTableName = this.elementName + '_connectionTable';
		this.connectionDataTable = null;
		this.currentSelectedConnectionRow = null;
		this.currentSelectedConnectionRowTC = null;
		this.connectionWatcherParameters = new Object();
		this.connectionWatcherParameters.touchConnection = 'false';
		this.connectionWatcherParameters.returntype = "JSON";
		this.currentlyUpdatingConnection = false;
		this.listOnlyConnected=false;
		this.draw();
		this.actionCallbackCloseFloat=false;
		setTimeout(this.callBackText + ".connectionWatcher();", 1000);
	},
	addAction: function(isRowAction,id,action,title,touchTitle) {
		this.actions[this.actions.length]={isRowAction:isRowAction,id:id,action:action,title:title,touchTitle:coalesce(touchTitle,title)};
	},
	processActions: function(callFunction) {
		for(var i=0;i<this.actions.length;i++) callFunction.apply(this,[this.actions[i]]);
	},
	showOnlyConnected: function() {this.listOnlyConnected=true;this.updateData();},
	showAll: function() {this.listOnlyConnected=false;this.updateData();},
	selectRow: function(RowID, TC)	{
		var i = 0;
		if(this.currentSelectedConnectionRow != RowID || this.currentSelectedConnectionRowTC != TC) {
			var oldRowID = this.currentSelectedConnectionRow;
			if(this.currentSelectedConnectionRowTC != null)
				oldRowID = this.currentSelectedConnectionRow + "_" + this.currentSelectedConnectionRowTC;
			var row = $(this.elementName + "_ActiveCONNECTION_MANAGER_CONNECTION_LIST_" + oldRowID);
			if(row != null) {
				var rowChildren = row.childElements();
				var numRowChildren = rowChildren.length;
				for(i = 0; i < numRowChildren; i++) 
					rowChildren[i].setStyle({'backgroundColor':'white'});
			}
		}
		this.currentSelectedConnectionRow = RowID;
		this.currentSelectedConnectionRowTC = TC;
		if(TC != null)
			RowID = RowID + "_" + TC;
		var row = $(this.elementName + "_ActiveCONNECTION_MANAGER_CONNECTION_LIST_" + RowID);
		if(row != null) {
			var rowChildren = row.childElements();
			var numRowChildren = rowChildren.length;
			for(i = 0; i < numRowChildren; i++)
				rowChildren[i].setStyle({'backgroundColor':'#CCCCFF'});
		}
	},
	
	addTrustedContextUser:function(row)	{
		var tempParamObject = $H();
		tempParamObject.set('TE_DATABASE_LOGIN_DESCRIPTION', this.connectionDataTable[row]['description']);
		tempParamObject.set('TRUSTED_CONTEXT_USERNAME', "");
		tempParamObject.set('TRUSTED_CONTEXT_PASSWORD', "");
		runTEScript(this.elementName + "_ConnectionScript", GLOBAL_TE_SCRIPT_STORE.get('DB_CONNECTION_SET_TRUSTED_CONTEXT_SCRIPT'), null, null, this.callBackText + ".actionCallback", tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
	},
	
	makeDefaultConnection:function() {
		if(this.currentSelectedConnectionRow == null) return; 
		if(this.connectionDataTable == null) return ;
		var tempParamObject = $H();
		try{
			tempParamObject.set('TE_DATABASE_LOGIN_DESCRIPTION', this.connectionDataTable[this.currentSelectedConnectionRow]['description']);
			this.actionCallbackCloseFloat=true;

			if(this.currentSelectedConnectionRowTC == null) {
				if(GLOBAL_TE_SUPPORTED_DRIVERS==null) 
					throw "List of supported drivers lost, recycle window";
				var selectedDriverDetails=GLOBAL_TE_SUPPORTED_DRIVERS.get(this.connectionDataTable[this.currentSelectedConnectionRow]['databaseDriver']);
				if(selectedDriverDetails==null) 
					throw "Failure using "+this.connectionDataTable[this.currentSelectedConnectionRow]['databaseDriver']+" check installed correctly";
				for(var column in selectedDriverDetails.attributes) {
					var attributes=selectedDriverDetails.attributes[column];
					tempParamObject.set(attributes.name ,this.connectionDataTable[this.currentSelectedConnectionRow][column]);
				}

				tempParamObject.set('TE_DATABASE_LOGIN_DATABASE_DRIVER', this.connectionDataTable[this.currentSelectedConnectionRow]['databaseDriver']);
				tempParamObject.set('TE_DATABASE_CONNECTION_STATUS', (this.connectionDataTable[this.currentSelectedConnectionRow]['connectionStatus'] ? "true" : this.connectionDataTable[this.currentSelectedConnectionRow]['connectionStatus']));
				tempParamObject.set('TE_DATABASE_AUTHENTICATED', (this.connectionDataTable[this.currentSelectedConnectionRow]['authenticated'] ? "true" : "false"));
				runTEScript(this.elementName + "_ConnectionScript", GLOBAL_TE_SCRIPT_STORE.get('DB_CONNECTION_SET_CONNECTION_SCRIPT'), null, null, this.callBackText + ".actionCallback", tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
				return;
			} 
			tempParamObject.set('TRUSTED_CONTEXT_USERNAME', this.currentSelectedConnectionRowTC);
			tempParamObject.set('TRUSTED_CONTEXT_PASSWORD', this.connectionDataTable[this.currentSelectedConnectionRow]['trustedContext'][this.currentSelectedConnectionRowTC]);
			runTEScript(this.elementName + "_ConnectionScript", GLOBAL_TE_SCRIPT_STORE.get('DB_CONNECTION_SET_TRUSTED_CONTEXT_SCRIPT'), null, null, this.callBackText + ".actionCallback", tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
		} catch(e) {
			openModalAlert("Failue in make default connection: "+e.toString());
			return;
		}
	},
	
	disconnectConnection:function() {
		if(this.currentSelectedConnectionRow == null || this.connectionDataTable == null) return;
		var tempParamObject = $H();
		tempParamObject.set('TE_DATABASE_LOGIN_DESCRIPTION', this.connectionDataTable[this.currentSelectedConnectionRow]['description']);
		runTEScript(this.elementName + "_DisconnectScript", GLOBAL_TE_SCRIPT_STORE.get('DB_CONNECTION_DISCONNECT_SCRIPT'), null, null, this.callBackText + ".actionCallback",tempParamObject,this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
	},
	
	removeConnections: function() {
		if(this.currentSelectedConnectionRow == null || this.connectionDataTable == null) return;
		var tempParamObject = $H();
		tempParamObject.set('TE_DATABASE_LOGIN_DESCRIPTION', this.connectionDataTable[this.currentSelectedConnectionRow]['description']);
		runTEScript(this.elementName + "_RemoveConnectionScript", GLOBAL_TE_SCRIPT_STORE.get('DB_CONNECTION_REMOVE_CONNECTIONS_SCRIPT'), null, null, this.callBackText + ".actionCallback", tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
	},

	createNewConnection: function()	{
		this.actionCallbackCloseFloat=true;
		var tempParamObject = $H();
		runTEScript(this.elementName + "_NewConnectionScript", GLOBAL_TE_SCRIPT_STORE.get('DB_CONNECTION_NEW_CONNECTION_DIALOG_SCRIPT'), null, null, this.callBackText + ".actionCallback", null, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
		return true;
	},

	actionCallback: function(returnStack) {
		var returnValue = returnStack.actionReturnValue;
		var returnObject = null;
		if(typeof(returnValue) == "object" && returnValue != null) {
			returnObject = returnValue;
			returnValue = returnObject['description'];
		}
		
		if("false" == String(returnValue).toLowerCase()) {
			resetActiveDatabaseConnection();
			this.updateActiveDatabaseConnection();
		} else {
			if(ACTIVE_DATABASE_CONNECTION != returnValue && ACTIVE_DATABASE_CONNECTION != null) 
				CORE_ReloadOnConnectionChange.each(function(panelItem) {
					if(callingPanelID != panelItem.value.elementUniqueID)
						panelItem.value.reloadPage();
				});

			ACTIVE_DATABASE_CONNECTION = returnValue != "-1" ? returnValue : null;
			setActiveDatabaseConnection(returnObject);
			window.name = ACTIVE_DATABASE_CONNECTION;

			if (CONNECTION_MANAGER_TIMER != null)
				clearTimeout(CONNECTION_MANAGER_TIMER);
			this.updateActiveDatabaseConnection(true);
		
			for(var action in returnStack.actionResults['_object']) 
				switch (action) {
					case 'DBConnectionNewConnection':
					case 'DBconnectionSetConnection_Authenticate':
						 this.refreshFeatures();
						 break;
				}
			
			this.connectionWatcher();
			ALL_GLOBAL_OBJECT('reloadIfRequired',null,'panel');
			allContextWindows.each(function(contextBase) {contextBase.value.reloadOnConnectIfRequired();});
			if(this.actionCallbackCloseFloat) {
				var floatingPanel=FLOATINGPANEL_activeFloatingPanels.get(this.parentPanelID);
				if (floatingPanel!=null) 
					if(floatingPanel.isDisplayed())
						floatingPanel.show_and_size();
			}
		}
		this.actionCallbackCloseFloat=false;
	},
	
	updateActiveDatabaseConnection: function(connectionObjectIsNew) {			
		connectionObjectIsNew = connectionObjectIsNew == null ? false : connectionObjectIsNew;			
		this.selectRow(null);

		if(ACTIVE_DATABASE_CONNECTION != null)  {
			var i = 0;
			var connectionListLength = CONNECTION_MANAGER_CONNECTION_LIST.length;
			for(i=0; i<connectionListLength; i++) {
				if(ACTIVE_DATABASE_CONNECTION == CONNECTION_MANAGER_CONNECTION_LIST[i]['description']) {
					if(ACTIVE_DATABASE_CONNECTION_OBJECT != null && connectionObjectIsNew)
						CONNECTION_MANAGER_CONNECTION_LIST[i] = ACTIVE_DATABASE_CONNECTION_OBJECT;
					else if(!connectionObjectIsNew || ACTIVE_DATABASE_CONNECTION_OBJECT == null)
						setActiveDatabaseConnection(CONNECTION_MANAGER_CONNECTION_LIST[i]);
						
					if(CONNECTION_MANAGER_CONNECTION_LIST[i]['authenticated']) {
						document.title = ACTIVE_DATABASE_CONNECTION;
						ACTIVE_DATABASE_CONNECTION_AUTHENTICATED = true;
					} else {
						document.title = DATABASE_NOT_CONNECTED_TEXT;
						ACTIVE_DATABASE_CONNECTION_AUTHENTICATED = false;
					}
					break;
				}
			}
			if(i>=connectionListLength) {
				if(ACTIVE_DATABASE_CONNECTION_OBJECT != null) {
					ACTIVE_DATABASE_CONNECTION_AUTHENTICATED = ACTIVE_DATABASE_CONNECTION_OBJECT['authenticated'];
					document.title = (ACTIVE_DATABASE_CONNECTION_AUTHENTICATED ? ACTIVE_DATABASE_CONNECTION : DATABASE_NOT_CONNECTED_TEXT );
					CONNECTION_MANAGER_CONNECTION_LIST.push(ACTIVE_DATABASE_CONNECTION_OBJECT);
				} else {
					ACTIVE_DATABASE_CONNECTION_AUTHENTICATED = false;
					document.title = DATABASE_NOT_CONNECTED_TEXT;
				}
			}
		}
			
		GET_GLOBAL_OBJECT_CLASS("connectionManager").each(function(connectionObject) { connectionObject.value.updateData(); });
	},
	
	connectionWatcher: function() {
		if(CONNECTION_MANAGER_CURRENTLY_UPDATING)
			return;
		CONNECTION_MANAGER_CURRENTLY_UPDATING = true;
		if (CONNECTION_MANAGER_TIMER != null)
			clearTimeout(CONNECTION_MANAGER_TIMER);
		var connectionWatcherParameters = this.connectionWatcherParameters;
		var thisObject = this;
		new Ajax.Request(CONNECTION_VERIFIER, {
			'parameters': connectionWatcherParameters,
			onSuccess: function(transport) {
				var result = transport.responseJSON;
				if(result == null)
					return;
				CONNECTION_MANAGER_CONNECTION_LIST = result.activeConnection;
				if(CONNECTION_MANAGER_FIRST_LOAD) {
					CONNECTION_MANAGER_FIRST_LOAD = false;
					for(var i = 0; i < CONNECTION_MANAGER_CONNECTION_LIST.length; i++) {
						if(CONNECTION_MANAGER_CONNECTION_LIST[i]['activeOnFirstLoad']) {
							ACTIVE_DATABASE_CONNECTION = CONNECTION_MANAGER_CONNECTION_LIST[i]['description'];
							setActiveDatabaseConnection(CONNECTION_MANAGER_CONNECTION_LIST[i]);
							CORE_ReloadOnConnectionChange.each(function(panelItem) {
									if(callingPanelID != panelItem.value.elementUniqueID)
										panelItem.value.reloadPage();
								});
								
							thisObject.updateActiveDatabaseConnection();
							ALL_GLOBAL_OBJECT('reloadIfRequired',null,'panel');
							return;
						}
					}	
				}
				thisObject.updateActiveDatabaseConnection();
			},
			onFailure: function(transport,error) {
				transport.responseText 
				openModalAlert("connectionManager.connectionWatcher: transport error - " + (error==null?decodeURI(transport.responseText) : error));
			},
			onComplete: function(transport) {
				ALL_GLOBAL_OBJECT('nodeFilter',null,'CONTEXTBASE');
				CONNECTION_MANAGER_CURRENTLY_UPDATING = false;
				CONNECTION_MANAGER_TIMER = setTimeout("GET_GLOBAL_OBJECT_CLASS('connectionManager').values()[0].connectionWatcher();", SESSION_TIMEOUT_IN_MIN*60000);
			}
		});
	},
	
	retrieveTableDataAllConnected: function (object,DBMS) {
		var connectionList = CONNECTION_MANAGER_CONNECTION_LIST;
		var connectionListLength = connectionList.length;
		for(var i = 0; i < connectionListLength; i++) {
			if(dataArray[i]['connectionStatus'] != true) continue;
			if(DBMS!=null)
				if(dataArray[i]['dataServerInfo']['DBMS'] != DBMS) continue;
			object.retrieveTableData(object.retrieveId,connectionList[i]['description']);
		}
	},
	
	getConnectionStatusImage: function (connection) {
		if(connection['driverAvailable']!=null)
			if(!connection['driverAvailable'])
				return "<img alt='N' title='Driver Broken' src='images/icon-lock-broken.gif' id='" + this.elementName + "_" + i + "_PageInformationButton' onMouseUp=\"stopPropagation(event);\" onMouseDown='show_GENERAL_BLANK_POPUP(null, decodeURIComponent(\"<div style=\\\"padding:10px;width:350px\\\">" + escape(connection['connectionStatus']) + "</div>\"));'/>"
		if(!connection['authenticated'])
			return "<img alt='N' title='Not authenticated' src='images/close_s.gif'/>";
		if(connection['connectionStatus'])
			return "<img alt='Y' title='Authenticated' src='images/unlock_h.gif'/>";
		return "<img alt='?' title='Connection error' src='images/alert.gif' id='" + this.elementName + "_" + i + "_PageInformationButton' onMouseUp=\"stopPropagation(event);\" onMouseDown='show_GENERAL_BLANK_POPUP(null, decodeURIComponent(\"<div style=\\\"padding:10px;width:350px\\\">" + escape(connection['connectionStatus']) + "</div>\"));'/>";
	},
	
	updateData: function () {
		var connObject = null;
		var dataArray = CONNECTION_MANAGER_CONNECTION_LIST;
		var connectiondescription = null;
		var connectionSelectIndex = null;
		if(this.currentSelectedConnectionRow != null && this.connectionDataTable != null && this.currentSelectedConnectionRowTC == null) {
			connObject = this.connectionDataTable[this.currentSelectedConnectionRow];
			if(connObject != null)
				connectiondescription = connObject['description'];
		} else if(this.currentSelectedConnectionRow != null && this.connectionDataTable != null && this.currentSelectedConnectionRowTC != null) {
			connObject = this.connectionDataTable[this.currentSelectedConnectionRow];
			if(connObject != null)
				connectiondescription = this.currentSelectedConnectionRowTC + "|" + connObject['description'];
		}
		this.currentSelectedConnectionRow = null;
		this.currentSelectedConnectionRowTC = null;
		var dataTable = $(this.elementName + "_ActiveCONNECTION_MANAGER_CONNECTION_LIST");
		this.connectionDataTable = dataArray;
		if(dataTable != null && dataArray != null) {
			this.clearCONNECTION_MANAGER_CONNECTION_LIST();
			var dataArray_Length = dataArray.length;
			if(dataArray_Length > 0) {
				var tdAttributs = "";
				var connectionStatus = "";
				var activeConnection = "";
				for(var i = 0; i < dataArray_Length; i++) {
					if (this.listOnlyGroup!=null) 
						if (this.listOnlyGroup!=dataArray[i]['group']) 
							continue
					if(this.listOnlyConnected)
						if(dataArray[i]['connectionStatus'] != true)
							continue;
					tdAttributs = " ontouchend='" + this.callBackText + ".makeDefaultConnection(" + i + ");' ondblclick='" + this.callBackText + ".selectRow(" + i + ");" + this.callBackText + ".makeDefaultConnection();'"
								+ ( IS_TOUCH_SYSTEM ? " ontouchstart": " onclick")
								+ "='" + this.callBackText + ".selectRow(" + i + ")' style='background-color:white;cursor: pointer;padding-left:5px;'";
					
					connectionStatus = this.getConnectionStatusImage(dataArray[i]);

					activeConnection = ACTIVE_DATABASE_CONNECTION == dataArray[i]['description'] ? "<img alt='&#187;' title='Connected' src='images/fw_bold.gif'/>" : "";
					dataTable.insert({bottom: "<tr id='" + this.elementName + "_ActiveCONNECTION_MANAGER_CONNECTION_LIST_" + i + "'" + (IS_TOUCH_SYSTEM ? " style='font-size:15px;padding:5px;border-bottom:1px;border-color:#888;' " : "") + ">" 
												+ "<td" + tdAttributs + ">" + activeConnection + "</td>"
												+ "<td valign='center' " + tdAttributs + ">" 
												+ 	(IS_TOUCH_SYSTEM ? 
														"<div style='-webkit-box-shadow: 0 1px 2px rgba(0,0,0,.5);background:-webkit-gradient(linear, left top, left bottom,"
															+	( dataArray[i]['authenticated'] ?
																 " from(#ff7200), to(#ff8c26))text-align:right;"
																:" from(#aaa), to(#eee));")
															+ "width:100px;height:20px;font-size:10px;margin:3px;padding:px;border-width:1px;-webkit-border-radius:5px;border-color:#888;'><button style='border-color:#ddd;-webkit-border-radius:5px;height:100%;width:40px;background:-webkit-gradient(linear, left top, left bottom, from(#eee), to(#aaa));-webkit-box-shadow: 0 1px 2px rgba(0,0,0,.2);'></button></div>" 
														:connectionStatus) 
												+ "</td>"
												+ "<td" + tdAttributs + ">" + dataArray[i]['description'] + "</td>" 
												+ "<td" + tdAttributs + ">" + (dataArray[i]['authenticated'] == true && dataArray[i]['hostname'].toLowerCase() != "localhost" && dataArray[i]['hostname'] != "127.0.0.1" ? "<img style='width:15px;height:15px;' onclick='" + this.callBackText + ".addTrustedContextUser(" + i + ");' title='Add trusted context user...' src='images/useradd.gif'/>" : "") + "</td>"
												+ "<td" + tdAttributs + ">" + (dataArray[i]['comment'] == null ? "" : dataArray[i]['comment']) + "</td>"
												+ "<td" + tdAttributs + ">" + (dataArray[i]['group'] == null ? "" : dataArray[i]['group']) + "</td>" 
											+ "</tr>"});
					if(dataArray[i]['trustedContext'] != null && dataArray[i]['authenticated']) {
						var trustedConnection = $H(dataArray[i]['trustedContext']);
						var elementName = this.elementName;
						var thisObject=this;
						trustedConnection.each(function(user) {
							tdAttributs = " ondblclick='" + thisObject.callBackText + ".selectRow(" + i + ",\"" + user.key + "\");" + thisObject.callBackText + ".makeDefaultConnection();' onclick='" + thisObject.callBackText + ".selectRow(" + i + ",\"" + user.key + "\")' style='background-color:white;cursor: pointer;padding-left:5px;'";
							activeConnection = ACTIVE_DATABASE_CONNECTION == user.key + "|" + dataArray[i]['description'] ? "<img src='images/fw_bold.gif'/>" : "";
							dataTable.insert({bottom:	"<tr id='" + elementName + "_ActiveCONNECTION_MANAGER_CONNECTION_LIST_" + i + "_" + user.key + "'><td" + tdAttributs + ">" + activeConnection 
												+ "</td><td" + tdAttributs + ">" + connectionStatus 
												+ "</td><td" + tdAttributs + ">" + dataArray[i]['databaseDriver'] 
												+ "</td><td" + tdAttributs + ">" + dataArray[i]['description'] 
												+ "</td><td" + tdAttributs + " colspan='2'>" + user.key 
												+ "</td></tr>"
							});
						});
						
					}
					if(connectiondescription != null && connectiondescription == dataArray[i]['description'])
						connectionSelectIndex = i;
					if(ACTIVE_DATABASE_CONNECTION == dataArray[i]['description'] && connectionSelectIndex == null)
						connectionSelectIndex = i;
				}
				if(!FORCE_CONNECTION_WITH_DEFAULT && !IS_TOUCH_SYSTEM) {
					this.processActions(function (action) {
							$(this.elementName+ "_"+action.id).show();
						});
					if(this.listOnlyConnected)
						$(this.elementName+ "_showOnlyConnected").hide();
					else
						$(this.elementName+ "_showAll").hide();
				}
			} else {
				dataTable.update("<tr><td align='center'>No connections</td></tr>");
				if(!FORCE_CONNECTION_WITH_DEFAULT && !IS_TOUCH_SYSTEM) {
					this.processActions(function (action) {
						$(this.elementName+ "_"+action.id).hide();
					});
				}
			}	
			if(IS_TOUCH_SYSTEM)
				this.processActions(function (action) {
						if(action.isRowAction) return;
						dataTable.insert({bottom:"<tr><td align='center' colspan='8'><button onclick='" + this.callBackText + "."+action.action+";' style='margin:10px;padding:10px;-webkit-border-radius:5px;width:95%;-webkit-box-shadow: 0 1px 2px rgba(0,0,0,.2);background-color:white;'>"+action.touchTitle+"</button></td></tr>"});
					});
		}

		if(connectionSelectIndex == null)
			connectionSelectIndex = 0;
		this.selectRow(connectionSelectIndex);
		
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID );
		if(parentPanel != null)
			if(parentPanel.size != null)
				parentPanel.size();
	},
	
	clearCONNECTION_MANAGER_CONNECTION_LIST: function() {
		this.currentSelectedConnectionRow = null;
		this.currentSelectedConnectionRowTC = null;
		var dataTable = $(this.elementName + "_ActiveCONNECTION_MANAGER_CONNECTION_LIST");
		if(dataTable != null)
			dataTable.update("<tr><td style='width:10px;'><b>Active&nbsp;&nbsp;</b></td><td style='width:30px;'><b>Auth.&nbsp;&nbsp;</b></td><td style='width:100px;'><b>Description&nbsp;</b></td><td style='width:50px;' title='Set Trusted Context'><b>Set&nbsp;TC&nbsp;&nbsp;</b></td><td style='width:100px;'><b>Comment&nbsp;</b></td><td><b>Group</b></td></tr>");
	},
	draw: function() {
		var menu = [];
		var connectionTableName = this.connectionTableName;
		var output = ( IS_TOUCH_SYSTEM ? "<div style='width:100%;' align='center'>" : "<div style='padding:5px;'>")
					+"<table " 
					+ (IS_TOUCH_SYSTEM ?
						 " class='fingerfriendly' style='margin:10px;padding:10px;-webkit-border-radius:5px;width:80%;-webkit-box-shadow: 0 1px 2px rgba(0,0,0,.2);'"
						:" style='width:100%;'")
					+ " id='" + this.elementName + "_ActiveCONNECTION_MANAGER_CONNECTION_LIST' cellpadding='0' cellspacing='0' >"
					+		"<tr><td align='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr>"
					+	"</table>"
			 		+ "</div'>";

		if(!FORCE_CONNECTION_WITH_DEFAULT && !IS_TOUCH_SYSTEM)
			this.processActions(function (action) {menu[menu.length]=this.menuLeaf(action.id,action.title,action.action)});
		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID ).setContent(output, 'Connection manager', null, null, menu);
	},
	
	menuLeaf: function(id,title,clickFunction,subnodes) {
		return	{nodeType : "leaf"
				,elementID : this.elementName + "_" + id
				,elementValue : title
				,elementAction : 'onclick="' + this.callBackText + '.' + clickFunction + ';"'
				,elementSubNodes : subnodes
				,elementSubNodeDirection : HORIZONTAL
			};
	},
	
	refreshFeatures: function() {
		var thisObject = this;
		POSTDATA = new Object();
		POSTDATA.returntype 	= 'JSON';
 		POSTDATA.action         = 'DBConnectionRefreshFeatures';
		POSTDATA.USE_CONNECTION = getActiveDatabaseConnection();
		new Ajax.Request(ACTION_PROCESSOR, {
			'parameters': POSTDATA,
			onSuccess: function(transport) {
				var result = transport.responseJSON;
				if(result == null) {
					openModalAlert("connectionManager.refreshFeatures: An invalid JavaScript object was returned");
					return;
				}
				if(result.flagGeneralError == true && result.connectionError == true) {
					openModalAlert("connectionManager.refreshFeatures: Connection error");
					return;
				}
				if(result.flagGeneralError == true || result.returnCode == "false" || result.returnCode == false) { 
					openModalAlert("connectionManager.refreshFeatures: "+ result.returnValue);
					return;
				}
				setActiveDatabaseConnection(result.returnValue);
			},
			onFailure: function(transport,error) {
				openModalAlert("connectionManager.refreshFeatures: transport error - " + error);
			},
			onComplete: function(transport) {
			}
		});
	}
}));