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
function openModalFileDialog(callingActionStack, parameters)
{
	new modalPanelFileDialog("fileDialogModalPanel_" + getGUID(), false, callingActionStack, parameters);
}
var modalPanelFileDialog = Class.create(modalPanel, {
	initialize: function($super, myID, hideMenuBar, callingActionStack, parameters) {
		var datatype = "URL";
		var datavalue = ACTION_PROCESSOR + "?action=AdHocSQL/AdHocDirectoryList";
		this.minHeight = 300;
		this.minWidth = 600;
		this.maxHeight = this.minHeight;
		this.maxWidth = this.minWidth;
		this.minLeft = 0;
		this.minRight = 0;
		this.contentStyle = "border-width:3px;border-style:groove;border-color:black;";
		this.overflowStyle = "auto";
		$super(myID, datatype, datavalue, hideMenuBar, callingActionStack, parameters);
	},
	fileCallBack: function(fileEncoded) {
		var fileNameHolder = $(this.elementUniqueID + '_input');
		if(fileEncoded != null)
			fileNameHolder.value = decodeURIComponent(fileEncoded);
	},
	subDirectoryLoadCallBack: function(blockID, subDirectory) {
		var imageHolder = $(blockID + '_image');
		var subdirectoryHolder = $(blockID + '_sub');
		this.fileCallBack(subDirectory);
		if(subdirectoryHolder != null)
		{
			if(!subdirectoryHolder.visible())
			{
				if(imageHolder != null)
					imageHolder.src = 'images/folderOpen.gif';
				subdirectoryHolder.show();
				var parameters = new Object();
					parameters.primaryContainer = this.PrimaryContainer;
					parameters.uniqueID = this.elementUniqueID;
					parameters.stageID = this.parentStageID;
				parameters.windowID = this.parentWindowID;
				parameters.panelID = this.elementName;
				parameters.action = "AdHocSQL/AdHocDirectoryList";
				parameters.rootDirectory = subDirectory;
					new Ajax.Request(ACTION_PROCESSOR, {
						'parameters': parameters,
						'method': 'post',
						'onCreate': function() {
								subdirectoryHolder.update( "<img style='float:none;' src='images/loadingpage_small.gif'/>");
						},
						'onSuccess': function(transport) {
							subdirectoryHolder.update( transport.responseText);
						},
						'onFailure': function(transport) {
							subdirectoryHolder.update( transport.responseText);
						},
						'onException': function(transport,exception) {
							subdirectoryHolder.update( exception);
						}
					});
			}
			else
			{
				if(imageHolder != null)
					imageHolder.src = 'images/folderClose.gif';
				subdirectoryHolder.hide();
			}
		}
	},
	modalPanelControls: function () {
		var output = "";
		output +="<table style='position:relitive;'><tr><td><input id='" + this.elementUniqueID + "_input' value='' size='50'/>";
		output +="</td><td><button ";
                if(IS_TOUCH_SYSTEM)
                        output += "style='border-color:#ddd;-webkit-border-radius:5px;padding:5px;margin:5px;background:-webkit-gradient(linear, left top, left bottom, from(#eee), to(#aaa));-webkit-box-shadow: 0 1px 2px rgba(0,0,0,.2);'";
                output += " onClick=\"activeModalPanel.get('" + this.elementUniqueID + "').returnCallOK();\">" + CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.OK + "</button>";
		output +="</td><td><button ";
                if(IS_TOUCH_SYSTEM)
                        output += "style='border-color:#ddd;-webkit-border-radius:5px;padding:5px;margin:5px;background:-webkit-gradient(linear, left top, left bottom, from(#eee), to(#aaa));-webkit-box-shadow: 0 1px 2px rgba(0,0,0,.2);'";
                output += " selected onClick=\"activeModalPanel.get('" + this.elementUniqueID + "').destroy();\">" + CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.CANCEL + "</button></td></tr></table>";
		return output;
	},
	modalPanelLeft: function () {
		return "";
	},
	modalPanelRight: function() {
		return "";
	},
	returnCallOK: function() {
		if(this.CallingActionStack != null)
		{
			try{
					this.CallingActionStack.localVariables.result.returnCode= 'true';
					var checkingExt = $(this.elementUniqueID + '_input').value;
					if ((checkingExt.lastIndexOf(".sql")==(checkingExt.length-4))||(checkingExt.lastIndexOf(".SQL")==(checkingExt.length-4))){
						checkingExt = checkingExt.substr(0,checkingExt.length-4);
					}
					this.CallingActionStack.localVariables.result.returnValue = checkingExt;
			}catch (e){
			}
		}
		this.destroy(false);
	}
});