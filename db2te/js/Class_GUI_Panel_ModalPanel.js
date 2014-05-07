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
var activeModalPanel = $H();
function openModalWindow(data, type, callingActionStack, parameters) {
	if(type == null)
		type = "RAW";
	return new modalPanel("modalPanel_" + getGUID(), type, data, false, callingActionStack, parameters);
}
var modalPanel = Class.create(panel, {
	initialize: function($super, myID, Type, Data, hideMenuBar, callingActionStack, parameters) {
		$super(myID,null, null, false, Type, Data, "", null, parameters);
		activeModalPanel.set(this.elementUniqueID, this);
		this.destroyOnHide = false;
		this.CallingActionStack = callingActionStack;
		if(this.CallingActionStack != null) {
			try{
					this.CallingActionStack.localVariables.result = {
							returnCode: 'false',
							returnValue : ""
						};
			}catch (e){
			}
		}
		this.hideMenuBar = coalesce(hideMenuBar,false);
		this.level = getTopZindex();
		this.visibleFloatingObject = null;
		this.AllowAutoClosingOfFloatingObject = true;
		if(visibleFloatingObject != null) {
			if(visibleFloatingObject.type != "CONTEXTBASE") {
				this.visibleFloatingObject = visibleFloatingObject;
				this.AllowAutoClosingOfFloatingObject = AllowAutoClosingOfFloatingObject;
				visibleFloatingObject = null;
				AllowAutoClosingOfFloatingObject = true;
			}
		}
		this.overflowStyle=coalesce(this.overflowStyle,"hidden");
		this.minLeft=coalesce(this.minLeft,50);
		this.minRight=coalesce(this.minRight,50);
		this.contentStyle=coalesce(this.contentStyle,"");
		this.draw();
	},
	setDestroyOnHide: function(destroyOnHide) {
		this.destroyOnHide = destroyOnHide;
	},
	show_and_size: function() {
		this.size();
	},
	setContent: function(Content, Title, PanelInformation) {
		var panelTitle = $("panelTitle_" + this.elementUniqueID)
			,contentHolder = $(this.elementUniqueID)
			,theDataObjectChildren = [];
		coalesce(PanelInformation == null)
			PanelInformation = "";
		if(Title == null)
			Title = "";
		if(Content != null && contentHolder != null) {
			contentHolder.update(Content);
			theDataObjectChildren = contentHolder.select('div[id="title"]');
			if(theDataObjectChildren.size() > 0)
				Title = theDataObjectChildren[0].innerHTML;
			theDataObjectChildren = contentHolder.select('div[id="panelInformation"]');
			if(theDataObjectChildren.size() > 0)
				PanelInformation = theDataObjectChildren[0].innerHTML;
		}
		Title = Title.replace(/ /g, '&nbsp;');
		if(panelTitle != null) {
			if(PanelInformation != "")
				Title = "<table><tr><td>" + Title + "</td><td><img style='float:none' id='{$pageID}_PageInformationButton' onMouseUp=\"stopPropagation(event);\" onMouseDown='show_GENERAL_BLANK_POPUP(null, decodeURIComponent(\"<NOBR>" + escape(PanelInformation) + "</NOBR>\"));' src=\"images/info.gif\"/></td></tr></table>";
			panelTitle.update(Title);
		}
		this.size();
	},
	modalPanelControls: function () {
		return "";
	},
	modalPanelLeft: function () {
		return "";
	},
	modalPanelRight: function() {
		return "";
	},
	draw: function() {
		this.hideMenuBar = true;
		this.elementUniqueID = this.elementName;
		output  = "<div id='" + this.elementUniqueID + "_modalWindowLayout'>"
				+ 	"<div id='" + this.elementUniqueID + "_modalBackgroundDiv' class='modalPopupTransparent' style='z-index: " + getTopZindex() + ";'> "
				+	"</div>"
				+  	"<div class='modalPopupWindow' id='" + this.elementUniqueID + "_container' style='border-color:#ddd;-webkit-border-radius:5px;-webkit-box-shadow: 0 1px 2px rgba(0,0,0,.2);display:block;background-color:#E1E1E1;overflow:hidden;z-index: " + getTopZindex() + ";'>"
				+  		"<table id='" + this.elementUniqueID + "_content' cellpadding='0' cellspacing='0'>"
				+  			"<tr>"
				+  				"<td>"
				+  					"<table style='width:100%;height:25px;background:-webkit-gradient(linear, left top, left bottom, from(#bbb), to(#eee));' cellpadding='0' cellspacing='0'  class='contextBase'>"
				+  						"<tr>"
				+  							"<td align='left' style='width:0px;padding-left:5px;' id='" + this.elementUniqueID + "_fixedRightMenu'>"
				+  							"</td>"
				+  							"<td align='left'>"
				+								"<div id='panelTitle_" + this.elementUniqueID + "'>"
				+  								"</div>"
				+							"</td>"
				+  							"<td align='right' style='width:0px;' id='" + this.elementUniqueID + "_fixedLeftMenu'>"
				+  							"</td>"
				+  						"</tr>"
				+  					"</table>"
				+  				"</td>"
				+  			"</tr>"
				+  			"<tr>"
				+  				"<td align = 'center'>"
				+  					"<table style='width:100%;height:100%;background-color:white;' cellpadding='5px' cellspacing='0'  class='contextBase'>"
				+  						"<tr><td style='width:" + this.minLeft + "px;'>" + this.modalPanelLeft() 
				+ 							"</td>"
				+							"<td>"
				+ 								"<div id='" + this.elementUniqueID + "_ContentContainer' style='position:static;overflow:" +  this.overflowStyle + ";text-align:left;" + this.contentStyle + "'>"
				+ 									"<form id='" + this.elementUniqueID + "'>"
				+  									"</form>"
				+								"</div>"
				+  							"</td>"
				+							"<td style='width:" + this.minRight + "px;'>" + this.modalPanelRight()
				+ 							"</td>"
				+						"</tr>"
				+  						"<tr>"
				+							"<td></td>"
				+							"<td align='center' style='width:10px;text-align:center;' id='" + this.elementUniqueID + "_fixedCenterMenu'>"
				+ 								this.modalPanelControls()
				+  							"</td>"
				+							"<td></td>"
				+						"</tr>"
				+				  "</table>"
				+ 				"</td>"
				+  			"</tr>"
				+  		"</table>"
				+ 	"</div>"
				+ "</div>";
		$("PageBody").insert(output);
		this.modalWindowContainer = $(this.elementUniqueID + "_container");
		this.modalWindowBackground = $(this.elementUniqueID + "_modalBackgroundDiv");
		this.modalWindowContent = $(this.elementUniqueID + "_ContentContainer");
		var thisObject = this;
		$(this.elementUniqueID).observe('keypress', function(event) {
				if(event.keyCode == Event.KEY_RETURN) {
					thisObject.returnCallOK();
					event.stop();
					return false;
				}
			});
		this.size();
		createContextMenuOnPanelObject(this.elementUniqueID + "_fixedLeftMenu", [ {
				nodeType: "LEAF",
				elementID : "Close",
				elementValue : CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.CLOSE,
				elementAction : (IS_TOUCH_SYSTEM ? "ontouchstart" : "onClick" ) + "=\"activeModalPanel.get('" + this.elementUniqueID + "').destroy();\"",
				elementSubNodes : null,
				elementSubNodeDirection : HORIZONTAL
			} ], HORIZONTAL, this);
		if(this.TYPE == "RAW")
			this.setContent(this.DATA);
		else
			this.reloadPage();
	},
	returnCallOK: function() {
		return;
	},
	sizeWidth: function(Amount) {
		this.size();
	},
	sizeHeight: function(Amount) {
		this.size();
	},
	setWidth: function(Amount) {
		this.size();
	},
	setHeight: function(Amount) {
		this.size();
	},
	destroy: function($super, fillReturn) {
		var thisObject = this;
		try {
			if(this.CallingActionStack != null && coalesce(fillReturn,true) ) {
				if(this.CallingActionStack.localVariables.result==null)
					this.CallingActionStack.localVariables.result.returnValue = [];
				var localFormOptions = $(this.elementUniqueID).serialize(true)
					,keys = Object.keys(localFormOptions);
				keys.each(function(key){
					thisObject.CallingActionStack.localVariables.result.returnValue[key] = localFormOptions[key];
					thisObject.CallingActionStack.localVariables.parameters.set(key, localFormOptions[key]);
					thisObject.CallingActionStack.defaultParameterList.set(key, localFormOptions[key]);
				});
			}
		} catch(e) {}
		this.myParent = null;
		this.nestedObject.each(function(pair) {
				if(pair.value != null)
					pair.value.destroy();
			});
		this.nestedObject = $H();
		Element.remove($(this.elementUniqueID + "_modalWindowLayout"));
		activeModalPanel.unset(this.elementUniqueID);
		if(visibleFloatingObject != null)
			visibleFloatingObject.close();
		visibleFloatingObject = this.visibleFloatingObject;
		AllowAutoClosingOfFloatingObject = this.AllowAutoClosingOfFloatingObject;
		try {
			if(this.CallingActionStack != null)
				GLOBAL_ACTION_TYPE.setReturn(this,this.CallingActionStack);
		} catch(e) {}
		$super();
	},
	size: function() {
		this.modalWindowBackground.show();
		this.modalWindowBackground.setStyle({"width": pageWidth + 'px',"height": pageHeight + 'px', "left":"0px","top":"0px"});
		this.modalWindowContent.setStyle({"width": this.minWidth + "px", "height" : this.minHeight + "px", "overflow":"hidden"});
		var  contentWidth = rangeLimit(this.modalWindowContent.scrollWidth,this.minWidth,this.maxWidth)
			,contentHeight = rangeLimit(this.modalWindowContent.scrollHeight,this.minHeight,this.maxHeight );
		this.modalWindowContent.setStyle({"width": (this.modalWindowContent.scrollWidth) + 'px'});
		this.modalWindowContent.setStyle({"height": (this.modalWindowContent.scrollHeight) + 'px'});
		var containerWidth = this.modalWindowContainer.scrollWidth
			,containerHeight = this.modalWindowContainer.scrollHeight;
		// If the content is bigger than the page size, limit the modal panel's size to the pagesize - (offset + minimum margins)
		if (pageHeight < (MODALPANEL_TOP_MINIMUM_MARGIN + MODALPANEL_BOTTOM_MINIMUM_MARGIN + containerHeight)) {
			this.modalWindowContainer.style.top = MODALPANEL_TOP_MINIMUM_MARGIN + 'px';
			this.modalWindowContent.setStyle({ "height": (contentHeight - ((containerHeight - pageHeight) + (MODALPANEL_TOP_MINIMUM_MARGIN + MODALPANEL_BOTTOM_MINIMUM_MARGIN)) + 15) + 'px', "overflow": "auto" });
		} else {
			this.modalWindowContainer.style.top = ((pageHeight - containerHeight) / 2) + 'px';
			this.modalWindowContent.setStyle({ "height": (contentHeight + 15) + 'px' , "overflow": "auto" });
		}
		if (pageWidth <(MODALPANEL_LEFT_MINIMUM_MARGIN + MODALPANEL_RIGHT_MINIMUM_MARGIN + containerWidth)) {
			this.modalWindowContainer.style.left = MODALPANEL_LEFT_MINIMUM_MARGIN + 'px';
			this.modalWindowContent.setStyle({ "width": (contentWidth - ((containerWidth - pageWidth) + (MODALPANEL_LEFT_MINIMUM_MARGIN + MODALPANEL_RIGHT_MINIMUM_MARGIN))) + 'px', "overflow": "auto" });
		} else {
			this.modalWindowContainer.style.left = ((pageWidth - containerWidth) / 2) + 'px';
			this.modalWindowContent.setStyle({"width": (contentWidth) + 'px', "overflow": "auto" });
		}
	},
	returnCall: function(returnValue) {
		if(this.CallingActionStack != null)
			try {
				this.CallingActionStack.localVariables.result.returnCode= returnValue;
			} catch (e){}
		this.destroy();
	}
});