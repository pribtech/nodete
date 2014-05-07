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
var FLOATINGPANEL_activeFloatingPanels = $H();
var GENERAL_BLANK_POPUP = null;

function show_GENERAL_BLANK_POPUP(title, content, parentTrigger){
	// this general floating panel is created in the index.php file
	GENERAL_BLANK_POPUP = FLOATINGPANEL_activeFloatingPanels.get('GENERAL_BLANK_POPUP');
	GENERAL_BLANK_POPUP.setContent(content, title);
	GENERAL_BLANK_POPUP.show_and_size(parentTrigger);
}

var floatingPanel = Class.create(panel, {
	initialize: function($super, myID, Type, Data, parentTrigger, hideMenuBar, reloadOnConnectionChange, panelHeaders, baseWidth, baseHeight, loadContentOnShow, reloadContentOnShow) {
		this.elementType = "FLOATING_PANEL";
		$super(myID, null, null, false, Type, Data, null, panelHeaders, null);
		this.elementUniqueID = this.elementName;
		FLOATINGPANEL_activeFloatingPanels.set(this.elementUniqueID, this);
		this.parentTrigger = parentTrigger;
		this.destroyOnHide = false;
		
		this.loadContentOnShow = loadContentOnShow == null ? false : loadContentOnShow;
		this.reloadContentOnShow = reloadContentOnShow == null ? false : reloadContentOnShow;
		
		if (reloadOnConnectionChange == true && this.reloadContentOnShow == false) 
			CORE_ReloadOnConnectionChange.set(this.elementUniqueID, this);

		this.hideMenuBar = hideMenuBar == null ? false : hideMenuBar;
		this.refreshTimeOut = -1;
		this.refreshType = "silentReload";
		this.refreshCallback = null;
		this.refreshCallBackTimer = null;
		this.baseWidth = baseWidth == null ? 200 : baseWidth;
		this.baseHeight = baseHeight == null ? 10 : baseHeight;
	},

	setDestroyOnHide: function(destroyOnHide) {
		this.destroyOnHide = destroyOnHide;
	},

	close: function() {
		var localElement = $(this.elementUniqueID + "_Container");
		if (localElement != null)
			localElement.setStyle({ "display": "none" });
		if (this.parentTrigger != null) 
			if (this.destroyOnHide) 
				this.destroy();
		if (visibleFloatingObject == this)
			visibleFloatingObject = null;
		if(this.visibleFloatingObjectParent != null) {
			this.visibleFloatingObjectParent.close();
			this.visibleFloatingObjectParent = null;
		}
	},

	isDisplayed: function() {
		return ($(this.elementUniqueID + "_Container").getStyle("display") == "block");
	},
	
	show_and_size: function(parentTrigger, closeFloating) {
		closeFloating = closeFloating == null ? true : closeFloating;
		if(this.visibleFloatingObjectParent != null) {
			this.visibleFloatingObjectParent.close();
			this.visibleFloatingObjectParent = null;
		}
		if (parentTrigger != null)
			this.parentTrigger = parentTrigger;
		if (this.parentTrigger != null && closeFloating) {
			var CloseFloatingWindowState = true;
			AllowAutoClosingOfFloatingObject = true;
			if (visibleFloatingObject != this) 
				closeOpenFloatingObject();
			AllowAutoClosingOfFloatingObject = CloseFloatingWindowState;
		}
		var localElement = $(this.elementUniqueID + "_Container");
		if (localElement.getStyle("display") != "block") {
			
			//Check to see if we are to load the content on show and if the content is to be reloaded each time
			if (this.TYPE != "RAW" && this.loadContentOnShow) {
				this.loadContentOnShow = false;
				this.reloadPage();
			}
			else if(this.reloadContentOnShow)
				this.reloadPage();
			
			if (this.parentTrigger != null) {
				this.visibleFloatingObjectParent = visibleFloatingObject;
				visibleFloatingObject = this;
			}
			localElement.setStyle({ "display": "block", "zIndex" :getTopZindex()});
		}
		else 
			this.close();
		this.size();
	},
	
	setContent: function(Content, Title, PanelInformation, overflow, LeftMenu) {
		if ($(this.elementUniqueID + "_USERMENU") != null) 
			$(this.elementUniqueID + "_USERMENU").update("");
		var theDataObject = $(this.elementUniqueID);
		if (Content != null && theDataObject != null)
			theDataObject.update(Content);
		if (Title == null && theDataObject != null) {
			try {
				var theDataObjectChildren = theDataObject.select("div[@id='title']");
				if(theDataObjectChildren !=null)
					if (theDataObjectChildren.size() > 0) 
						Title = theDataObjectChildren[0].innerHTML;
			} catch(e){
				if(ENABLE_VERBOSE)
					alert(this.elementUniqueID+' setContent '+e);
			}
		}
		if (Title == null)
			Title = "";
		var panelTitle = $("panelTitle_" + this.elementUniqueID);
		if (panelTitle != null) 
			panelTitle.update(Title);
		var panelMenu = $(this.elementUniqueID + "_USERMENU");
		if (panelMenu != null && LeftMenu != null) {
			if(Object.isArray(LeftMenu))
				createContextMenu(this.elementUniqueID + "_USERMENU", LeftMenu , HORIZONTAL, this.parentStageID, this.parentWindowID, this.elementName);
			else
				panelMenu.update(LeftMenu);
		}
		
		this.size();
	},
	
	draw: function() {
		this.elementUniqueID = this.elementName;
		output = "<div align='center' class='floatingPanel' onMouseUp='stopPropagation(event);' onmouseout='mouseIsOverContextBase=false;' onmouseover='mouseIsOverContextBase=true;' id='" + this.elementUniqueID + "_Container' style='display:none;" + (IS_TOUCH_SYSTEM ? "border-color:#ddd;-webkit-border-radius:5px;-webkit-box-shadow: 0 1px 2px rgba(0,0,0,.2);" : "" )
				+	 "z-index:" + getTopZindex() + ";"
				+ "'>"
				+ "<table cellpadding='0' cellspacing='0' >";
		if (!this.hideMenuBar) 
			output += "<tr>"
					+ 	"<td>"
					+ 		"<table id='" + this.elementUniqueID + "_content' style='height:25px;position:static;' cellpadding='0' cellspacing='0'class='contextRootBase'>"
					+ 			"<tr>"
					+ 				"<td align='left' style='width:10px;' id='" + this.elementUniqueID + "_fixedRightMenu'>"
					+ 					"<span class='contextBaseWindow' style='display:block;position:static;'><ul class='contextBaseULHorizontal'><li onclick='closeContextMenu();' class='contextRootLILink' valign='center'><a onClick=\"FLOATINGPANEL_activeFloatingPanels.get('" + this.elementUniqueID + "').reloadPage();\"><img style='display:inline;float:none;' src='images/icon-link-refresh.gif' style='padding:3px;'/></a></li></ul></span>"
					+ 				"</td>"
					+ 				"<td align='left' style='text-align:left;' id='" + this.elementUniqueID + "_USERMENU'>"
					+ 				"</td>"
					+ 				"<td style='text-align:right;width:10px;' id='" + this.elementUniqueID + "_fixedLeftMenu'>"
					+ 					"<span class='contextBaseWindow' style='display:block;position:static;'><ul class='contextBaseULHorizontal'><li " + (IS_TOUCH_SYSTEM ? "ontouchstart" : "onclick" ) + "='closeContextMenu();' class='contextRootLILink' valign='center'><a onClick=\"FLOATINGPANEL_activeFloatingPanels.get('" + this.elementUniqueID + "').show_and_size();\">" + CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.CLOSE + "</a></li></ul></span>"
					+ 				"</td>"
					+ 			"</tr>"
					+ 		"</table>"
					+  	"</td>"
					+ "</tr>";

		output += "<tr> <td align='center' >"
				+  	"<div id='AddyBar_" + this.elementUniqueID + "' onmouseover=\"setActivePanel('" + this.parentStageID + "','" + this.parentWindowID + "','" + this.elementName + "');\" onMouseDown=\"RaiseToTop('" + this.parentStageID + "','" + this.parentWindowID + "')\" style='display:block;background-color:#9999AA;width:100%;overflow:hidden;' >\n"
				+ 		"<table cellpadding='0' cellspacing='0' style='height:0px;width:100%'>\n"
				+ 			"<tr><td id='panelTitle_" + this.elementUniqueID + "'style='width:100%;'>"
				+ 				"</td><td align=rightstyle='width:0px;' id='panelMenu_" + this.elementUniqueID + "'>\n"
				+ 				"</td><td align=right style='width:0px;' class='pageWindowPageMenu' id='timingMenu_" + this.elementUniqueID + "'>\n";
		if (this.pageHeaders != null) {
			if (this.pageHeaders.refreshEnabled) {
				this.refreshTimeOut = -1;
				var timeVisible = true;
				var timeOptions = [5, 15, 30, 60, 120, 300, 600];
				var countdownVisible = true;
				var displayTimeInfo = "";
				if (this.pageHeaders.autoRefreshControls != null) {
					if (this.pageHeaders.autoRefreshControls.time != null)
						this.refreshTimeOut = this.pageHeaders.autoRefreshControls.time;
					if (this.pageHeaders.autoRefreshControls.timeVisible != null)
						timeVisible = this.pageHeaders.autoRefreshControls.timeVisible;
					if (this.pageHeaders.autoRefreshControls.timeOptions != null)
						timeOptions = this.pageHeaders.autoRefreshControls.timeOptions;
					if (this.pageHeaders.autoRefreshControls.countdownVisible != null)
						countdownVisible = this.pageHeaders.autoRefreshControls.countdownVisible;
				}
				timeOptions.unshift(-1);
				if (timeVisible)
					if (this.pageHeaders.showRefreshControl == true || timeVisible) {
					displayTimeInfo += "<table cellpadding='0' cellspacing='0'><tr>";
					if (timeVisible) {
						displayTimeInfo += "<td>Refresh_Time</td><td><select onchange=\"getPanel('" + this.parentStageID + "','" + this.parentWindowID + "','" + this.elementName + "').updateReloadTime(this.value);\">";
						var timeOptionLength = timeOptions.length;
						for (i = 0; i < timeOptionLength; i++) {
							displayTimeInfo += "<option value=\"" + timeOptions[i] + "\" ";
							if (timeOptions[i] == this.refreshTimeOut) {
								displayTimeInfo += "selected";
								this.updateReloadTime(timeOptions[i]);
							}
							displayTimeInfo += ">";
							if (timeOptions[i] != -1) {
								var timeInMin = Math.floor(timeOptions[i] / 60);
								if (timeInMin != 0)
									displayTimeInfo += timeInMin + "m ";
								displayTimeInfo += (timeOptions[i] % 60) + "s";
							} else 
								displayTimeInfo += "Off";
							displayTimeInfo += "</option>";
						}
						displayTimeInfo += "</selected></td>";
					}
					if (this.pageHeaders.showRefreshControl == true) {
						displayTimeInfo += "<td><button onclick=\"getPanel('" + this.parentStageID + "','" + this.parentWindowID + "','" + this.elementName + "').doReload()\">" + CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.REFRESH + "</button></td>";
					}
					displayTimeInfo += "</tr></table>";
				}
				output += displayTimeInfo;
				this.autoReloadUpdate();
			}
		}
		output += 		"</td></tr>\n"
				+ 	"</table>\n"
				+ "</div>\n"
				+ "<div id='" + this.elementUniqueID + "' style='text-align:left;position:static;overflow:hidden;'>";
		if (this.TYPE == "RAW") 
			output += this.DATA;
		output +=	 			"</div>"
				+ 			"</td>"
				+ 		"</tr>"
				+ 	"</table>"
				+ "</div>";
		$("PageBody").insert(output);
		if (this.TYPE != "RAW" && !this.loadContentOnShow)
			this.reloadPage();
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
	
	destroy: function($super) {
		this.nestedObject.each(function(pair) {
			if (pair.value != null)
				pair.value.destroy();
		});
		this.nestedObject = $H();
		CORE_ReloadOnConnectionChange.unset(this.elementUniqueID);
		FLOATINGPANEL_activeFloatingPanels.unset(this.elementUniqueID);
		if ($(this.elementUniqueID + "_Container") != null)
			$(this.elementUniqueID + "_Container").remove();
		$super();
	},
	
	size: function() {
		var mainContainer = $(this.elementUniqueID + '_Container');
		var titleBar = $(this.elementUniqueID + '_content');
		if (mainContainer == null) 
			return;
		if (mainContainer.getStyle("display") != "block") 
			return;
		var WindowPositionTop = 0;
		var WindowPositionLeft = 0;
		var windowHeight = pageHeight;
		var windowWidth = pageWidth;
		var buttonOffset = 0;
		var buttonWidth = 20;
		var buttonHeight = 20;
		var parentTrigger = (this.parentTrigger == null ? null : $(this.parentTrigger) );
		if (parentTrigger != null) {
			buttonOffset = parentTrigger.cumulativeOffset();
			buttonWidth = parentTrigger.getWidth();
			buttonHeight = parentTrigger.getHeight();
		} else {
			var buttonLeft = CORE_Current_Mouse_X - 10;
			var buttonTop = CORE_Current_Mouse_Y -10;
			buttonOffset = {
				left: buttonLeft,
				top: buttonTop
			};
		}
		var spButtonLeft = buttonOffset.left;
		var spButtonRight = windowWidth - (buttonOffset.left + buttonWidth);
		var spButtonTop = buttonOffset.top;
		var spButtonBottom = windowHeight - (buttonOffset.top + buttonHeight);
		var child = $(this.elementUniqueID);
		child.setStyle({ "width": this.baseWidth + "px", "height": this.baseHeight + "px" });
		var contentWidth = child.scrollWidth;
		var contentHeight = child.scrollHeight;
		child.setStyle({ "width": contentWidth + "px", "height": contentHeight + "px", "overflow":"hidden" });
		if(titleBar != null)
			titleBar.setStyle({"width": contentWidth + "px"});
		mainContainer.setStyle({ "width": this.baseWidth + "px", "height": this.baseHeight + "px" });
		var containerWidth = mainContainer.scrollWidth;
		var containerHeight = mainContainer.scrollHeight;
		mainContainer.setStyle({ "width": containerWidth + "px", "height": containerHeight + "px" });
		var containerWidthExtra = containerWidth - contentWidth;
				containerWidthExtra = containerWidthExtra < 0 ? 0 : containerWidthExtra;
		var containerHeightExtra = containerHeight - contentHeight;
				containerHeightExtra = containerHeightExtra < 0 ? 0 : containerHeightExtra;
		// The Content can fit below the trigger
		if (containerWidth < windowWidth && containerHeight < spButtonBottom && this.visibleFloatingObjectParent == null) {
			if ((windowWidth - buttonOffset.left) > contentWidth) 
				WindowPositionLeft = buttonOffset.left;
			else if ((buttonOffset.left) > contentWidth) 
				WindowPositionLeft = (buttonOffset.left) - contentWidth;
			else 
				WindowPositionLeft = (buttonOffset.left) - contentWidth / 2;
			if (WindowPositionLeft < 0)
				WindowPositionLeft = 0;
			mainContainer.setStyle({ "top": (buttonOffset.top + buttonHeight) + "px", "left": WindowPositionLeft + "px" });
		}
		// The Content can fit above the trigger
		else if (containerWidth < windowWidth && containerHeight < spButtonTop && this.visibleFloatingObjectParent == null) {
			if ((windowWidth - buttonOffset.left) > contentWidth) 
				WindowPositionLeft = buttonOffset.left;
			else if ((buttonOffset.left) > contentWidth) 
				WindowPositionLeft = (buttonOffset.left) - contentWidth;
			else 
				WindowPositionLeft = (buttonOffset.left) - contentWidth / 2;
			if (WindowPositionLeft < 0)
				WindowPositionLeft = 0;
			mainContainer.setStyle({ "top": (spButtonTop - containerHeight) + "px", "left": WindowPositionLeft + "px" });
		}
		// The Content can fit to the right of the trigger
		else if (containerWidth < spButtonRight && containerHeight < windowHeight) {
			if ((windowHeight - buttonOffset.top) > contentHeight)
				WindowPositionTop = buttonOffset.top;
			else if ((buttonOffset.top) > contentHeight)
				WindowPositionTop = (buttonOffset.top) - contentHeight;
			else 
				WindowPositionTop = (buttonOffset.top) - contentHeight / 2;
			if (WindowPositionTop < 0)
				WindowPositionTop = 0;
			mainContainer.setStyle({ "top": WindowPositionTop + "px", "left": (buttonOffset.left + buttonWidth) + "px" });
		}
		// The Content can fit to the left of the trigger
		else if (containerWidth < spButtonLeft && containerHeight < windowHeight) {
			if ((windowHeight - buttonOffset.top) > contentHeight)
				WindowPositionTop = buttonOffset.top;
			else if ((buttonOffset.top) > contentHeight) 
				WindowPositionTop = (buttonOffset.top) - contentHeight;
			else 
				WindowPositionTop = (buttonOffset.top) - contentHeight / 2;
			if (WindowPositionTop < 0)
				WindowPositionTop = 0;
			mainContainer.setStyle({ "top": WindowPositionTop + "px", "left": (spButtonLeft - containerWidth) + "px" });
		} else if (containerWidth < spButtonRight) {
			if (WindowPositionTop < 0)
				WindowPositionTop = 0;
			child.setStyle({ "overflow":"scroll", "width": contentWidth + "px", "height": (windowHeight - containerHeightExtra) + "px" });
			mainContainer.setStyle({ "width": (contentWidth + containerWidthExtra) + "px", "height": windowHeight + "px", "top": "0px", "left": (buttonOffset.left + buttonWidth) + "px" });
			if(titleBar != null)
				titleBar.setStyle({"width": contentWidth + "px"});
		} else if (containerWidth< spButtonLeft) {
			child.setStyle({ "overflow":"scroll", "width": contentWidth + "px", "height": (windowHeight - containerHeightExtra) + "px" });
			mainContainer.setStyle({ "width": containerWidth + "px", "height": windowHeight + "px", "top": "0px", "left": (spButtonLeft - contentWidth) + "px" });
			if(titleBar != null)
				titleBar.setStyle({"width": contentWidth + "px"});
		} else if (containerWidth < windowWidth) {
			if (spButtonTop > spButtonBottom) {
				child.setStyle({ "overflow":"scroll", "width": contentWidth + "px", "height": (spButtonTop -containerHeightExtra) + "px" });
				mainContainer.setStyle({ "width": containerWidth + "px", "height": spButtonTop + "px", "top": "0px", "left": ((windowWidth-containerWidth)/2) + "px" });
				if(titleBar != null)
					titleBar.setStyle({"width": contentWidth + "px"});
			} else {
				child.setStyle({ "overflow":"scroll", "width": contentWidth + "px", "height": (spButtonBottom - containerHeightExtra) + "px" });
				mainContainer.setStyle({ "width": containerWidth + "px", "height": spButtonBottom + "px", "top": (buttonOffset.top + buttonHeight) + "px", "left": "0px" });
				if(titleBar != null)
					titleBar.setStyle({"width": contentWidth + "px"});
			}
		} else if (spButtonTop > spButtonBottom) {
				child.setStyle({ "overflow":"scroll", "width": (windowWidth-containerWidthExtra) + "px", "height": (spButtonTop - containerHeightExtra) + "px" });
				mainContainer.setStyle({ "width": windowWidth + "px", "height": spButtonTop + "px", "top": "0px", "left": "0px" });
				if(titleBar != null)
					titleBar.setStyle({"width": windowWidth + "px"});
		} else {
			child.setStyle({ "overflow":"scroll", "width": (windowWidth - containerWidthExtra) + "px", "height": (spButtonBottom - containerHeightExtra) + "px" });
			mainContainer.setStyle({ "width": windowWidth + "px", "height": spButtonBottom + "px", "top": (buttonOffset.top + buttonHeight) + "px", "left": "0px" });
			if(titleBar != null)
				titleBar.setStyle({"width": contentWidth + "px"});
		}
	}
});
