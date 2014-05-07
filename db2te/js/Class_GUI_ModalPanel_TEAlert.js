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
function openModalAlert(data, type, callingActionStack, parameters) {
	if(type == null)
		type = "RAW";
	new modalPanelAlert("alertModalPanel_" + getGUID(), type, data, false, callingActionStack, parameters);
}
var modalPanelAlert = Class.create(modalPanel, {
	initialize: function($super, myID, Type, Data, hideMenuBar, callingActionStack, parameters) {
		$super(myID, Type, Data, hideMenuBar, callingActionStack, parameters);
	},
	modalPanelControls: function () {
		var output = "";
		output +="<button ";
		if(IS_TOUCH_SYSTEM)
			output += "style='border-color:#ddd;-webkit-border-radius:5px;padding:5px;margin:5px;background:-webkit-gradient(linear, left top, left bottom, from(#eee), to(#aaa));-webkit-box-shadow: 0 1px 2px rgba(0,0,0,.2);'";
		output += "onClick=\" activeModalPanel.get('" + this.elementUniqueID + "').returnCall('true');\">" + CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.OK + "</button>";
		return output;
	},
	modalPanelLeft: function () {
		return "<img src='" + IMAGE_BASE_DIRECTORY + "/alert_big.png'>";
	},
	modalPanelRight: function() {
		return "";
	}
});