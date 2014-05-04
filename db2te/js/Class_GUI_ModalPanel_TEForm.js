/*******************************************************************************
 * Author: Matthew Vandenbussche
 * 
 *Copyright IBM Corp. 2010 All rights reserved.
 *
 * Modified by: Peter Prib,  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2012 All rights reserved.
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
function openModalForm(data, type, callingActionStack, parameters) {
	if(type == null)
		type = "RAW";
	new modalPanelForm("alertModalPanel_" + getGUID(), type, data, false, callingActionStack, parameters);
}

var modalPanelForm = Class.create(modalPanel, {
	initialize: function($super, myID, Type, Data, hideMenuBar, callingActionStack, parameters) {
		this.buttonA = Object.isString(parameters['buttonOK']) ? parameters['buttonOK'] : (Object.isString(parameters['buttonA']) ? parameters['buttonA'] : CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.OK);
		this.buttonB = Object.isString(parameters['buttonCancel']) ? parameters['buttonCancel'] : (Object.isString(parameters['buttonB']) ? parameters['buttonB'] : CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.CANCEL);
		this.exitScript = parameters['exitScript'];
		this.exitScript=(this.exitScript == null)?"":"try {"+this.exitScript+";} catch (e) {alert(e); return;};";
		if(parameters != null) {
			var OtherButtons = $H();
			var tempHash = new Hash(parameters);
			tempHash.each(function(item) {
				if(item.key.substring(0,7).toLowerCase() == "button_")
					OtherButtons.set(item.key.substring(7), item.value);
			});
			this.OtherButtons = OtherButtons;
		}
		this.minLeft = 0;
		this.minRight = 0;
		$super(myID, Type, Data, hideMenuBar, callingActionStack, parameters);
	},
	
	modalPanelControls: function () {
		var elementUniqueID=this.elementUniqueID;
		var exitScript=this.exitScript;
		//above is required otherwise loses addressablity 
		var output = "<table align='right' style='width:100%;position:static;'><tr><td></td>"
				+ "<td style='text-align:right;width:5px'><button "
                + (IS_TOUCH_SYSTEM ? "style='border-color:#ddd;-webkit-border-radius:5px;padding:5px;margin:5px;background:-webkit-gradient(linear, left top, left bottom, from(#eee), to(#aaa));-webkit-box-shadow: 0 1px 2px rgba(0,0,0,.2);'" : "")
                + " onClick=\""+exitScript+"activeModalPanel.get('" + elementUniqueID + "').returnCallOK();\">" + this.buttonA.replace(/ /g, '&nbsp;') + "</button></td>";
		if(this.OtherButtons != null) {
			this.OtherButtons.each(function(item) {
				output += "<td style='text-align:right;width:5px'><button  "
	                	+( IS_TOUCH_SYSTEM ? "style='border-color:#ddd;-webkit-border-radius:5px;padding:5px;margin:5px;background:-webkit-gradient(linear, left top, left bottom, from(#eee), to(#aaa));-webkit-box-shadow: 0 1px 2px rgba(0,0,0,.2);'" : "")
                		+ " onClick=\""+exitScript+"activeModalPanel.get('" + elementUniqueID + "').returnCall('" + item.key + "');\">" + item.value.replace(/ /g, '&nbsp;') +"</button></td>";
			});
		}
		output += "<td style='text-align:right;width:5px'><button "
				+ (IS_TOUCH_SYSTEM ? "style='border-color:#ddd;-webkit-border-radius:5px;padding:5px;margin:5px;background:-webkit-gradient(linear, left top, left bottom, from(#eee), to(#aaa));-webkit-box-shadow: 0 1px 2px rgba(0,0,0,.2);'" : "")
                + " selected onClick=\"activeModalPanel.get('" + elementUniqueID + "').destroy();\">" + this.buttonB.replace(/ /g, '&nbsp;') + "</button></td>"
				+ "</tr></table>";
		return output;
	},
	setOKaction: function(aObject,aFunction) {
		this.OKaction=aFunction;
		this.OKactionObject=aObject;
		return this.returnCallTrue;
	},
	returnCallOK: function() {
		if (this.OKaction!=undefined)
			try {
				var asyncResponse=this.OKaction.apply(this.OKactionObject,[]);
			} catch (e) {
				alert('Error in specified ok return action :'+e);
			}
		if(asyncResponse!=null)
			if(asyncResponse)
				return;
		this.returnCallTrue();
	},
	returnCallTrue: function() {
		this.returnCall('true');
	},
	returnCall: function($super,value) {
		var inputList = $(this.elementUniqueID).getElementsByTagName('input');
		if (inputList!=null) 
			for (var i=0;i<inputList.length;i++) {
				if (inputList[i].name==null) continue;
				if (inputList[i].name=='') continue;
				this.CallingActionStack.localVariables[inputList[i].name]= inputList[i].value;
			}
		$super(value);
	}	
});