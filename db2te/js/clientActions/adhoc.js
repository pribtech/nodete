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


var AD_HOC_BASE_CONTROLER = Class.create(basePageElement, {
	initialize: function($super, ID, TYPE) {
		this.attached_AdHoc = null;
		this.AdHoc_baseControler = true;
		this.highlightedText="";
		$super(ID, TYPE);
	},
	
	registerAdHocObject: function(adHocObject) {
		if(this.attached_AdHoc != null)
			this.attached_AdHoc.unRegisterControler();
		this.attached_AdHoc = adHocObject;
		adHocObject.registerControler(this);
	},
	
	runPreAdHocScript: function(callBack) {
		if(callBack != null && callBack != "")
			eval(callBack);
	},
	
	runPostAdhocScript: function(callBack) {
		if(callBack != null && callBack != "")
			eval(callBack);
	}
	
});

CORE_CLIENT_ACTIONS.set("ADHOC", Class.create(basePageElement, {
	initialize: function($super, callParameters) {
		$super(callParameters.uniqueID, "ADHOC");
		this.callParameters = callParameters;
		this.primaryContainerID = callParameters.primaryContainer;
		this.AdHocLong = callParameters.AdHocLong == null ? false : callParameters.AdHocLong;	
		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		this.parentPanel = getPanel(this.parentStageID, this.parentWindowID,this.parentPanelID);
		
		this.Run_Storage = $H();
		this.parentControlerObject = null;
		if(callParameters.controlerType != null && callParameters.controlerID != null) {
			var controlerObject = GET_GLOBAL_OBJECT(callParameters.controlerType, callParameters.controlerID);
			if(controlerObject != null) {
				if(controlerObject.AdHoc_baseControler)
					controlerObject.registerAdHocObject(this);
			}
		}
		
		this.LoadSQLData = callParameters.LoadSQLData;
		this.LoadSQLData = this.LoadSQLData == null ? "" : this.LoadSQLData;
		this.IDCounter = 0;
		this.VerticalSplit = false;
		this.MessageWindow = "RESULTS";
		this.LocalStage = this.elementUniqueID + '_RESULT_STAGE';
		this.AllreadyRunning = false;
		this.resultSet=[];
		this.resultSetStorageHolder = null;
		this.resultSetStorageName = null;
		this.playResultSetActive=null;
		this.scriptMode=( callParameters.scriptMode == null ? "SQL" : callParameters.scriptMode.toUpperCase() );

		this.baseFeatureCheck={features:"costEstimation"};
		this.costEstimationAvaliable=getValueBasedOnConnection(true,false,this.baseFeatureCheck);
		
		this.draw();
		
		try {
			var window = (this.AdHocLong
						?getWindow(this.LocalStage, this.elementUniqueID + '_ADHOC_TEXT_WINDOW')
						:getWindow(this.parentStageID,this.parentWindowID)
						);
			if(window != null) {
				var panel = window.WindowContainers.get(this.elementUniqueID + "_ADHOC_TEXT_PANEL");
				if(panel != null)
					panel.registerNestedObject(this.elementUniqueID, this);
			}
		} catch(e) {
			openModalAlert(e);
		}
		this.setWidth(0);
		this.setHeight(0);

		var layout = ({
			target	: "RESULTS",
			raiseToTop:"",
			windowStage : this.LocalStage,
			raiseToTop: false,
			windowType: CAN_NOT_CLOSE,
			title : "Console",
			content	 : {
					type:"panel",
					name:"main",
					PrimaryContainer:true,
					ContentType:"RAW",
					data:"<div id='title'>Console</div><pre><code><div id='" + this.elementUniqueID + "_SQL_RESULT_RETURN_THIS_RUN' class='SQL_RESULTS_THIS_RUN'></div></code></pre><pre><code><div id='" + this.elementUniqueID + "_SQL_RESULT_RETURN_OLD' class='SQL_RESULTS_OLD'></div></code></pre>"
				}
		});
		loadNewPageLayout(layout);
		if(this.AdHocLong)
			RaiseToTop(this.LocalStage, this.elementUniqueID + '_ADHOC_TEXT_WINDOW');
		this.changeScriptMode(callParameters.scriptMode);
	},
	
	unRegisterControler: function() {
		this.parentControlerObject = null;
	},
	
	registerControler: function(adHocControler) {
		this.parentControlerObject = adHocControler;
	},
	
	draw: function() {

		var layout = null;
		
		if(!this.AdHocLong) {
			layout = ({
							type:"splitPane",
							direction:"h",
							maxSize:IS_TOUCH_SYSTEM ? 26 : 22,
							allowResize:false,
							panelA: {
									type:"panel",
									name:this.elementUniqueID + "_ADHOC_TOP_MENU",
									overflow:"hidden",
									PrimaryContainer:false,
									ContentType:"RAW",
									data:'<table style="width:100%;height:25px;" class="contextRootBase" cellpadding="0" cellspacing="0"><tbody><tr><td valign="top" style="text-align:left;width:5px;" id="' + this.elementUniqueID + '_AdhocOptionMenu" class="contextMenuBox"></td><td valign="top" style="text-align:left;width:5px;" id="' + this.elementUniqueID + '_AdhocActionMenu" class="contextMenuBox"></td><td>&nbsp;&nbsp;</td></tr></tbody></table>'
								},
							panelB: {
									type:"splitPane",
									direction:"h",
									splitPercent:0.5,
									allowResize:true,
									panelA: {
												type:"panel",
												name:this.elementUniqueID + "_ADHOC_TEXT_PANEL",
												overflow:"hidden",
												PrimaryContainer:true,
												ContentType:"RAW",
												data:'<div id="title">Ad hoc '+this.scriptMode+'</div><table id="' + this.elementUniqueID + '_SQL_TEXT_CONTAINER" style="width:50px;height:50px;" class="AdhocBase" cellpadding="0" cellspacing="0"><tbody><tr><td><textarea id="' + this.elementUniqueID + '_SQL_TEXT_FRAME"  onkeydown="' + this.callBackText + '.keyPressCatcher(event)" name="' + this.elementUniqueID + '_SQL_TEXT_FRAME" class="ADHOC_TEXTBOX" onselect="' + this.callBackText + '.storeHighlighted();" ></textarea><div id="' + this.elementUniqueID + '_SQL_HTML_FRAME" class="ADHOC_HTMLBOX" style="display:none;"></div></td></tr></tbody></table>'
											},
										panelB: {
													type				:"stage",
													name				: this.LocalStage,
													HasMenuBarContainer : TOP_TAB_TASK_BAR, 
													top					: 0, 
													botton				: 0, 
													left				: 0,
													right				: 0,
													titleBarType		: NO_TITLE_BAR,
													windowOptionType	: NO_NAV_BAR, 
													windowControlTypes	: NO_TITLE_BAR_OPTIONS,
													sizable				: WINDOW_IS_FULL
											}
								}
			});
			
			getWindow(this.parentStageID,this.parentWindowID).WindowContainers.get(this.parentPanelID).loadLayout(layout);
		} else {
			layout = ({
						type:"splitPane",
						direction:"h",
						maxSize:IS_TOUCH_SYSTEM ? 26 : 22,
						allowResize:false,
							panelA: {
									type:"panel",
									name:this.elementUniqueID + "_ADHOC_TOP_MENU",
									overflow:"hidden",
									PrimaryContainer:true,
									ContentType:"RAW",
									data:'<div id="title">Ad hoc '+this.scriptMode+'</div><table style="width:100%;height:25px;" class="contextRootBase" cellpadding="0" cellspacing="0"><tbody><tr><td valign="top" style="text-align:left;width:5px;" id="' + this.elementUniqueID + '_AdhocOptionMenu" class="contextMenuBox"></td><td valign="top" style="text-align:left;width:5px;" id="' + this.elementUniqueID + '_AdhocActionMenu" class="contextMenuBox"></td><td>&nbsp;&nbsp;</td></tr></tbody></table>'
								},
							panelB: {
										type				:"stage",
										name				: this.LocalStage,
										HasMenuBarContainer : TOP_TAB_TASK_BAR, 
										top					: 0, 
										botton				: 0, 
										left				: 0,
										right				: 0,
										titleBarType		: NO_TITLE_BAR,
										windowOptionType	: NO_NAV_BAR, 
										windowControlTypes	: NO_TITLE_BAR_OPTIONS,
										sizable				: WINDOW_IS_FULL
								}
			});
			getWindow(this.parentStageID,this.parentWindowID).WindowContainers.get(this.parentPanelID).loadLayout(layout);
			
			layout = ({
				target	: this.elementUniqueID + "_ADHOC_TEXT_WINDOW",
				raiseToTop: "",
				windowStage : this.LocalStage,
				windowType: CAN_NOT_CLOSE,
				title:"Ad Hoc Text",
				content	 : {
											type:"panel",
											name:this.elementUniqueID + "_ADHOC_TEXT_PANEL",
											PrimaryContainer:true,
											overflow:"hidden",
											ContentType:"RAW",
											data:'<div id="title">Ad Hoc Text</div>' +
													'<table id="' + this.elementUniqueID + '_SQL_TEXT_CONTAINER" style="width:50px;height:50px;" class="AdhocBase" cellpadding="2" cellspacing="0">' +
															'<tbody>' +
																'<tr>' +
																	'<td>' +
																		'<textarea id="' + this.elementUniqueID + '_SQL_TEXT_FRAME" name="' + this.elementUniqueID + '_SQL_TEXT_FRAME" onkeydown="' + this.callBackText + '.keyPressCatcher(event)" class="ADHOC_TEXTBOX" onselect="' + this.callBackText + '.storeHighlighted();"></textarea>' +
																		'<div id="' + this.elementUniqueID + '_SQL_HTML_FRAME" class="ADHOC_HTMLBOX" style="display:none;"></div>' +
																	'</td>' +
																'</tr>' +
															'</tbody>' +
													'</table>'
			}});
			
			loadNewPageLayout(layout);
		}
		
		this.setAdHocText(this.LoadSQLData);
		
		getWindow(this.parentStageID,this.parentWindowID).WindowContainers.get(this.parentPanelID).hideAddressBar();
	
createContextMenu(this.elementUniqueID + '_AdhocOptionMenu', [
	{
		nodeType: "branch",
		elementID : "branch",
		elementValue : "File",
		elementAction : '',
		elementSubNodes : [
			{
				nodeType: "leaf",
				elementID : this.elementUniqueID + "_OPEN",
				elementValue : "Open...",
				elementAction : 'onClick="' + this.callBackText + '.openFile();"',
				elementSubNodes : [],
				elementSubNodeDirection : HORIZONTAL
				},
			{
				nodeType: "leaf",
				elementID : this.elementUniqueID + "_SAVE",
				elementValue : "Save...",
				elementAction : 'onClick="' + this.callBackText + '.saveFile();"',
				elementSubNodes : [],
				elementSubNodeDirection : HORIZONTAL
			}
		],
		elementSubNodeDirection : HORIZONTAL
	},
	{
		nodeType: "leaf",
		elementID : this.elementUniqueID + "_AdhocExecutionHistory",
		elementValue : "History",
		elementAction : 'onClick="FLOATINGPANEL_activeFloatingPanels.get(\'' + this.elementUniqueID + '_AdhocExecutionHistory\').show_and_size();"',
		elementSubNodes : [],
		elementSubNodeDirection : HORIZONTAL
	},
	{
		nodeType: "leaf",
		elementID : this.elementUniqueID + "_AdhocOptionsButton",
		elementValue : "Options...",
		elementAction : 'onClick="FLOATINGPANEL_activeFloatingPanels.get(\'' + this.elementUniqueID + '_AdhocOptions\').show_and_size();"',
		elementSubNodes : null,
		elementSubNodeDirection : HORIZONTAL
	}
],HORIZONTAL, this.parentStageID, this.parentWindowID, this.parentPanelID);

createContextMenu(this.elementUniqueID + '_AdhocActionMenu', [
	{
		nodeType: "leaf",
		elementID : this.elementUniqueID + "_Execute",
		elementValue : "Run",
		elementAction : "onclick=\"" + this.callBackText + ".play();\"",
		elementSubNodes : null,
		elementSubNodeDirection : null
	},
	{
		nodeType: "leaf",
		elementID : this.elementUniqueID + "_Execute",
		elementValue : "Run selected",
		elementAction : "onmousedown=\"" + this.callBackText + ".playHighlighted();\" ",
		elementSubNodes : null,
		elementSubNodeDirection : null
	},
	{
		nodeType: "leaf",
		elementID : this.elementUniqueID + "_ClearResults",
		elementValue : "Clear&nbsp;results",
		elementAction : "onclick=\"" + this.callBackText + ".clearResults();\"",
		elementSubNodes : null,
		elementSubNodeDirection : null
	},	
	{
		nodeType: "leaf",
		elementID : this.elementUniqueID + "_EditQuery",
		elementValue : "Hightlight&nbsp;mode",
		elementAction : "onclick=\"" + this.callBackText + ".enableEditing();\"",
		elementSubNodes : null,
		elementSubNodeDirection : null
	},
	{
		nodeType: "leaf",
		elementID : this.elementUniqueID + "_Explain",
		elementValue : "Explain",
		elementAction : "onclick=\"" + this.callBackText + ".explainScript();\"",
		elementSubNodes : null,
		elementSubNodeDirection : null
	},
	{
		nodeType: "leaf",
		elementID : this.elementUniqueID + "_ExportAll",
		elementValue : "Export All",
		elementAction : "onclick=\"" + this.callBackText + ".showExportPanel('all');\"",
		elementSubNodes : null,
		elementSubNodeDirection : null
	}
], HORIZONTAL, this.parentStageID, this.parentWindowID, this.parentPanelID);

	var AdhocFormText = '<form id="' + this.elementUniqueID + '_adhocForm" target="main" action="action.php?action=AdHocSQL%2FprocessAdHoc" style="width:300px;" method="POST">' +
						'<span id="discriptionText"><h1>Ad Hoc SQL Options</h1></span>';

	if(JAVA_SQL_ENABLED || SSH2_ENABLED) {
		AdhocFormText += '<div style="padding:5px;"><h2>Ad Hoc mode:</h2><table><tr><td align="center">'+
						'<input id="' + this.elementUniqueID + '_OptionScriptModeSQL" onchange="' + this.callBackText + '.changeScriptMode(\'SQL\')" class="Adhoc" type="radio" size="1" name="scriptMode" checked value="SQL" />'+
						'</td><td>SQL script</td>';
	
		if(SSH2_ENABLED)
			AdhocFormText += '<td align="center">' +
						'<input id="' + this.elementUniqueID + '_OptionScriptModeSSH" onchange="' + this.callBackText + '.changeScriptMode(\'SHELL\')" class="Adhoc" type="radio" size="1" name="scriptMode" value="SHELL" />' +
						'</td><td>Shell script</td>';
		AdhocFormText += '</tr></table>';
	}
	AdhocFormText += '<div id="' + this.elementUniqueID + '_SHELLOptions" style="display:none;">' +
						'<h2>Script Execution Settings:</h2>' +
							'<table><tr><td align="center">' +
								'	<input id="' + this.elementUniqueID + '_OptionMaxRunTime" class="Adhoc" type="text" size="3" name="maxRunTime" value="' + (this.callParameters.shellMaxRunTime != null ? this.callParameters.shellMaxRunTime : SHELL_COMMAND_MAX_RUN_TIME) +'"align="center"/>' +
							'</td><td>Maximum run time</td><td align="center">' +
								'<input id="' + this.elementUniqueID + '_OptionShellTermChar" class="Adhoc" type="text" size="3" name="termCharater" value="' +(this.callParameters.shellTermChar != null ? this.callParameters.shellTermChar :AD_HOC_TERMINATION_CHAR) + '"align="center"/>' +
							'</td><td>Statement termination character</td></tr></table>' +
							'<h2>SSH Method:</h2><table><tr><td align="center">' +
							'<input id="' + this.elementUniqueID + '_OptionSSHMethodAutomatic" class="Adhoc" type="radio" size="1" name="sshMethod"';

var useJava = (this.callParameters.sshMethod == "java");
var usePhpseclib = (this.callParameters.sshMethod == "phpseclib");
var useSsh2Extension = (this.callParameters.sshMethod == "ssh2extension");		

if (this.callParameters.sshMethod == "automatic" || (!useJava && !usePhpseclib && !useSsh2Extension)) 
	AdhocFormText += ' checked ';

AdhocFormText += 		'value="automatic" />' 
				+ '</td><td>Automatic</td>';

if ((JAVA_SSH_AVAILABLE && JAVA_SSH_ENABLED) || useJava) {
	AdhocFormText += '<td align="center"><input id="' + this.elementUniqueID + '_OptionSSHMethodJava" class="Adhoc" type="radio" size="1" name="sshMethod"';
	if (useJava) 
		AdhocFormText += ' checked ';
	AdhocFormText += 'value="java" /></td><td>Java</td>';
}
if ((PHPSECLIB_SSH_AVAILABLE && PHPSECLIB_SSH_ENABLED) || usePhpseclib) {
	AdhocFormText += '<td align="center">' 
					+ '<input id=' + this.elementUniqueID + '_OptionSSHMethodPHPSecLib" class="Adhoc" type="radio" size="1" name="sshMethod"';
	if (usePhpseclib)
		AdhocFormText += ' checked ';
	AdhocFormText += 'value="phpseclib" /></td><td>phpseclib</td>';
}
if ((SSH_PHP_EXTENSION_AVAILABLE && SSH_PHP_EXTENSION_ENABLED) || useSsh2Extension) {
	AdhocFormText += '<td align="center">' 
					+	'<input id=' + this.elementUniqueID + '_OptionSSHMethodSSH2Extension" class="Adhoc" type="radio" size="1" name="sshMethod"'
	if (useSsh2Extension)
		AdhocFormText += ' checked ';
	AdhocFormText += 'value="ssh2extension" /></td><td>SSH2 Extension</td>';
}

AdhocFormText += '</tr></table></div>' 
				+ '<div id="' + this.elementUniqueID + '_SQLOptions">'
				+		'<h2>Query Execution Settings:</h2>'
				+		'<table><tr><td align="center">' 
				+				'<input id="' + this.elementUniqueID + '_OptionCommit" class="Adhoc" type="checkbox" size="1" name="commitPerSTMT" ' + ((this.callParameters.commitPerStmt != null ? this.callParameters.commitPerStmt : AD_HOC_COMMIT_PER_STMT) ? "checked" : "") + ' value="true" />' 
				+			'</td><td>Commit per statement</td></tr><tr><td align="center">' 
				+				'<input id="' + this.elementUniqueID + '_OptionCommentOnDoubleSlash" class="Adhoc" type="checkbox" size="1" name="commentOnDoubleSlash" ' + ( (this.callParameters.commentOnDoubleSlash==null?true:(this.callParameters.commentOnDoubleSlash.toLowerCase()!="false") ) ? "checked" : "") + ' value="true" />' 
				+			'</td><td>Comment on //</td></tr><tr><td align="center">' 
				+				'<input id="' + this.elementUniqueID + '_OptionCommentOnDoubleDash" class="Adhoc" type="checkbox" size="1" name="commentOnDoubleDash" ' + ( (this.callParameters.commentOnDoubleDash==null?true:(this.callParameters.commentOnDoubleDash.toLowerCase()!="false") ) ? "checked" : "") + ' value="true" />' 
				+			'</td><td>Comment on --</td></tr><tr><td align="center">' 
				+				'<input id="' + this.elementUniqueID + '_OptionTermChar" class="Adhoc" type="text" size="1" name="STMTermChar" value="' + (this.callParameters.termChar != null ? this.callParameters.termChar : AD_HOC_TERMINATION_CHAR) + '"align="center"/>' 
				+			'</td><td>Statement termination character</td></tr><tr><td align="center">' 
				+				'<input id="' + this.elementUniqueID + '_OptionRows" type="text" size="10" name="maxRowReturn" value="' + (this.callParameters.numRowReturned != null ? this.callParameters.numRowReturned : AD_HOC_NUMBER_OF_ROWS_TO_RETURN) + '"align="center"/>'
				+			'</td><td>Number of rows returned</td></tr><tr><td align="center">' 
				+				'<input id="' + this.elementUniqueID + '_OptionDefaultSchema" type="text" size="10" name="schema" value="' + (this.callParameters.schema != null ? this.callParameters.schema : "" ) + '"align="center"/>'
				+			'</td><td>Default schema</td></tr><tr><td align="center">'
				+				'<input id="' + this.elementUniqueID + '_OptionMaxExecutionTime" type="text" size="10" name="maxExecutionTime" value="' + (this.callParameters.maxExecutionTime != null ? this.callParameters.maxExecutionTime : AD_HOC_MAX_EXECUTION_TIME ) + '"align="center"/>'
				+			'</td><td>Max execution time <br>(in seconds)</td></tr><tr><td align="center">'
				+				'<input id="' + this.elementUniqueID + '_OptionPlayResultSetTime" type="text" size="10" name="playResultSetTime" value="' + (this.callParameters.playResultSetTime != null ? this.callParameters.playResultSetTime : "" ) + '"align="center"/>'
				+			'</td><td>Play pause time<br>(in seconds)</td></tr><tr><td align="center">'
				+       '</td></tr></table>'
				+		'<h2>Retrieve full data for:</h2>'
				+		'<table><tr><td>'
				+				'<input id="' + this.elementUniqueID + '_OptionXML" class="Adhoc" type="checkbox" name="displayXML" ' + ((this.callParameters.xml != null ? this.callParameters.xml : AD_HOC_DISPLAY_XML)? "checked" : "") + ' value="true" />'
				+			'</td><td>XML</td><td>' 
				+				'<input id="' + this.elementUniqueID + '_OptionXMLinline" class="Adhoc" type="checkbox" name="displayXMLinline"' + ((this.callParameters.xmlinline != null ? this.callParameters.xmlinline : AD_HOC_DISPLAY_XML_AS_INLINE) ? "checked" : "") + ' value="true" />'
				+			'</td><td>inline</td></tr><tr><td>' 
				+				'<input id="' + this.elementUniqueID + '_OptionCLOB" class="Adhoc" type="checkbox" name="displayCLOB" ' + ((this.callParameters.clob != null ? this.callParameters.clob : AD_HOC_DISPLAY_CLOB) ? "checked" : "") + ' value="true" />'
				+			'</td><td>CLOB</td><td>' 
				+				'<input id="' + this.elementUniqueID + '_OptionCLOBinline" class="Adhoc" type="checkbox" name="displayCLOBinline" ' + ((this.callParameters.clobinline != null ? this.callParameters.clobinline : AD_HOC_DISPLAY_CLOB_AS_INLINE) ? "checked" : "") + ' value="true" />'
				+			'</td><td>inline</td></tr><tr><td>' 
				+				'<input id="' + this.elementUniqueID + '_OptionBLOB" class="Adhoc" type="checkbox" name="displayBLOB" ' + ((this.callParameters.blob != null ? this.callParameters.blob : AD_HOC_DISPLAY_BLOB) ? "checked" : "") + ' value="true" />'
				+			'</td><td>BLOB</td><td></td><td></td></tr><tr><td>' 
				+				'<input id="' + this.elementUniqueID + '_OptionBDCLOB" class="Adhoc" type="checkbox" name="displayDBCLOB" ' + ((this.callParameters.dbclob != null ? this.callParameters.dbclob : AD_HOC_DISPLAY_DBCLOB) ? "checked" : "") + ' value="true" />'
				+			'</td><td>DBCLOB</td><td></td><td></td></tr></table></div></form></div>';
					
	var AdhocOptions = new floatingPanel(this.elementUniqueID + '_AdhocOptions', 'RAW', AdhocFormText, this.elementUniqueID + "_AdhocOptionsButton");
	this.parentPanel.registerNestedObject(AdhocOptions);
	AdhocOptions.draw();

	var AdhocExecutionHistory = new floatingPanel(this.elementUniqueID + '_AdhocExecutionHistory', 'RAW', 
		'<table style="width:200px;"><tr><td>' + 
			'<span>SQL submitted at:</span>' +
				'<ul TYPE=DISC id="' + this.elementUniqueID + '_AdhocExecutionHistory_List" class="AdhocExecutionHistory">' +
				'</ul>' + 
		'</td></tr></table>', this.elementUniqueID + "_AdhocExecutionHistory", true);
	this.parentPanel.registerNestedObject(AdhocExecutionHistory);
	AdhocExecutionHistory.draw();
	
	},

	openFile:function() {
		var tempParamObject = $H();
		tempParamObject.set('RUN_ACTION', 'OPENFILE');
		runTEScript(this.elementName + "_AdHocOpenFile", GLOBAL_TE_SCRIPT_STORE.get('AD_HOC_ACTION_SCRIPTS'), this.elementUniqueID, null, null,tempParamObject,this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
	},

	saveFile:function()	{
		var tempParamObject = $H();
		tempParamObject.set('SQL_TEXT', $(this.elementUniqueID + '_SQL_TEXT_FRAME').value);
		tempParamObject.set('RUN_ACTION', 'SAVEFILE');
		runTEScript(this.elementName + "_AdHocSaveFile", GLOBAL_TE_SCRIPT_STORE.get('AD_HOC_ACTION_SCRIPTS'), this.elementUniqueID, null, null,tempParamObject,this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
	},
	
	keyPressCatcher: function(event) {
		var TAB = event.DOM_VK_TAB != null ? event.DOM_VK_TAB : 9;
		if(event.keyCode == TAB && !event.ctrlKey && !event.altKey) {
			var a = Event.element(event);
			var selectStart = a.selectionStart;
			var selectEnd = a.selectionEnd;
			var top = a.scrollTop;
			var left = a.scrollLeft;
			var length = a.length;
			if(selectStart == selectEnd && !event.shiftKey) {
				a.value = a.value.substr(0,selectStart) + "\t" + a.value.substr(selectEnd);
				a.selectionStart = selectStart+1;
				a.selectionEnd =  selectStart+1;
			} else {
				var firstChunk = a.value.substr(0,selectStart);
				var lastIndexReturn = firstChunk.lastIndexOf("\n");
				var totalReplaceStart = 0;
				if(lastIndexReturn == -1) lastIndexReturn = 0;
				if(event.shiftKey) {
					var middle = a.value.substr((lastIndexReturn == 0 ? lastIndexReturn : lastIndexReturn+1), selectEnd-(lastIndexReturn == 0 ? lastIndexReturn : lastIndexReturn+1));
					if(middle.indexOf("\t") == 0) {
						middle = middle.substr(1);
						totalReplaceStart++;
					}
					var middleNew = middle.replace(/\n\t/g, "\n");
					a.value = a.value.substr(0, (lastIndexReturn == 0 ? lastIndexReturn : lastIndexReturn+1)) + middleNew + a.value.substr(selectEnd);
					a.selectionStart = selectStart - totalReplaceStart;
					a.selectionEnd =  selectEnd+((middleNew.length - (middle.length+totalReplaceStart)));
				} else {
					var middle = a.value.substr(lastIndexReturn, selectEnd-lastIndexReturn);
					if(lastIndexReturn == 0) {
						middle = "\t" + middle;
						totalReplaceStart++;
					}
					var middleNew = middle.replace(/\n/g, "\n\t");
					a.value = a.value.substr(0, lastIndexReturn) + middleNew + a.value.substr(selectEnd);
					a.selectionStart = selectStart+1;
					a.selectionEnd =  selectEnd+((middleNew.length - middle.length)+totalReplaceStart);
				}
			}
			a.scrollTop = top;
			a.scrollLeft = left;
			Event.stop(event);
			return false;
		}
	},
	
	setAdHocText: function(SQLText, highlightSQL, SQLHighlightOptions) {
		this.SQLHighlightOptions = SQLHighlightOptions;
		this.LoadSQLData = SQLText;
		var HTMLframe = $(this.elementUniqueID + '_SQL_HTML_FRAME');
		var SQLframe = $(this.elementUniqueID + '_SQL_TEXT_FRAME');
		var QueryHightlightButton = $(this.elementUniqueID + "_EditQuery");
		HTMLframe.hide();
		SQLframe.show();
		SQLframe.value = this.LoadSQLData;
		changeBorderNotification(this.elementUniqueID + '_SQLBasePanel_Execute');
		
		var highlightedCode = null;
		if(highlightSQL) {
			if(SQLHighlightOptions == null)
				highlightedCode = codeHighlight("DB2_SQL", SQLText, null, null, null, null);
			else if(SQLHighlightOptions != null)
				highlightedCode = codeHighlight("DB2_SQL", SQLText, SQLHighlightOptions.addedHighlightTokens, SQLHighlightOptions.changedHighlightTokens, SQLHighlightOptions.removedHighlightTokens, SQLHighlightOptions.copiedHighlightTokens);
			if(highlightedCode != null) {
				SQLframe.hide();
				HTMLframe.show();
				HTMLframe.update("<pre><code>" + highlightedCode + "</code></pre>");
				if(QueryHightlightButton != null)
					QueryHightlightButton.update("Edit&nbsp;mode");
				
				changeBorderNotification(this.elementUniqueID + '_Execute');
			}
		} else {
			if(QueryHightlightButton != null)
				QueryHightlightButton.update("Highlight&nbsp;mode");	
		}
		RaiseToTop(this.callParameters.stageID, this.callParameters.windowID);
		if(this.useLongAcHoc)
			RaiseToTop(this.LocalStage, this.elementUniqueID + '_ADHOC_TEXT_WINDOW');
	},
	
	updateAdHocOptions: function(option, value) {
		try	{
			switch(option) {
				case "Rows":
				case "MaxRunTime":
				case "ShellTermChar":
				case "TermChar":
				case "DefaultSchema":
				case "MaxExecutionTime":
				case "PlayResultSetTime":
					$(this.elementUniqueID + "_Option" + option).value = value;
				break;
				default:	
					$(this.elementUniqueID + "_Option" + option).checked = value;
			}
		}
		catch(e) {}
	},
	
	destroy: function($super) {
		try {
			this.Run_Storage = $H();
			var window = (this.AdHocLong
						?getWindow(this.LocalStage, this.elementUniqueID + '_ADHOC_TEXT_WINDOW')
						:getWindow(this.parentStageID,this.parentWindowID)
						);
			if(window != null)
				window.WindowContainers.unset(this.elementUniqueID + "_ADHOC_TEXT_PANEL");
		}
		catch(e) {}
		$super();
	},
	enableEditing: function() {
		var HTMLframe = $(this.elementUniqueID + "_SQL_HTML_FRAME");
		var SQLframe = $(this.elementUniqueID + "_SQL_TEXT_FRAME");
		if(HTMLframe != null && SQLframe != null) {
			if(HTMLframe.visible()) {
				HTMLframe.hide();
				SQLframe.show();
				$(this.elementUniqueID + "_EditQuery").update("Highlight&nbsp;mode");
			} else {
				HTMLframe.show();
				SQLframe.hide();
				this.setAdHocText(SQLframe.value, true, this.SQLHighlightOptions);
				$(this.elementUniqueID + "_EditQuery").update("Edit&nbsp;mode");
			}
		}
	},
	analyzeQuery: function(queryText, statmentTermChar) {
		var charSplit = queryText.split("");
		var currentStatment = {
			paramCount:0,
			serverQuery:""
		};
		var statmentSet = [];
		var currentChar = "";
		var inQuote = false;
		var lastCharWasEscape = false;
		var lastWasSingalQuote = false;
		var quoteType = "";
		
		charSplit = charSplit.reverse();
		while(currentchar = charSplit.pop()) {
			if(currentchar == statmentTermChar && !inQuote) {
				lastCharWasEscape = false;
				lastWasSingalQuote = false;
				if(!currentStatment.serverQuery.match(/^\s*$/))
					statmentSet.push(currentStatment);
				currentStatment = {
							paramCount:0,
							serverQuery:""
						};
			} else if(currentchar == "\\") {
				lastCharWasEscape = !lastCharWasEscape;
				lastWasSingalQuote = false;
				currentStatment.serverQuery += currentchar;
			} else if(currentchar == "\"" && !inQuote) {
				lastWasSingalQuote = false;
				quoteType = "\"";
				inQuote = true;
				currentStatment.serverQuery += currentchar;
			} else if(currentchar == "'" && !inQuote) {
				lastCharWasEscape = false;
				quoteType = "'";
				inQuote = true;
				currentStatment.serverQuery += currentchar;
			} else if(currentchar == '"' && !inQuote) {
				lastWasSingalQuote = false;
				lastCharWasEscape = false;
				quoteType = '"';
				inQuote = true;
				currentStatment.serverQuery += currentchar;
			} else if(currentchar == quoteType && inQuote && (!lastCharWasEscape) ) {
				quoteType = "";
				inQuote = false;
				currentStatment.serverQuery += currentchar;
			} else if(currentchar == "?" && !inQuote) {
				lastCharWasEscape = false;
				lastWasSingalQuote = false;
				currentStatment.paramCount++;
				currentStatment.serverQuery += currentchar;
			} else if(currentchar == "/" && charSplit.length > 0 && !inQuote) {
				if(charSplit[charSplit.length-1] == '/' && this.isOptionChecked('CommentOnDoubleSlash')) {
					currentchar = charSplit.pop();
					while(charSplit.pop() != "\n" && charSplit.length > 0);
					continue;
				} else if(charSplit[charSplit.length-1] == '*') {
					currentchar = charSplit.pop();
					while(currentchar = charSplit.pop()) {
						if(currentchar == '*' && charSplit.length > 0) {
							if(charSplit[charSplit.length-1] == '/') {
								currentchar = charSplit.pop();
								break;
							}
						}
					}
					continue;
				}
				
				lastWasSingalQuote = false;
				lastCharWasEscape = false;
				currentStatment.serverQuery += currentchar;
			} else if(currentchar == "-" && charSplit.length > 0 && !inQuote && !lastCharWasEscape) {
				if(charSplit[charSplit.length-1] == '-'  && this.isOptionChecked('CommentOnDoubleDash')) {
					currentchar = charSplit.pop();
					while(charSplit.pop() != "\n" && charSplit.length > 0);
					continue;
				}
				
				lastWasSingalQuote = false;
				lastCharWasEscape = false;
				currentStatment.serverQuery += currentchar;
			} else if(currentchar == "<" && charSplit.length > 2 && !inQuote && !lastCharWasEscape) {
				if(charSplit[charSplit.length-1] == '!' && charSplit[charSplit.length-2] == '-' && charSplit[charSplit.length-3] == '-') {
					charSplit.pop();
					charSplit.pop();
					currentchar = charSplit.pop();
					while(currentchar = charSplit.pop()) {
						if(currentchar == '-' && charSplit.length > 1) {
							if(charSplit[charSplit.length-1] == '-' && charSplit[charSplit.length-2] == '>') {
								charSplit.pop();
								currentchar = charSplit.pop();
								break;
							}
						}
					}
					continue;
				}
				
				lastWasSingalQuote = false;
				lastCharWasEscape = false;
				currentStatment.serverQuery += currentchar;
			} else {
				lastWasSingalQuote = false;
				lastCharWasEscape = false;
				currentStatment.serverQuery += currentchar;
			}
		}
		if(!currentStatment.serverQuery.match(/^\s*$/))
			statmentSet.push(currentStatment);
		return statmentSet;
	},
	
	storeHighlighted: function() {
		var textarea=$(this.elementUniqueID + '_SQL_TEXT_FRAME');
		this.highlightedText=textarea.value.substring(textarea.selectionStart,textarea.selectionEnd);
	},
	
	playHighlighted: function() {
		this.play(this.highlightedText);
 	},
	
	play: function(adHocSQLText) {
		this.highlightedText="";
		if(this.AllreadyRunning)
			return;
		this.AllreadyRunning = true;
		
		var callText = "";
		if(adHocSQLText==undefined)
			var adHocSQLText = $(this.elementUniqueID + '_SQL_TEXT_FRAME').value;
		var adHocSQLOptions = $(this.elementUniqueID + '_adhocForm').serialize(true);
		
		if(this.scriptMode == "SHELL")
			callText = this.callBackText + ".executScript(adHocSQLText,adHocSQLOptions);";
		else if(this.scriptMode == "SQL")
			callText = this.callBackText + ".executeQuery('" + ACTION_PROCESSOR + "?action=executeSQL',adHocSQLText,adHocSQLOptions);";
		if(this.parentControlerObject != null)
			this.parentControlerObject.runPreAdHocScript(callText,adHocSQLText,adHocSQLOptions);
		else
			eval(callText);
	},
	
	generate: function(i,type,heading,destination) {
		if(this.resultSet[i] == undefined) {
			openModalAlert('Result set not found');
			return;
		}
		if(i=='all') {
			TABLE_MANIPULATION_MODULES.get("Compare").generateAllBase(this.resultSet
					,{"type":type,"title":'no',"table":'Adhoc SQL',"heading":heading,"destination":destination}
					,type);
			return;
		}
		if(heading==undefined)
			TABLE_MANIPULATION_MODULES.get("Compare").generateAllBase(this.resultSet[i],type,type);
		else
			TABLE_MANIPULATION_MODULES.get("Compare").generateAllBase(this.resultSet[i]
					,{"type":type,"title":'no',"table":'Adhoc SQL',"heading":heading,"destination":destination}
					,type);
	},
	
	executeQuery: function(service,adHocSQLText,adHocSQLOptions) {
		var callbacktext = this.callBackText;
		var adhocStore = "";
		var thisObject = this;
		var parameters = new Object();
		parameters.pageID = this.elementUniqueID;
		parameters.stageID = this.parentStageID;
		parameters.windowID = this.parentWindowID;
		parameters.panelID = this.parentPanelID;
		parameters.USE_CONNECTION = getActiveDatabaseConnection();
		RaiseToTop(this.LocalStage, "RESULTS");
		var currentTime = new Date();
		currentTime = (currentTime.getHours()%12) + ":" + (currentTime.getMinutes() < 10 ? "0" + currentTime.getMinutes() : currentTime.getMinutes())+ ":" + (currentTime.getSeconds() < 10 ? "0" + currentTime.getSeconds() : currentTime.getSeconds()) + (currentTime.getHours() > 11 ? " PM" : " AM" );
		$(this.elementUniqueID + "_AdhocExecutionHistory_List").insert({top:"<li><a title=\"" + adHocSQLText.replace(/"/g, "&quot;")+ "\" onclick=\"$('" + this.elementUniqueID + "_SQL_TEXT_FRAME').value = decodeURIComponent('" + escape(adHocSQLText) + "'); closeOpenFloatingObject();\">" + currentTime + "</a></li>"});
		var queryPack = this.analyzeQuery(adHocSQLText, adHocSQLOptions.STMTermChar);
		$i = 0;
		queryPack.each(function(item) {
			parameters['SQL[' + $i + ']'] = item.serverQuery;
			$i++;
		});
		keys = Object.keys(adHocSQLOptions);
		keys.each(function(key){
			parameters[key] = adHocSQLOptions[key];
		});
		parameters["returntype"] = 'JSON';
		this.playResultSetTime = parameters['playResultSetTime'];
		
		new Ajax.Request( service, {
				'parameters': parameters,
			'method': 'post',
			'onCreate': function() {
				var CurrentResultHolder = $(thisObject.elementUniqueID + "_SQL_RESULT_RETURN_THIS_RUN");
				var OldResultHolder = $(thisObject.elementUniqueID + "_SQL_RESULT_RETURN_OLD");
				if($(parameters.pageID) == null) 
					return;
				var tempHTML = CurrentResultHolder.innerHTML;
				CurrentResultHolder.update("");
				OldResultHolder.insert({top:tempHTML});
				var mainResultArea = $(thisObject.elementUniqueID + "_RESULT_STAGE_RESULTS_main");
				adhocStore = mainResultArea.innerHTML;
				mainResultArea.update("<table width='100%' height='100%'cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr></table>");
				mainResultArea.scrollTop = 0;
				thisObject.parentPanel.startServerLoadIndicator();
			},
			'onComplete': function(transport) {
				thisObject.AllreadyRunning = false;
				if(thisObject.playResultSetActive==null)
					thisObject.parentPanel.clearLoadIndicator();
			},
			'onSuccess': function(transport) {
				var mainResultArea = $(thisObject.elementUniqueID + "_RESULT_STAGE_RESULTS_main");
				mainResultArea.update(adhocStore);
				var CurrentResultHolder = $(thisObject.elementUniqueID + "_SQL_RESULT_RETURN_THIS_RUN");
				if(CurrentResultHolder != null) {
					var results = transport.responseJSON;
					var totalResultSets = 0;
					var firstResultIndex=thisObject.resultSet.length;
					if(results != null) {
						if(thisObject.resultSetStorageHolder != null && thisObject.resultSetStorageName != null && thisObject.resultSetStorageName != "")
							thisObject.resultSetStorageHolder.set(thisObject.resultSetStorageName, results);
						if(Object.isString(results.returnValue))
							CurrentResultHolder.update("<table class='adhocErrorTable'><tr><td align='center'>" + results.returnValue + "</td></tr></table><hrclass='adhocInnerLine'/>");
						else {
							var resultText = "";
							resultText = "<table class='adhocReturnTable'>";
							resultText += "<tr><td width='150px'><b>Connection</b></td><td width='3px'>:</td><td>" + transport.request.parameters.USE_CONNECTION  + "</td></tr>";
							if(results.returnValue.RunTime != null)
								resultText += "<tr><td width='150px'><b>Time</b></td><td width='3px'>:</td><td>" + results.returnValue.RunTime + "</td></tr>";
							if(results.returnValue.AutoCommit != null)
								resultText += "<tr><td width='150px'><b>Auto commit</b></td><td width='3px'>:</td><td>" + ((results.returnValue.AutoCommit == "true") ? "ON" : "OFF") + "</td></tr>";
							if(results.returnValue.TotalRunDuration != null)
								resultText += "<tr><td width='150px'><b>Total time</b></td><td width='3px'>:</td><td>" + formateTimeForDisplay(results.returnValue.TotalRunDuration) + "</td></tr>";
							if(results.returnValue.STMTRun != null && results.returnValue.STMTReceived != null) {
								resultText += "<tr><td width='150px'><b>Statements executed</b></td><td width='3px'>:</td><td>" + results.returnValue.STMTRun + " of " + results.returnValue.STMTReceived + "</td></tr>";
								if(results.returnValue.STMTErrorCount != null)
									resultText += "<tr><td width='150px'><b>Statements Failed</b></td><td width='3px'>:</td><td"+(results.returnValue.STMTErrorCount>0?" style='color:red'>":">") + results.returnValue.STMTErrorCount + " of " + results.returnValue.STMTRun + "</td></tr>";
								if(results.returnValue.STMTWarningCount != null)
									resultText += "<tr><td width='150px'><b>Statements with Warning</b></td><td width='3px'>:</td><td"+(results.returnValue.STMTWarningCount>0?" style='color:#FFD700'>":">") + results.returnValue.STMTWarningCount + " of " + results.returnValue.STMTRun + "</td></tr>";
							}
							var STMTNum = 0;
							var statementSucceed=true;
							var numOfStatments = results.returnValue.STMTReturn.length;
							
							results.returnValue.STMTReturn.each( function (stmtNode) {
								STMTNum++;
								resultText +="</table>";
								statementSucceed &= stmtNode.statementSucceed;
								var StatementResult = true;
								var numOfResultSets = stmtNode.resultSet.length;
								stmtNode.STMTMSG = stmtNode.STMTMSG == null ? "" : stmtNode.STMTMSG;
								stmtNode.STMTError = stmtNode.STMTError == null ? "" : stmtNode.STMTError;
								StatementResult = "";
								if(stmtNode.STMTError == "" && stmtNode.STMTMSG == "" && stmtNode.statementSucceed)
									StatementResult = "<b style='color:green;'>SUCCEEDED</b>";
								else if((stmtNode.STMTError != "" || stmtNode.STMTMSG != "") && stmtNode.statementSucceed)
									StatementResult = "<b style='color:orange;'>SUCCEEDED WITH WARNING</b>";
								else if(stmtNode.STMTError == "" && stmtNode.STMTMSG == "" && !stmtNode.statementSucceed)
									StatementResult = "<b style='color:red;'>FAILED WITH NO WARNING</b>";
								else
									StatementResult = "<b style='color:red;'>FAILED</b>";
								var errorMSG = stmtNode.STMTMSG.escapeHTML();
								if(errorMSG != "" && errorMSG != null) {
									var errorResults = /\s([a-zA-Z][a-zA-Z][a-zA-Z])([0-9]+)([a-zA-Z]?)(\s?)/i.exec(errorMSG);
									if(!errorResults) {
										errorResults = errorMSG.split("SQLCODE=-");
										if(errorResults.length>1) {
											errorResults = errorResults[1].split(',');
											errorResults[1]='SQL';
											errorResults[2]=errorResults[0];
											errorResults[3]='n';
											errorResults[0]='SQLCODE=-'+errorResults[0];
										} else errorResults = null;
									}
									if(errorResults) {
										while(errorResults[2].length != 5)
											errorResults[2] = "0" + errorResults[2];
										var errorCodeLink = "<a onclick='OpenURLInFloatingWindow(\"http://publib.boulder.ibm.com/infocenter/db2luw/v9r5/topic/com.ibm.db2.luw.messages."
													+ errorResults[1].toLowerCase()
													+ ".doc/doc/m" + errorResults[1].toLowerCase()
													+ errorResults[2] + errorResults[3].toLowerCase() + ".html?noframes=true\")'>" + errorResults[0] + "</a>";
										errorMSG = errorMSG.replace(errorResults[0], errorCodeLink);
									}
								}
								resultText += "<div class='adhocStmt'>";
								resultText += "<b>Statement&nbsp;" + STMTNum + "</b>&nbsp;&nbsp;&nbsp;"+ StatementResult + "<br/>";
								if(stmtNode.STMT != "" && stmtNode.STMT != null)
									resultText += "<div class='adhocStmtDisplay'><pre><code>" + codeHighlight("DB2_SQL", stmtNode.STMT, null, null, null, null) + "</code></pre></div>";
								if(numOfResultSets > 1)
									resultText += "<b>Result&nbsp;sets&nbsp;returned:</b>&nbsp;&nbsp;" + numOfResultSets + "<br/>";
								if(stmtNode.STMTError != "")
									resultText += "<b>Return&nbsp;code:</b>&nbsp;&nbsp;" + stmtNode.STMTError + "<br/>";
								if(errorMSG != "")
									resultText += "<b>Return&nbsp;message</b><br/><div class='adhocStmtDisplay'>" + errorMSG + "</div>";
								if (stmtNode.runDuration != null && stmtNode.TotalRunDuration != null)
									resultText += "<b>Time:</b>&nbsp;&nbsp;" + formateTimeForDisplay(stmtNode.TotalRunDuration) + " / " + formateTimeForDisplay(stmtNode.runDuration) + "&nbsp;&nbsp;&nbsp;&nbsp;(Total&nbsp;/&nbsp;Data&nbsp;server)&nbsp;&nbsp;" + Math.round((10000-(stmtNode.runDuration/stmtNode.TotalRunDuration)*10000))/100.0 + "% overhead<br/>";
								if(stmtNode.parameters != null)
									if(stmtNode.parameters != "")
										try	{
											var QueryParameters = new Hash(stmtNode.parameters);
											resultText += "<b>Parameters</b><br/>";
											QueryParameters.each(function(AParameter) {
												resultText += "<div class='adhocStmtDisplay'>" + AParameter.key + ":<br/><div class='adhocStmtDisplay'>" + AParameter.value + "</div>" + "</div>";
											});
										}
										catch(e) {}
								resultText += "</div>";
								resultText +="<hr class='adhocInnerLine'/>";
								var LOBLinkBasePart1 = '<form id="' + thisObject.elementUniqueID + '_';
								var LOBLinkBasePart2 = '" target="_blank" action="' + DB2MC_SERVER + "/" + ACTION_PROCESSOR + '?action=echoBase64" method="POST"><input type="hidden" name="data" value="';
								var LOBLinkBasePart3 = '"><input type="hidden" name="type" value="';
								var LOBLinkBasePart4 = '"><img onclick="submiteFormToNewWindowInStage(\'' + thisObject.elementUniqueID + '_';
								var LOBLinkBasePart5 = '\',\'FloatingStage\')" src="images/sout.gif"></form>';
								if(numOfResultSets != 0) {
									var ResultNum = 0;
									stmtNode.resultSet.each( function(resultSet) {
										totalResultSets++;
										if(resultSet.columnsInfo==null) return;
										if(resultSet.data.length == 0 && resultSet.columnsInfo.num == 0) {
											if(thisObject.parentControlerObject!=null) {
												thisObject.parentControlerObject.runPostAdhocScript(); 
											if(thisObject.parentControlerObject.setAdhocRunState!=null)
													thisObject.parentControlerObject.setAdhocRunState(STMTNum,coalesce(results.returnValue.STMTErrorCount,0),coalesce(results.returnValue.STMTWarningCount,0));
											}
											thisObject.AllreadyRunning = false;
											return;
										}
										ResultNum++;
										resultIndex=thisObject.resultSet.length;
										thisObject.resultSet[resultIndex]=new Object();
										thisObject.resultSet[resultIndex].baseTableData=resultSet;
										thisObject.resultSet[resultIndex].baseQuery=stmtNode.STMT;
										var RAWdata = "<div id='title'>Result " + STMTNum + " of " + results.returnValue.STMTReceived + (numOfResultSets > 1 ? " (" + ResultNum + "/" + numOfResultSets + ")" : "" ) + "</div>";
										thisObject.IDCounter++;

										RAWdata += '<div id="pageLeftMenu"><form style="float:left;margin-bottom:0px;" id="' + thisObject.elementUniqueID + '_' + thisObject.IDCounter + '" target="_blank" action="' + DB2MC_SERVER + "/" + ACTION_PROCESSOR + '?action=echo" method="POST">'
												 + '<a onClick="' + thisObject.callBackText + '.generate('+resultIndex+',\'insert\');">Inserts&nbsp;&nbsp;</a>'
												 + '<a onClick="' + thisObject.callBackText + '.showExportPanel('+resultIndex+');">Export </a>';
										if(ALLOW_DISPLAY_OF_XML) {
											try {
												RAWdata += '<textarea name="data" style="display:none;">' + Object.toHTML(thisObject.buildTableDefinitionFromResultSet(stmtNode.STMT, resultSet.columnsInfo)) + '</textarea><input type="hidden" name="type" value="xml">Generate&nbsp;table&nbsp;definition&nbsp;XML:&nbsp;&nbsp;&nbsp;<a onclick="submiteFormToNewWindowInStage(\'' + thisObject.elementUniqueID + '_' + thisObject.IDCounter + '\',\'' + thisObject.parentStageID + '\')" src="images/sout.gif">View&nbsp;&nbsp;&nbsp;</a><a onclick="submiteFormToNewWindowInStage(\'' + thisObject.elementUniqueID + '_' + thisObject.IDCounter + '\',\'' + thisObject.parentStageID + '\', \'' + DB2MC_SERVER + "/" + ACTION_PROCESSOR + '?action=echo&saveAsFile=adhockTableDef.xml\', true)" src="images/sout.gif">Save&nbsp;&nbsp;&nbsp;</a>';
											} catch(e){
												openModalAlert(e);
											}
										}
										RAWdata += '</form></div>';
										RAWdata += "<table  style='table-layout: fixed;padding:0px;margin:0px;' class='tableCell' cellspacing='0px' cellpadding='5'><tr id='TableTitlerRow'><td></td>";
										for(var i = 0; i < resultSet.columnsInfo.num ; i++) {
											RAWdata += "<td><b>" + resultSet.columnsInfo.name[i] + "</b><br/>(" + resultSet.columnsInfo.type[i] + ")</td>";
										}
										RAWdata += "</tr>";
										var rowID = "";
										var numOfRows = resultSet.data.length;
										var RAWRowData = "";
										for(var k=0; k<numOfRows; k++) {
											dataRow = resultSet.data[k];
											rowID = rowID == "TableRowA" ? "TableRowB" : "TableRowA";
											RAWRowData = "<tr id='" + rowID + "'><td>" + (k+1) + "</td>";
											for(var i = 0; i < resultSet.columnsInfo.num ; i++) {
												thisObject.IDCounter++;
												if (dataRow[i] == null) { 
													RAWRowData += "<td><font style='color:red;font-weight: bold;'>null</font></td>";
													continue;
												}
												switch(resultSet.columnsInfo.type[i]) {
													case "real":
													case "int":
														RAWRowData += "<td align='right'>";
														break;
													default:
														RAWRowData += "<td>";
												}
												try {
													switch(resultSet.columnsInfo.type[i]) {
														case "xml":
															if (!parameters.displayXML) {
																RAWRowData += "(XML)";
																break;
															}
															RAWRowData += "<pre><code>";
															if(parameters.displayXMLinline)
																RAWRowData += dataRow[i].escapeHTML();
															else
																RAWRowData += LOBLinkBasePart1 + thisObject.IDCounter + LOBLinkBasePart2 + dataRow[i] + LOBLinkBasePart3 + "xml" + LOBLinkBasePart4 + thisObject.IDCounter + LOBLinkBasePart5;
															RAWRowData += "</code></pre>";
															break;
														case "clob":
															if (!parameters.displayCLOB) {
																RAWRowData += "(CLOB)";
																break;
															}
															RAWRowData += "<pre><code>";
															if(parameters.displayCLOBinline)
																RAWRowData += dataRow[i].escapeHTML();
															else
																RAWRowData += LOBLinkBasePart1 + thisObject.IDCounter + LOBLinkBasePart2 + dataRow[i] + LOBLinkBasePart3 + "clob" + LOBLinkBasePart4 + thisObject.IDCounter + LOBLinkBasePart5;
															break;
														case "blob":
															RAWRowData += ( parameters.displayBLOB ? (LOBLinkBasePart1 + thisObject.IDCounter + LOBLinkBasePart2 + dataRow[i] + LOBLinkBasePart3 + "blob" + LOBLinkBasePart4 + thisObject.IDCounter + LOBLinkBasePart5) : "(BLOB)") ;
															break;
														case "dbclob":
															RAWRowData += ( parameters.displayDBCLOB ? (LOBLinkBasePart1 + thisObject.IDCounter + LOBLinkBasePart2 + dataRow[i] + LOBLinkBasePart3 + "dbclob" + LOBLinkBasePart4 + thisObject.IDCounter + LOBLinkBasePart5) : "(DBCLOB)");
															break;
														default:
															RAWRowData += "<pre><code>"
																		+ ( Object.isString(dataRow[i]) ? dataRow[i].escapeHTML() : dataRow[i] )
																		+ "</code><pre>";
													} 
												}
												catch(E) {
													RAWRowData += "<a onclick='loadNewPageLayout(({target:\"_blank\", windowStage:\"" + parameters.stageID + "\", raiseToTop:\"y\", content:{ type:\"panel\", name:\"Menu\", PrimaryContainer:true,ContentType:\"RAW\",data:\"" + encodeURIComponent(dataRow[i]) + "\"}}));' style='color:red;'>ERROR</a>";
												}
												RAWRowData += "</td>";
											}
											RAWdata += RAWRowData + "</tr>";
										}
										RAWdata += "</table>";
										OpenNamedWindow("R"+resultIndex,{"target":"_blank","windowStage": parameters.pageID + "_RESULT_STAGE","raiseToTop":"y","content":{"type":"panel","name":"main","PrimaryContainer":true,"ContentType":"RAW","data": RAWdata }}, NORMAL);
									});
								}
							});
							resultText += "</tr></table><br/>";
							if(totalResultSets > 1 || numOfStatments > 1 || !statementSucceed)
								RaiseToTop(thisObject.LocalStage, "RESULTS");
							CurrentResultHolder.update("" + resultText);
							if(thisObject.playResultSetActive!=null)
								clearTimeout(thisObject.playResultSetActive);
							if(thisObject.playResultSetTime!=null && thisObject.playResultSetTime!="") {
								RaiseToTop(thisObject.LocalStage, "RESULTS");
								thisObject.playResultSetActive=setTimeout(thisObject.callBackText + ".playResultSet("+firstResultIndex+");", 1000*thisObject.playResultSetTime);
							}
						}
					}
					mainResultArea.scrollTop = 0;
				}
				if(thisObject.parentControlerObject != null) {
					thisObject.parentControlerObject.runPostAdhocScript(); 
					if(thisObject.parentControlerObject.setAdhocRunState!=null)
						thisObject.parentControlerObject.setAdhocRunState(STMTNum,coalesce(results.returnValue.STMTErrorCount,1),coalesce(results.returnValue.STMTWarningCount,0));
				}
			},
			'onFailure': function(transport) {
				var mainResultArea = $(thisObject.elementUniqueID + "_RESULT_STAGE_RESULTS_main");
				mainResultArea.update(adhocStore);
				var CurrentResultHolder = $(thisObject.elementUniqueID + "_SQL_RESULT_RETURN_THIS_RUN");
				if(CurrentResultHolder != null)	{
					CurrentResultHolder.insert({top:"" + transport.responseText + transport.statusText + "\n<hr class='adhocInnerLine'/>"});
					mainResultArea.scrollTop = 0;
				}
				if(thisObject.parentControlerObject != null)
					if(thisObject.parentControlerObject.setAdhocRunState!=null)
						thisObject.parentControlerObject.setAdhocRunState(0,1,0);
				thisObject.AllreadyRunning = false;
			},
			'onException': function(transport,exception) {
				var mainResultArea = $(thisObject.elementUniqueID + "_RESULT_STAGE_RESULTS_main");
				mainResultArea.update(adhocStore);
				var CurrentResultHolder = $(thisObject.elementUniqueID + "_SQL_RESULT_RETURN_THIS_RUN");
				if(CurrentResultHolder != null) {
					CurrentResultHolder.insert({top:"Exception while loading table data: "+exception + "\n<hr class='adhocInnerLine'/>"});
					mainResultArea.scrollTop = 0;
				}
				if(thisObject.parentControlerObject != null)
					if(thisObject.parentControlerObject.setAdhocRunState!=null)
						thisObject.parentControlerObject.setAdhocRunState(0,1,0);
			}
		});
	},
	
	showExportPanel: function(resultIndex) {		
		var title = "Export";
		var menuId = "Adhoc_Export_Panel_" + getGUID();
		var content = '<table width ="200">'
			+ '<tr><td>Type</td><td>'
			+       '<select id="' + menuId + '_Type">'
			+           '<option selected="selected" value="csv">csv - comma delimitered</option>'
			+           '<option value="csvTab">csv - tab delimitered</option>'
			+           '<option value="html">html</option>'
			+           '<option value="xml">xml</option>'
			+       '</select>'
			+   '</td></tr>'
   			+ '<tr><td>Heading</td><td>'
			+       '<select id="' + menuId + '_Heading">'
			+           '<option selected="selected" value="column">Column Name</option>'
			+           '<option value="noHeading">No Heading</option>'
			+       '</select>'
			+   '</td></tr>'
   			+ '<tr><td>Destination</td><td>'
			+       '<select id="' + menuId + '_Destination">'
			+           '<option selected="selected" value="window">Window</option>'
			+           '<option value="spreadsheet">Spreadsheet</option>'
			+           '<option value="text">Text</option>'
			+           '<option value="msword">MSWord</option>'
			+           '<option value="fo2pdf">PDF</option>'
			+       '</select>'
			+   '</td></tr>'
			+ '</table>'
			+ '<input type="button" value="Generate" onclick="'
			+ this.callBackText + ".generate('"+resultIndex+"',document.getElementById('" + menuId + "_Type').value,document.getElementById('" + menuId + "_Heading').value,document.getElementById('" + menuId + "_Destination').value)"
			+ '"/>';

		show_GENERAL_BLANK_POPUP(title, content, null);
	},
	
	explainScript: function() {
		var adHocSQLText = $(this.elementUniqueID + '_SQL_TEXT_FRAME').value;
		var adHocSQLOptions = $(this.elementUniqueID + '_adhocForm').serialize(true);
		if (adHocSQLText=="") return;
		var queryPack = this.analyzeQuery(adHocSQLText, adHocSQLOptions.STMTermChar);
		var i = 0;
		var schema=this.getOption('DefaultSchema');
		var stmttext=[];
		var action=GLOBAL_TE_SCRIPT_STORE.get('DB2ExplainDynamicSQL');
		queryPack.each(function(item) {
			stmttext[i] = $H();
			stmttext[i].set('stmttext',item.serverQuery);
			stmttext[i].set('schema',schema);
			runTEScript(this.elementName + "_Explain"+i, action , this.elementUniqueID, null, null,stmttext[i],  this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
			i++;
		});
	},

	sessionSignon: function(uri,user) {
		var tempParamObject = $H();
		tempParamObject.set('LOGIN_URI', uri);
		tempParamObject.set('LOGIN_USERNAME', user);
		runTEScript(this.elementName + "_connectionSignon", GLOBAL_TE_SCRIPT_STORE.get('connectionSignon'), null, null, this.callBackText + ".actionCallback", tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
	},
	
	executScript: function(adHocSQLText,adHocSQLOptions) {
		var adhocStore = "";
		var thisObject = this;
		var parameters = new Object();
		parameters.pageID = this.elementUniqueID;
		parameters.stageID = this.parentStageID;
		parameters.windowID = this.parentWindowID;
		parameters.panelID = this.parentPanelID;
		parameters.USE_CONNECTION = getActiveDatabaseConnection();
		RaiseToTop(this.LocalStage, "RESULTS");
		var currentTime = new Date();
		currentTime = (currentTime.getHours()%12) + ":" + (currentTime.getMinutes() < 10 ? "0" + currentTime.getMinutes() : currentTime.getMinutes())+ ":" + (currentTime.getSeconds() < 10 ? "0" + currentTime.getSeconds() : currentTime.getSeconds()) + (currentTime.getHours() > 11 ? " PM" : " AM" );
		$(this.elementUniqueID + "_AdhocExecutionHistory_List").insert({top:"<li><a title=\"" + adHocSQLText.replace(/"/g, "&quot;")+ "\" onclick=\"$('" + this.elementUniqueID + "_SQL_TEXT_FRAME').value = decodeURIComponent('" + encodeURIComponent(adHocSQLText) + "'); closeOpenFloatingObject();\">" + currentTime + "</a></li>"});
		parameters['SHELL'] = adHocSQLText;
		parameters["returntype"] = 'JSON';
		parameters["maxRunTime"] = adHocSQLOptions['maxRunTime'];
		parameters["termCharater"] = adHocSQLOptions['termCharater'];
		
		if ((JAVA_SSH_AVAILABLE && JAVA_SSH_ENABLED && adHocSQLOptions['sshMethod'] == "automatic") || (adHocSQLOptions['sshMethod'] == "java")) {
			var shellAction = "executeShellNew";
			parameters["sshMethod"] = "java";
		}
		else if ((PHPSECLIB_SSH_AVAILABLE && PHPSECLIB_SSH_ENABLED && adHocSQLOptions['sshMethod'] == "automatic") || (adHocSQLOptions['sshMethod'] == "phpseclib")) {
			var shellAction = "executeShell";
			parameters["sshMethod"] = "phpseclib";
		}
		else {
			var shellAction = "executeShell";
			parameters["sshMethod"] = "ssh2extension";
		}
		new Ajax.Request( ACTION_PROCESSOR + "?action=" + shellAction, {
				'parameters': parameters,
			'method': 'post',
			'onCreate': function() {
				var mainResultArea = $(thisObject.elementUniqueID + "_RESULT_STAGE_RESULTS_main");
				var CurrentResultHolder = $(thisObject.elementUniqueID + "_SQL_RESULT_RETURN_THIS_RUN");
				var OldResultHolder = $(thisObject.elementUniqueID + "_SQL_RESULT_RETURN_OLD");
				if($(parameters.pageID) != null) {
					var tempHTML = CurrentResultHolder.innerHTML;
					CurrentResultHolder.update("");
					OldResultHolder.update(tempHTML + OldResultHolder.innerHTML);
					adhocStore = mainResultArea.innerHTML;
					mainResultArea.update("<table width='100%' height='100%' cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr></table>");
					mainResultArea.scrollTop = 0;
				}
			},
			'onSuccess': function(transport) {
				var mainResultArea = $(thisObject.elementUniqueID + "_RESULT_STAGE_RESULTS_main");
				mainResultArea.update(adhocStore);
				var CurrentResultHolder = $(thisObject.elementUniqueID + "_SQL_RESULT_RETURN_THIS_RUN");
				if(CurrentResultHolder != null)	{
					var results = transport.responseJSON;
					if(results != null) {
						if(results.returnCode === false || results.returnCode === "false")
						{
							var errorMessage = "";
							if (typeof(results.returnValue) != "undefined") {
								errorMessage = results.returnValue;
							}
							else if (typeof(results.returnMessage) != "undefined") {
								errorMessage = results.returnMessage;
							}
							else if (typeof(results.message) != "undefined") {
								errorMessage = results.message;
							}
							else {
								errorMessage = "An error occurred, no message was provided.";
							}
							CurrentResultHolder.insert({top:"<table class='adhocErrorTable'><tr><td align='center'>" + errorMessage + "</td></tr></table><hrclass='adhocInnerLine'/>"});
						} else {
							if (parameters["sshMethod"] == "java") {
								var resultText = "<table class='adhocReturnTable'>"
									+"<tr><td width='150px'>Return message</td><td width='3px'>:</td><td>" + results.message + "</td></tr>"
									+"<tr><td width='150px'>Result summary</td><td width='3px'>:</td><td><hr/>";
									results.returnValue.each( function (stmtNode) {
										stmtNode.output = stmtNode.output.replace("\n\r","<br/>");
										stmtNode.output = stmtNode.output.replace("\n","<br/>");
										resultText +="<table class='adhocStmt'>";
										resultText += "<tr><td width='150px'>Command executed</td><td width='3px'>:</td><td>" + stmtNode.command + "</td></tr>";
										resultText += "<tr><td width='150px'>Result output</td><td width='3px'>:</td><td>" + stmtNode.output + "</td></tr>";
										resultText += "</table>";
										resultText +="<hr/>";
									});
									resultText += "</td></tr></table>";
									CurrentResultHolder.insert({top:resultText + "<hr/>"});
							}
							else {
								var resultText = "<table class='adhocReturnTable'>";
								if (results.message != undefined) {
									resultText += "<tr><td width='150px'>Return message</td><td width='3px'>:</td><td>" + results.message + "</td></tr>";
								}
								resultText += "<tr><td colspan='3'>";
								results.returnValue.each( function (stmtNode) {
								stmtNode.output = stmtNode.output.replace("\n\r","<br/>");
								stmtNode.output = stmtNode.output.replace("\n","<br/>");
								resultText +="<hr/><table class='adhocStmt'>";
								resultText += "<tr><td width='120px'>Command executed</td><td width='3px'>:</td><td>" + stmtNode.command + "</td></tr>";
								resultText += "<tr><td width='120px'>Result output</td><td width='3px'>:</td></tr>";
								resultText += "<tr><td colspan='3'>";
								resultText += "<table><tr><td>&nbsp;&nbsp;&nbsp;</td><td>" + stmtNode.output + "</td></tr></table>";
								resultText += "</td></tr></table>";
							});
							resultText += "</td></tr></table>";
							CurrentResultHolder.insert({top:resultText + "<hr/>"});
							
							}
						}
					}
					mainResultArea.scrollTop = 0;
				}
				if(thisObject.parentControlerObject != null)
					thisObject.parentControlerObject.runPostAdhocScript();
				thisObject.AllreadyRunning = false;
			},
			'onFailure': function(transport) {
				var mainResultArea = $(thisObject.elementUniqueID + "_RESULT_STAGE_RESULTS_main");
				mainResultArea.update(adhocStore);
				var CurrentResultHolder = $(thisObject.elementUniqueID + "_SQL_RESULT_RETURN_THIS_RUN");
				if(CurrentResultHolder != null) {
					CurrentResultHolder.insert({top:"" + transport.responseText + "\n<hr/>"});
					mainResultArea.scrollTop = 0;
				}
				thisObject.AllreadyRunning = false;
			},
			'onException': function(transport,exception) {
				var mainResultArea = $(thisObject.elementUniqueID + "_RESULT_STAGE_RESULTS_main");
				mainResultArea.update(adhocStore);
				var CurrentResultHolder = $(thisObject.elementUniqueID + "_SQL_RESULT_RETURN_THIS_RUN");
				if(CurrentResultHolder != null) {
					CurrentResultHolder.insert({top:"exception: " +exception + "\n<hr/>"});
					mainResultArea.scrollTop = 0;
				}
				thisObject.AllreadyRunning = false;
			}
		});
	},
	clearResults: function() {
		this.resultSet=[];
		$(this.elementUniqueID + "_SQL_RESULT_RETURN_THIS_RUN").update("");
		$(this.elementUniqueID + "_SQL_RESULT_RETURN_OLD").update("");
		this.Run_Storage.each(function(key) {
			hash.unset(key);
		});
		//Run_Storage = $H();
		getStage(this.LocalStage).closeAllWindows();
	},

	getOption: function(option) {
		return $(this.elementUniqueID + "_Option" + option).value;
	},

	isOptionChecked: function(option) {
		return $(this.elementUniqueID + "_Option" + option).checked;
	},

	sizeWidth: function(Amount) {
		this.setWidth(Amount);
	},
	
	sizeHeight: function(Amount) {
		this.setHeight(Amount);
	},
	
	setWidth: function(Amount) {
		var offsetAmount = 20;
		var adHocTextContainer = $(this.elementUniqueID + "_SQL_TEXT_CONTAINER");
		var adHocTextArea = $(this.elementUniqueID + "_SQL_TEXT_FRAME");
		var adHocHTMLArea = $(this.elementUniqueID + "_SQL_HTML_FRAME");
		var adHocTopFrame = (this.AdHocLong
							?$(this.elementUniqueID + '_RESULT_STAGE_' + this.elementUniqueID + '_ADHOC_TEXT_WINDOW_' + this.elementUniqueID + '_ADHOC_TEXT_PANEL')
							: $(this.parentStageID + "_" + this.parentWindowID + "_" + this.elementUniqueID + "_ADHOC_TEXT_PANEL")
							);
		if(adHocTopFrame != null && adHocTextArea != null) {
			adHocTextContainer.setStyle({'width' : (parseInt(adHocTopFrame.getWidth())) + "px"});
			adHocTextArea.setStyle({'width' : (parseInt(adHocTopFrame.getWidth())-offsetAmount) + "px"});
			if(adHocHTMLArea != null)
				adHocHTMLArea.setStyle({'width' : (parseInt(adHocTopFrame.getWidth())-offsetAmount) + "px"});
		}
		var adHocEditor = $(this.elementUniqueID + "_SQL_TEXT_FRAME_editor");
		if(adHocTopFrame != null && adHocEditor != null)
			adHocEditor.setStyle({'width' : (parseInt(adHocTopFrame.getWidth())-offsetAmount) + "px"});
	},
	
	setHeight: function(Amount) {
		var offsetAmount = 20;
		var adHocTextContainer = $(this.elementUniqueID + "_SQL_TEXT_CONTAINER");
		var adHocTextArea = $(this.elementUniqueID + "_SQL_TEXT_FRAME");
		var adHocHTMLArea = $(this.elementUniqueID + "_SQL_HTML_FRAME");
		var adHocTopFrame = (this.AdHocLong
							?$(this.elementUniqueID + '_RESULT_STAGE_' + this.elementUniqueID + '_ADHOC_TEXT_WINDOW_' + this.elementUniqueID + '_ADHOC_TEXT_PANEL')
							:$(this.parentStageID + "_" + this.parentWindowID + "_" + this.elementUniqueID + "_ADHOC_TEXT_PANEL")
							);
		if(adHocTopFrame != null && adHocTextArea != null && adHocTextContainer != null) {
			adHocTextContainer.setStyle({'height' : (parseInt(adHocTopFrame.getHeight())) + "px"});
			adHocTextArea.setStyle({'height' : (parseInt(adHocTopFrame.getHeight()) - (offsetAmount)) + "px"});
			if(adHocHTMLArea != null)
				adHocHTMLArea.setStyle({'height' : (parseInt(adHocTopFrame.getHeight()) - (offsetAmount)) + "px"});
		}
		var adHocEditor = $(this.elementUniqueID + "_SQL_TEXT_FRAME_editor");
		if(adHocTopFrame != null && adHocEditor != null)
			adHocEditor.setStyle({'height' : (parseInt(adHocTopFrame.getHeight()) - (offsetAmount)) + "px"});
	},
	
	changeScriptMode: function(scriptMode) {
		this.scriptMode=( scriptMode == null ? "SQL" : scriptMode.toUpperCase() );
		switch (this.scriptMode) {
			case "SHELL":
				$(this.elementUniqueID + "_Explain").hide();
				$(this.elementUniqueID + "_ExportAll").hide();
				$(this.elementUniqueID + '_OptionScriptModeSSH').checked=true;
				$(this.elementUniqueID + "_SQLOptions").hide();
				$(this.elementUniqueID + "_SHELLOptions").show();
				$(this.elementUniqueID + "_OptionCommit").disable();
 				$(this.elementUniqueID + "_OptionTermChar").disable();
				$(this.elementUniqueID + "_OptionRows").disable();
				$(this.elementUniqueID + "_OptionXML").disable();
				$(this.elementUniqueID + "_OptionCLOB").disable();
				$(this.elementUniqueID + "_OptionBLOB").disable();
				$(this.elementUniqueID + "_OptionBDCLOB").disable();
				$(this.elementUniqueID + "_OptionMaxRunTime").enable();
				break;
			case "SQL":
			default:
				this.scriptMode="SQL";
				$(this.elementUniqueID + '_OptionScriptModeSQL').checked=true;
				$(this.elementUniqueID + "_Explain").show();
				$(this.elementUniqueID + "_ExportAll").show();
				$(this.elementUniqueID + "_SQLOptions").show();
				$(this.elementUniqueID + "_SHELLOptions").hide();
				$(this.elementUniqueID + "_OptionCommit").enable();
 				$(this.elementUniqueID + "_OptionTermChar").enable();
				$(this.elementUniqueID + "_OptionRows").enable();
				$(this.elementUniqueID + "_OptionXML").enable();
				$(this.elementUniqueID + "_OptionCLOB").enable();
				$(this.elementUniqueID + "_OptionBLOB").enable();
				$(this.elementUniqueID + "_OptionBDCLOB").enable();
				$(this.elementUniqueID + "_OptionMaxRunTime").disable();
		}
		FLOATINGPANEL_activeFloatingPanels.get(this.elementUniqueID + "_AdhocOptions").size();
	},
	
	buildTableDefinitionFromResultSet: function(stmt, columnsInfo) {
		var columns = "";
		var displayColumns = "";
		for(var i = 0; i < columnsInfo.num; i++) {
			columns += '\t\t<col type="column" name="' + columnsInfo.name[i] + '"/>\n';
			displayColumns += '\t<column name="' + columnsInfo.name[i] + '">\n'
							+ '\t\t<sqlName>' + columnsInfo.name[i] + '</sqlName>\n'
							+ '\t\t<title>' +  formatTitle(columnsInfo.name[i]) + '</title>\n'
							+ '\t\t<type>';
			var match1 = /long varchar|clob|blob|xml/;
			var match2 = /char|string/;
			var match3 = /char|string|date/;
			if(columnsInfo.type[i].toLowerCase().match(match1) != null)
				displayColumns += 'l';
			else if(columnsInfo.type[i].match(match2) != null)
				displayColumns += 's';
			else
				displayColumns += 'n';
			displayColumns += '</type>\n';
			if(columnsInfo.type[i].toLowerCase().match(match3) != null)
				displayColumns += '\t\t<drillEnable/>\n';
			displayColumns += '\t</column>\n';
		}
		return '<table name="Unknown">\n'
			+ '\t<sqlName>Unknown</sqlName>\n'
			+ '\t<singularName>Unknown</singularName>\n'
			+ '\t<pluralName>Unknown</pluralName>\n'
			+ '\t<inlinequery>\n'
			+ '<![CDATA[\n' + stmt + '\n]]>\n'
			+ '\t</inlinequery>\n'
			+ '\t<description>Query from ad hoc</description>\n'
			+ '\t<!-- <orderBy name="acolumn" direction="A"/> -->\n'
			+ '\t<displayColumns>\n'
			+ 	columns
			+ '\t</displayColumns>\n'
			+ displayColumns
			+ '</table>\n'
			;
	},
	
	playResultSet: function(resultSet) {
		if(this.playResultSetTime==null || this.playResultSetTime=="") return;
		if(resultSet==null) {
			if(this.playResultSetActive!=null)
				clearTimeout(this.playResultSetActive);
			resultSet=0;
		}
		if((resultSet+1)>this.resultSet.length) {
			if(!this.playResultSetActive)
				clearTimeout(this.playResultSetActive);
			if(this.parentControlerObject != null)
				if(this.parentControlerObject.setAdhocPlayResultsFinished!=null)
					this.parentControlerObject.setAdhocPlayResultsFinished();
			this.parentPanel.clearLoadIndicator();
			return;
		}
		RaiseToTop(this.LocalStage, 'R'+resultSet);
		this.playResultSetActive=setTimeout(this.callBackText + ".playResultSet("+(resultSet+1)+");", 1000*this.playResultSetTime);
	},
	
	get_specificResultSet: function(RunID,STMTnum, RSTnum) {
		var currentRun = this.Run_Storage.get(RunID);
		if (currentRun != null && currentRun.STMTReturn.length > STMTnum && currentRun.STMTReturn[STMTnum].resultSet.length > RSTnum)
			return currentRun.STMTReturn[STMTnum].resultSet[RSTnum];
		return null;
	}
}));