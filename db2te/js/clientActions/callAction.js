/*******************************************************************************
 *  Author: Peter Prib
 * 
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2009 All rights reserved.
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
var callActionActive = $H();

CORE_CLIENT_ACTIONS.set("callAction",  Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		$super(callParameters.uniqueID + "_callAction", "Call Action");
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		this.parentPageID = callParameters.uniqueID;
		callActionActive.set(this.elementName, this);
		this.callParameters=callParameters;
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		parentPanel.registerNestedObject(this.elementUniqueID, this);
		var parentPanel = getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID);
		parentPanel.registerNestedObject(this.elementUniqueID, this);
		parentPanel.refreshType = "callback";
		parentPanel.refreshCallback = 'callActionActive.get("' + this.elementUniqueID + '").draw()';

		this.action=callParameters.name;
		if(this.action==null) this.action= '*** action name not specified ***';	
		this.actionDirectory=(callParameters.directory==null?'':callParameters.directory+'/');
		this.title=callParameters.title;
		if(this.title==null) this.title= 'Run '+this.action;
		this.reloadPanel=(callParameters.reloadPanel=="true");
		this.result="<img style='float:none;' src='images/loadingpage.gif'/>";
		this.state="initialisation";
		this.draw();
		this.runActionAJAXRequest();
	},
	draw: function() {
		getPanel(this.parentStageID, this.parentWindowID, this.parentPanelID ).setContent("<div id='" + this.elementName + "_output'></div>", this.title, null, null, null);
	},

	runActionAJAXRequest: function(menuElement,title,query) {
		var thisObject = this;
		this.setLoading();
		POSTDATA = new Object();
		POSTDATA.uniqueID 		= this.elementUniqueID;
		POSTDATA.stageID 		= this.parentStageID;
		POSTDATA.windowID 		= this.parentWindowID;
		POSTDATA.panelID 		= this.parentPanelID;
		POSTDATA.returntype 	= 'JSON';
		POSTDATA.action         = 'loadAction';
		POSTDATA.file		    = this.actionDirectory+this.action+'.xml';
		new Ajax.Request(ACTION_PROCESSOR, {
			'parameters': POSTDATA,
			onSuccess: function(transport) {
				thisObject.result = transport.responseJSON;
				if(thisObject.result == null)	{
					thisObject.setError('Action failed, nothing returned');
					return;
				}
				if(thisObject.result.flagGeneralError == true && thisObject.result.connectionError == true) {
					thisObject.state="refresh";
					initiateConnectionRefresh();
					return;
				}
				if(thisObject.result.returnCode == "false" || thisObject.result.returnCode == false) {
			 		thisObject.setError(thisObject.result.returnValue);
			 		return;
				} 
				try {
					switch (thisObject.result.scriptType) {
						case 'action':
							thisObject.setExecuting();
							runTEScript(thisObject.elementName + "_"+thisObject.action, thisObject.result.returnValue , null, null,"callActionActive.get('" + thisObject.elementName + "').setRequestCompleted", null, thisObject.parentStageID, thisObject.parentWindowID, thisObject.parentPanelID, thisObject.elementName, thisObject.elementName + "_output");
							break;
						case 'tutorial':
							loadLink({
								 type				: "LINK"
								,window				: thisObject.parentWindowID
								,windowStage		: thisObject.parentStageID
								,target				: thisObject.parentPanelID
								,PrimaryContainer 	: true
								,LoadInWindow 		: "_blank"
						        ,data: {
									type		: "ACTION",
									parameters	: {
										 action			: "tutorial"
										,tutorialName	: thisObject.title
										,startAtPage	: thisObject.callParameters.startAtPage
										,Script			: thisObject.result.returnValue
									}
								}
							});
							break;
					}
				} catch(e) {thisObject.setError(e);}
			},
			onComplete: function(transport) {
			},
			'onException': function(transport,error) {
					thisObject.setError("Error Loading action, exception: "+ error);
			},
			'onFailure': function(transport,error) {
				thisObject.setError("Error Loading action, failure: "+ error);
			}
		});
	},
	setDisplay: function(data) {
		var container = $(this.parentPageID);
		if(container != null)
			container.update("<table style='width:100%;height:100%' cellpadding='0' cellspacing='0'>"
			+"<tr><td align='center'>"+data+"</td></tr>"+this.getListState()+"</table>");
	},
	setError: function(ErrorMSG) {
		this.state="error";
		this.setDisplay("<h2>"+ErrorMSG+"</h2>");
	},
	setLoading: function() {
		this.state="loading";
		this.setDisplay(this.decodeObject(this.result));
	},
	setExecuting: function() {
		this.state="excuting";
		this.setDisplay(this.decodeObject(this.result));
	},
	setRequestCompleted: function() {
		this.state="Completed";
		if(this.reloadPanel)
			getWindow(this.parentStageID,this.parentWindowID).reloadPage();
		this.setDisplay("Request completed");
	},
	getState: function() {
		return "<tr><td>"+this.title+"</td><td>"+this.state+"</td><td>"+this.decodeObject(this.result)+"</td></tr>";
	},
	getListState: function() {
		var out="<tr><td align='center'><table><tr><th>Title</th><th>State</th><th>Results</th></tr>";
		callActionActive.each(function(action) {
		  out+=action[1].getState();
		});
		return out+"</table></td></tr>";
	},
	decodeObject: function(value) {
		if(Object.isString(value))return value;
		if(value.returnValue!=null) return ;
		if(Object.isArray(value)){
			out="<table>";
			for(var i=0;i<value.length;i++) {
				try{out+="<tr>"+this.decodeObject(value[i])+"</tr>";}
				catch (e) {out+="<tr>"+e+"</tr>";}
			}
			return out+"</table>";
		}
		return "callAction decodeObject unknown value: " + Object.toJSON(value); 
	}
}));