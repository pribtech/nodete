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
var ObjectManager = {
	
	LOCAL_OBJECT_STORE : $H(),
	
	HistoryNoteArea : null,
	
	removeTableDefinition: function(tableName, tableSchema) {
		var tableFullName = tableName;
		var tableDefStore = this.LOCAL_OBJECT_STORE.get('tableDef');
		if(tableSchema != null && tableName != "")
			tableFullName = tableSchema + "." + tableName;
		else
			tableFullName = tableName;
		if(tableDefStore != null)
			tableDefStore.unset(tableFullName);
	},
	
	resetTableDefinitionStore: function() {
		this.LOCAL_OBJECT_STORE.unset('tableDef');
	},
	
	getTableDefinition: function (tableName, tableSchema, onSuccessFunction, onFailerFunction, setLoadingFunction, forceReload, baseFolder, definitionRetrievalAction, definitionRetrievalParameters) {
		if(onSuccessFunction == null && onSuccessFunction == "") return null;
		if(forceReload == null) forceReload = false;
		var tableDefStore = this.LOCAL_OBJECT_STORE.get('tableDef');
		var returnTableDefinition = null;
		var tableFullName = ( tableSchema != null && tableName != "" ? tableFullName = tableSchema + "." + tableName : tableName );
		
		if(tableDefStore == null) {
			tableDefStore = $H();
			this.LOCAL_OBJECT_STORE.set('tableDef', tableDefStore); 
		} else 
			returnTableDefinition = tableDefStore.get(tableFullName);
		if(returnTableDefinition != null && !forceReload)
				eval(onSuccessFunction + "(returnTableDefinition)");
		else {
			POSTDATA = definitionRetrievalParameters == null ? new Object() : definitionRetrievalParameters;
			POSTDATA.table 			= tableName;
			POSTDATA.schema 		= tableSchema;
			POSTDATA.action = definitionRetrievalAction == null ? "getTableDef" : definitionRetrievalAction;
			POSTDATA.returntype 	= 'JSON';
			POSTDATA.baseFolder		= baseFolder;
			POSTDATA.USE_CONNECTION = getActiveDatabaseConnection();
			this.RetrieveObject(POSTDATA, 'tableDef', tableFullName, onSuccessFunction, onFailerFunction, setLoadingFunction);
		}
	},
	
	getTEScript: function (TEScriptName, baseFolder, onSuccessFunction, onFailerFunction, setLoadingFunction, forceReload) {
		if(onSuccessFunction == null && onSuccessFunction == "") return null;
		if(forceReload == null) forceReload = false;
		var tableFullName = '';
		var TEScriptStore = this.LOCAL_OBJECT_STORE.get('TEScript');
		var returnTEScript = null;
		
		if(TEScriptStore == null) {
			TEScriptStore = $H();
			this.LOCAL_OBJECT_STORE.set('TEScript', TEScriptStore); 
		}
		else
			returnTEScript = TEScriptStore.get(tableFullName);
		
		if(returnTEScript != null && !forceReload)
			eval(onSuccessFunction + "(returnTEScript)");
		else {
			POSTDATA = new Object();
			POSTDATA.TEScriptName 	= TEScriptName;
			POSTDATA.action 		= "getTEScript";
			POSTDATA.returntype		= 'JSON';
			POSTDATA.baseFolder		= baseFolder;
			POSTDATA.USE_CONNECTION = getActiveDatabaseConnection();
			this.RetrieveObject(POSTDATA, 'TEScript', tableFullName, onSuccessFunction, onFailerFunction, setLoadingFunction);
		}
	},
	
	RetrieveObject: function(POSTDATA, ObjectType, fullName, onSuccessFunction, onFailerFunction, setLoadingFunction) {
		var localStore = this.LOCAL_OBJECT_STORE.get(ObjectType);
		var message = "";
		new Ajax.Request(ACTION_PROCESSOR, {
						'parameters': POSTDATA,
						'method': 'post',
						'onCreate': function() {
							if(setLoadingFunction != null && setLoadingFunction != "")
								eval(setLoadingFunction + "(true)");
						},
						'onSuccess': function(transport) {
							var result = transport.responseJSON;
	
							if(result == null) {
								message = CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.INVALID_JAVASCRIPT_OBJECT;
								if(onFailerFunction != null && onFailerFunction != "")
									eval(onFailerFunction + "(message)");
								return;
							}
							if(result.flagGeneralError == true && result.connectionError == true)
								initiateConnectionRefresh();
							if(result.flagGeneralError == true || isReturnCodeNotOK(result)) {
								if(onFailerFunction != null && onFailerFunction != "")
									eval(onFailerFunction + "(getReturnErrorMessage(result))");
								return;
							}
							
							if(result.returnValue != null) {
								result.returnValue['getBaseQuery'] = function () { 
									if(typeof this.baseQuery == "string")
										return this.baseQuery;
									 var query=""
									 for(var i=0;i<this.baseQuery.length;i++) {
									 	if(isDatabaseConnectionVersion(this.baseQuery[i]))
										 	query+=this.baseQuery[i].value;
									 }
									 return query;
								  }

								if(onSuccessFunction != null && onSuccessFunction != "") {
									localStore.set(fullName, result.returnValue);
									eval(onSuccessFunction + "(result.returnValue)");
								}
							}
						},
						'onException': function(transport,exception) {
							message = encodeMessage(CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.TABLE_DEFF_LOAD_EXCEPTION, {EXCEPTION_MESSAGE:exception});
							if(onFailerFunction != null && onFailerFunction != "")
								eval(onFailerFunction + (exception.stack==null?"(message)":"(message+'\\n'+exception.stack)"));
						},
						'onFailure': function(transport) {
							message = CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.TABLE_DEFF__LOAD_UNKNOWEN_ERROR;
							if(onFailerFunction != null && onFailerFunction != "")
								eval(onFailerFunction + "(message)");
						}
				});
	}

}