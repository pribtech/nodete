/*******************************************************************************
 *  Author: Peter Prib
 * 
 *  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2009-2011 All rights reserved.
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

CORE_CLIENT_ACTIONS.set("displayJSON",  Class.create(basePageElement, {
	initialize: function($super, callParameters) {
			$super(callParameters.uniqueID + "_displayJSON", "displayJSON");
			this.callParameters=callParameters;
			this.settingsDOM=getDOMParsed('<settings>'+(callParameters.$settings==null?'':callParameters.$settings)+'</settings>');
			this.draw();
		}
	,draw: function() {
			this.getParentPanel().setContent("<table id='" + this.elementName + "_Results' style='width:100%;' cellpadding='0' cellspacing='0' />"
											,this.getTitle(), null, null, []);
			this.resultsTable = $(this.elementName + "_Results");
			this.getData();
	}
	,drawJSON: function(json) {
			this.resultsTable.update('<tr><td>'+this.drawJSONNode(json)+'</td></tr>');
		}
	,drawJSONNode: function(obj) {
			if (typeof obj === 'undefined' || obj === null) 
				return '<td>';
			if (typeof obj !== 'object')
				return '<td><![CDATA['+obj+']]></td>';
			var elementValue ='';
			if (obj.constructor === Array) {
				for (var i = 0; i < obj.length; i++) {
					if (typeof obj[i] !== 'object'
					|| obj[i].constructor == Object) {
						elementValue += '<tr>'+this.drawJSONNode(obj[i]);'</tr>'
						continue;
					}
					throw new Error((typeof obj[i]) + ' is not supported.');
				}
				return '<table>'+elementValue+'</table>';
			}
			if (obj.constructor !== Object)
				return '<tr><td>' + tag + '</td></tr>';
			if (typeof obj['#text'] !== 'undefined') {
				if (typeof obj['#text'] == 'object')
					throw new Error((typeof obj['#text']) + ' which is #text, not supported.');
				elementValue += '<td>'+obj['#text']+'</td>';
			}

			for (var name in obj)
				elementValue+="<tr><td>"+name+"</td><td>"+this.drawJSONNode(obj[name])+"</td></tr>";
			return '<table>'+elementValue+'</table>';
		}
	,getData: function() {
			if(this.source==null) this.getParameter("source",null,"{error:'No Source defined'}");
			if(this.source.startsWith('{')) {
				this.sourceJSON= eval ("(" + this.source + ")"); 
				this.drawJSON(this.sourceJSON);
				return;
			}
			this.drawJSON("test: "+this.source);
			//this.setLoading();
		}
	,getParameter: function(parameter,xpath,defaultValue) {
			var settingValue=getNodeByXPath(this.settingsDOM,this.settingsDOM,'/settings/'+(xpath==null?parameter:xpath));
			if(settingValue!=null)
				this[parameter]=settingValue.nodeValue;
			if(this.callParameters['$'+parameter]!=null)
				this[parameter]=this.callParameters['$'+parameter];
			if(this[parameter]!=null) return;
			if(defaultValue==undefined) return; 
			this[parameter]=defaultValue;
		}
	,getParentPanel: function() {
			if(this.parentPanel) return this.parentPanel;
			this.parentPanel = getPanel(this.getParentStageID(), this.getParentWindowID(), this.getParentPanelID());
			return this.parentPanel;
		}		
	,getParentPanelID: function() {
		return this.callParameters.panelID;
		}		
	,getParentStageID: function() {
			return this.callParameters.stageID;
		}
	,getParentWindowID: function() {
			return this.callParameters.windowID;
		}
	,getTitle: function() {
			return this.getParameter('title',null,'JSON');
		}
	,setError: function(error) {
			this.resultsTable.update("<tr><td>Error</td><td>" + error + "</td></tr>");
		}
	,setLoading: function() {
			this.resultsTable.update("<tr><td align='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr>");
		}
}));