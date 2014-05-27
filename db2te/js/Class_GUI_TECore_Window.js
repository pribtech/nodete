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
var pageWindow = Class.create(basePageElement, {
	initialize: function($super, myID, windowType, pageLayout) {
		$super(myID, "WINDOW");
		this.windowType = windowType;
		if(Object.isString(this.windowType))
			this.windowType = eval(this.windowType);	
		this.positionType = "absolute";
		this.title = "No Title";
		/* Window Title Types
		* 0 - no title bar
		* 1 - Window Controls outside of title
		* 2 - Window Controls inside of title
		*****************/
		this.titleBarType = 0;
		/* Window Navigation Types (Add the numbers to get all the controls you want)
		* 0 - no Navigation bar
		* 1 - back button
		* 2 - forward button
		* 4 - reload
		* 8 - address bar
		*****************/
		this.windowOptionType = 0;
		/* Window Control Types (Add the numbers to get all the controls you want)
		* 1 - Question Menu // not avalible at this time
		* 2 - Minimize
		* 4 - Hide
		* 8 - Close
		*****************/
		this.windowControlTypes = 0;
		/* Window Sizing Options
		* 1 - Window IS Sizable
		* 2 - Window IS Fixed
		* 3 - Window Clings To It Container
		*****************/
		this.sizable = 0;
		this.top = 0;
		this.left = 0;
		this.width = 800;
		this.height = 600;
		this.container = null;
		this.activePanel = null;
		this.PrimaryContainerName = "";
		this.WindowContainers = $H();
		this.PanelsLoading = $H();
		this.WindowConfiguration = "";
		this.backURLHist = [];
		this.forwardURLHist = [];
		this.parentStageID = null;
		this.pageHeaders = null;
		//These are use to control sizing and information when a window is minimized.
		this.DisableSizing = false;
		this.tempHeight = 0;
		this.refreshTimeOut = -1;
		this.windowFinal = false;
		if(pageLayout!=null)
			this.setPageLayout(pageLayout);
	},
	setPageLayout: function(pageLayout) {
		for(attribute in pageLayout) {
			switch (typeof pageLayout[attribute]) {
				case "string":
					if(pageLayout[attribute]=="") continue;
					switch (typeof this[attribute]) {
						case "string":
							break;
						case "number":
							this[attribute]=eval(pageLayout[attribute]);
							continue;
						case "boolean":
							this[attribute]=pageLayout[attribute].toLowerCase()=="ẗrue";
							continue;
						default:
							continue;
					}
				case "boolean":
				case "number":
					this[attribute] = pageLayout[attribute] ;
					continue;
			}
		}
	},
	resizeStart: function() {
		if(this.container == null) return;
		this.container.resizeStart();
	},
	resizeEnd: function() {
		if(this.container == null) return;
		this.container.resizeEnd();
	},
	sizeWidth: function(Amount) {
		if (this.DisableSizing || this.theObjectIsDead)
			return;
		if ($("Content_" + this.elementUniqueID) != null)
			this.width = $("Content_" + this.elementUniqueID).getWidth();
		this.width += Amount;
		if (this.sizable != WINDOW_IS_SIZABLE) return;
		if (this.container != null) 
			this.container.setWidth(this.width);
		else 
			this.width = ((this.width > 200) ? this.width : 200);
	},
	sizeHeight: function(Amount) {
		if (this.DisableSizing || this.theObjectIsDead)
			return;
		this.height += Amount;
		if (this.sizable != WINDOW_IS_SIZABLE) return;
		if (this.container != null) {
			var titleOffset = 0;
			var navHeight = $("WindowNavigation_" + this.elementUniqueID);
			if (navHeight != null)
				if (navHeight.visible())
					titleOffset = navHeight.getHeight();
			this.container.setHeight(newHeight - titleOffset);
		} else
			this.height = ((this.height > 50) ? this.height : 50);
	},
	setWidth: function(Value) {
		if (this.DisableSizing || this.theObjectIsDead)
			return;
		this.width = Value;
		if (this.container != null)
			 this.container.setWidth(this.width);
		else 
			this.width = ((this.width > 200) ? this.width : 200);
	},
	setHeight: function(Value) {
		if (this.DisableSizing || this.theObjectIsDead)
			return;
		this.height = Value;
		if (this.container != null) {
			var titleOffset = 0;
			var navHeight = $("WindowNavigation_" + this.elementUniqueID);
			if (navHeight != null)
				if (navHeight.visible())
					titleOffset = navHeight.getHeight();
			this.container.setHeight(Value - titleOffset)
		} else
			this.height = ((this.height > 50) ? this.height : 50);
	},
	setBodyStyle: function(style) { $("Body_" + this.elementUniqueID).setStyle(style); },
	moveLeft: function(Amount) {
		this.left += Amount;
		if ($(this.elementName) != null) {
			if ((pageWidth - 60) >= this.left && this.left >= (60 - this.width)) 
				this.setBodyStyle({ 'left': this.left + "px" });
			else if (this.left < (60 - this.width))
				this.setBodyStyle({ 'left': (60 - this.width) + "px" });
			else 
				this.setBodyStyle({ 'left': (pageWidth - 60) + "px" });
		}
		if (this.container != null)
			this.container.moveLeft(Amount);
		var buttonOffset = $("Content_" + this.elementUniqueID).cumulativeOffset();
		var paintItBlack = $(this.elementUniqueID + "_paintItBlack");
		if (paintItBlack != null)
			paintItBlack.setStyle({ "left": buttonOffset.left + "px",
								"top": buttonOffset.top + "px"
								});
	},
	moveTop: function(Amount) {
		this.top += Amount;
		if ($(this.elementName) != null) {
			if ((pageHeight - 20) >= this.top && this.top >= 0)
				this.setBodyStyle({ 'top': this.top + "px" });
			else if (this.top < 0)
				this.setBodyStyle({ 'top': 0 + "px" });
			else
				this.setBodyStyle({ 'top': (pageHeight - 20) + "px" });
		}
		if (this.container != null)
		this.container.moveTop(Amount);
		var buttonOffset = $("Content_" + this.elementUniqueID).cumulativeOffset();
		var paintItBlack = $(this.elementUniqueID + "_paintItBlack");
		if (paintItBlack != null) {
			paintItBlack.setStyle({ "left": buttonOffset.left + "px",
			"top": buttonOffset.top + "px"
			});
		}
	},
	WindowSizeLeft: function() {
		if ($(this.elementName) == null)
			return;
		if (this.left < (60 - this.width)) {
			this.setBodyStyle({ 'left': (60 - this.width) + "px" });
			this.left = (60 - this.width);
		} else if ((pageWidth - 60) < this.left) {
			this.setBodyStyle({ 'left': (pageWidth - 60) + "px" });
			this.left = (pageWidth - 60);
		}
	},
	WindowSizeTop: function() {
		if ($(this.elementName) == null)
			return;
		if (this.top < 0) {
			this.setBodyStyle({ 'top': 0 + "px" });
			this.top = 0;
		} else if ((pageHeight - 20) < this.top) {
			this.setBodyStyle({ 'top': (pageHeight - 20) + "px" });
			this.top = (pageHeight - 20);
		}
	},
	showHideWindow: function() {
		if (!this.DisableSizing) {
			var titleOffset = 0;
			var navWindow = $("WindowNavigation_" + this.elementUniqueID);
			if (navWindow != null)
				titleOffset = navWindow.getHeight();
			this.tempHeight = this.height + titleOffset;
			this.setHeight(0);
			this.DisableSizing = true;
		} else {
			this.DisableSizing = false;
			this.setHeight(this.tempHeight);
			this.tempHeight = 0;
		}
	},
	showHideContents: function() {
		toggleShowHide("Content_" + this.elementUniqueID);
	},
	attnReq: function() {
	},
	setZ: function(Z) {
		$(this.elementName).setStyle({ "zIndex": Z });
	},
	destroy: function($super) {
		this.theObjectIsDead = true;
		if (this.container != null)
			this.container.destroy();
		this.container = null;
		var thisPage = $('Body_' + this.elementUniqueID);
		if (getStage(this.parentStageID) != null) {
			getStage(this.parentStageID).closeTaskBar(this);
			if (getStage(this.parentStageID).ActiveWindow.windowID == this.elementName && thisPage != null) {
				var Siblings = thisPage.nextSiblings();
				if (Siblings[0] != null)
					Siblings[0].show();
				else {
					Siblings = thisPage.previousSiblings();
					if (Siblings[0] != null)
						Siblings[0].show();
				}
			}
		}
		if (thisPage != null)
			thisPage.remove();
		$super();
	},
	showIn: function(WindowContainerID, positionType) {
		this.parentStageID = WindowContainerID;
		this.positionType = positionType;
		this.elementUniqueID = this.parentStageID + '_' + this.elementName;
		var windowStage = getStage(this.parentStageID);
		if(this.titleBarType		==0	) this.titleBarType = windowStage.titleBarType;
		if(this.windowOptionType	==0	) this.windowOptionType = windowStage.windowOptionType;
		if(this.windowControlTypes	==0	) this.windowControlTypes = windowStage.windowControlTypes;
		if(this.sizable				==0	) this.sizable = windowStage.sizable;
		//Register The Window In the Global Window Directory
		windowStage.PageWindows.set(this.elementName, this);
		if (this.positionType == "static") {
			this.left = 0;
			this.top = 0;
		}
		var pageToAdd = new Element('div', { 'id': "Body_" + this.elementUniqueID,
									'class': 'fixedPageWindow',
									'style': "display:block; position:" + this.positionType + "; z-index:104; width:500px; height:500px; left:" + this.left + "px; top:" + this.top + "px",
									'onMouseDown': "RaiseToTop('" + this.parentStageID + "','" + this.elementName + "')"
									});
		var buildWindowHTML = "<table id=\"TitleBar_" + this.elementUniqueID + "\" onMouseDown=\"RaiseToTop('" + this.parentStageID + "','" + this.elementName + "')\" cellpadding=\"0\" cellspacing=\"0\"><tbody>";
		//-------------------Top Menu Bar
		if (this.titleBarType != NO_TITLE_BAR) {
			buildWindowHTML += ( this.sizable == WINDOW_IS_SIZABLE ?"<tr><td></td><td>" : "<tr><td>" )
							+	"<table id=\"TitleBar_" + this.elementUniqueID + "\" cellpadding=\"0\" style=\"width:100%;position:relitive;\" cellspacing=\"0\">"
							+ 		"<tr>"
			//--------------Title Bar
							+		"<td id=\"Title_" + this.elementUniqueID + "\" class='TitleBarElements' onMousedown=\"RaiseToTop('" + this.parentStageID + "','" + this.elementName + "');RegDown('" + this.parentStageID + "','" + this.elementName + "', event)\"\">" 
							+			"<table style=\"width:100%;position:relitive;\" cellpadding=\"0\" cellspacing=\"0\">"
							+	"<tr>"
							+		"<td width=\"5px\">"
							+			"<img id=\"MenuBarTitleLeft_" + this.elementUniqueID + "\" src=\"images/Lefttitlebar.gif\"/>" 
							+		"</td>"
							+		"<td id=\"BarTitle_" + this.elementUniqueID + "\" class=\"TitleBar_Title\"style=\"background-image:url('images/titlebar.gif');\">"
							+	"<div style=\"position:static; height:20; overflow:hidden;\">";
			if (this.titleBarType == WINDOW_CONTROLS_INSIDE_OF_TITLE)
				buildWindowHTML +=	"<table style=\"width:100%;position:relitive;\" cellpadding=\"0\" cellspacing=\"0\">"
								+	"<tr>"
								+		"<td>";
			buildWindowHTML += 				"<b id=\"WindowTitle_" + this.elementUniqueID + "\"> " + this.title + "</b>";
			if (this.titleBarType == WINDOW_CONTROLS_INSIDE_OF_TITLE)
				buildWindowHTML += 			"</td>";
			else 
				buildWindowHTML += 		"</div>" 
								+	"</td>" 
								+	"<td width=\"5px\">" 
								+	"<img id=\"BarTitleRight_" + this.elementUniqueID + "\" src=\"images/righttitlebar.gif\"/>" 
								+	"</td>" 
								+	"</tr>" 
								+	"</table>" 
								+	"<div style=\"position:static; width:100%; height:100%; left:0px; top:0px; \"></div>" 
								+	"</td>";
			if ((this.windowControlTypes & TITLE_BAR_HIDE_BUTTON) != 0)
				buildWindowHTML += "<td align='right' valign='top' style='width:5px;' class='TitleBarElements'>" + this.GetTitleBarAction('hide', false, false) + "</td>";
			if ((this.windowControlTypes & TITLE_BAR_CLOSE_BUTTON) != 0 && this.windowType != CAN_NOT_CLOSE)
				buildWindowHTML += "<td align='right' valign='top' style='width:5px;' class='TitleBarElements'>" + this.GetTitleBarAction('close', false, false) + "</td>";
			if (this.titleBarType == WINDOW_CONTROLS_INSIDE_OF_TITLE)
				buildWindowHTML += 					"</tr>"
								+				"</table>"
								+				"</div>"
								+			"</td>"
								+			"<td width=\"5px\">"
								+				"<img id=\"BarTitleRight_" + this.elementUniqueID + "\" src=\"images/righttitlebar.gif\"/>"
								+			"</td>"
								+		"</tr>"
								+	"</table>"
								+	"</td>";
			buildWindowHTML += "</tr>"
							+ "</table>";
			if (this.sizable == WINDOW_IS_SIZABLE)
				buildWindowHTML += "</td><td>";
			buildWindowHTML += "</td></tr>";
		}
		buildWindowHTML += "<tr>";
		if (this.sizable == WINDOW_IS_SIZABLE)
			buildWindowHTML += "<td class=\"ContentWindowLeft\" ><divstyle=\"position:static;height:100%;\"></td>";
		buildWindowHTML += "<td id=\"WindowNavigation_" + this.elementUniqueID + "\"";
		if (this.windowOptionType != NO_TITLE_BAR_OPTIONS && (this.windowOptionType & TAB_PERSISTENCE_FLAG != 0))
			buildWindowHTML += " style=\"display:block;\" ";
		else
			buildWindowHTML += " style=\"display:none;\" ";
		
		buildWindowHTML += ">"
						+ "<table class=\"WindowNavigation\" onMouseDown=\"RaiseToTop('" + this.parentStageID + "','" + this.elementName + "')\" cellpadding=\"0\" cellspacing=\"0\" >"
						+	 "<tr valign='top'>";
		if (this.windowOptionType != NO_TITLE_BAR_OPTIONS && this.windowOptionType != TAB_PERSISTENCE_FLAG) {
			buildWindowHTML += "<td align='left' class='pageWindowNavHolder'><table cellpadding=\"0\" cellspacing=\"0\"><tr>";
			if ((this.windowOptionType & NAV_BACK_BUTTON) != 0)
				buildWindowHTML += "<td><img class='pageWindowNav' id=\"BWNavButton_" + this.elementUniqueID + "\" onclick=\"" + this.callBackText + ".historyGoBack();\" src=\"images/windownav/BWArrow_inActive" + (IS_TOUCH_SYSTEM ? "_touch" : "" ) + ".gif\"/></td>";
			if ((this.windowOptionType & NAV_FORWARD_BUTTON) != 0)
				buildWindowHTML += "<td><img class='pageWindowNav' id=\"FWNavButton_" + this.elementUniqueID + "\" onclick=\"" + this.callBackText + ".historyGoForward();\" src=\"images/windownav/FWArrow_inActive" + (IS_TOUCH_SYSTEM ? "_touch" : "" ) + ".gif\"/></td>";
			if ((this.windowOptionType & NAV_RELOAD_BUTTON) != 0)
				buildWindowHTML += "<td><img class='pageWindowNav' id=\"ReloadNavButton_" + this.elementUniqueID + "\" onclick=\"" + this.callBackText + ".reloadPage();\" src=\"images/windownav/refresh_active" + (IS_TOUCH_SYSTEM ? "_touch" : "" ) + ".gif\"/></td>";
			buildWindowHTML += "</tr></table></td>";
		}
		buildWindowHTML +=	"<td class='windowInternalLoadingInfo' id='internalWindowLoadingInfo_" + this.elementUniqueID + "' style='vertical-align:middle;width:1px;'>"
						+	"</td>"
						+	"<td class='windowInternalTitleBar' style='width:100%;vertical-align:middle;'><NOBR><b id='internalWindowTitleBar_" + this.elementUniqueID + "'></b></NOBR>"
						+ 	"</td>"
						+	"<td class='windowRightInformaitonBar' id='rightInformationBar_" + this.elementUniqueID 
						+	"' align='right' class='pageWindowPageMenu' style='vertical-align:middle;text-align:right;'>"
						+	"</td>"
						+	"<td class='windowRightInformaitonMenu' id='rightInformationMenu_" + this.elementUniqueID + "' align='right' class='pageWindowPageMenu' style='vertical-align:middle;text-align:right;'>"
						+	"</td>"
						+	"</tr>"
						+	"</table>";
		if (this.sizable == WINDOW_IS_SIZABLE)
			buildWindowHTML += "</td><td class=\"ContentWindowRight\" onMouseDown=\"RaiseToTop('" + this.parentStageID + "','" + this.elementName + "');WindowSize('" + this.parentStageID + "','" + this.elementName + "', true, false, event)\"><divclass=\"ContentWindowRight\" style=\"position:static; height:100%;\">.</div>";
		buildWindowHTML += "</td></tr>";
		//-------------------------Content
		if (this.sizable == WINDOW_IS_SIZABLE)
			buildWindowHTML += "<tr><td class=\"ContentWindowLeft\" ><divstyle=\"position:static;height:100%;\"/></td><td id=\"Content_" + this.elementUniqueID + "\">";
		else
			buildWindowHTML += "<tr><td id=\"Content_" + this.elementUniqueID + "\" valign='top'>"; //<div>";
		if (this.container != null) {
			this.container.setSize(this.width, this.height);
			buildWindowHTML += this.container.draw();
		}
		if (this.sizable == WINDOW_IS_SIZABLE)
			buildWindowHTML += "</td><td class=\"ContentWindowRight\" onMouseDown=\"RaiseToTop('" + this.parentStageID + "','" + this.elementName + "');WindowSize('" + this.parentStageID + "','" + this.elementName + "', true, false, event)\"><div style=\"position:static; height:100%;\"></td></tr>" 
							+	 "<tr><td><div class=\"ContentWindowBottomLeft\"style=\"position:static;\"></td><td onMouseDown=\"RaiseToTop('" + this.parentStageID + "','" + this.elementName + "');WindowSize('" + this.parentStageID + "','" + this.elementName + "', false, true, event)\"><div class=\"ContentWindowBottom\" style=\"position:static; width:100%;\"/></td><td onMouseDown=\"RaiseToTop('" + this.parentStageID + "','" + this.elementName + "');WindowSize('" + this.parentStageID + "','" + this.elementName + "', true, true, event)\"><div class=\"ContentWindowBottomRight\"style=\"position:static;\"/>";
		buildWindowHTML += "</td></tr>"
						+	"</tbody></table>";
		pageToAdd.insert(buildWindowHTML);
		getStage(this.parentStageID).addTaskBar(this.elementName, this.elementUniqueID, this.title, this.windowType);
		$(WindowContainerID + '_ContentWindow').insert(pageToAdd);
		if (this.titleBarType > 0) {
			this.moveLeft(200);
			this.moveTop(200);
		}
		
		//register button down and rollover actions
		if (this.windowOptionType != NO_TITLE_BAR_OPTIONS && this.windowOptionType != TAB_PERSISTENCE_FLAG) {
			if ((this.windowOptionType & NAV_BACK_BUTTON) != 0)
				buttonSupport_registerButton("BWNavButton_" + this.elementUniqueID);
			if ((this.windowOptionType & NAV_FORWARD_BUTTON) != 0)
				buttonSupport_registerButton("FWNavButton_" + this.elementUniqueID);
			if ((this.windowOptionType & NAV_RELOAD_BUTTON) != 0)
				buttonSupport_registerButton("ReloadNavButton_" + this.elementUniqueID);
		}
		
		RaiseToTop(this.parentStageID, this.elementName);
	},
	draw: function() {
		if (this.container != null && $("Content_" + this.elementUniqueID) != null) {
			this.container.setSize(this.width, this.height);
			$("Content_" + this.elementUniqueID).update(this.container.draw());
			this.reloadPage();
			this.setSize();
		}
	},
	redraw: function() {
		this.draw();
	},
	GetTitleBarAction: function(type, isSmall, hasBackGround) {
		output = "<a onclick=\"";
		switch (type) {
			case "question":
				output += "";
				break;
			case "close":
				output += this.callBackText + " != null ? " + this.callBackText + ".destroy() : ''";
				break;
			case "hide":
				output += this.callBackText + " != null ? " + this.callBackText + ".showHideWindow() : ''";
				break;
			case "minimize":
				output += this.callBackText + " != null ? " + this.callBackText + ".showHideContents() : ''";
		}
		if (hasBackGround)
			output += (IS_TOUCH_SYSTEM ? "\"style=\"background-image:url('images/titlebar_touch.gif');" : "\"style=\"background-image:url('images/titlebar.gif');");
		output += "\"><img style=\"display:inline;float:right;" + (IS_TOUCH_SYSTEM ? "width:40px;height:40px;" : "") + "\" src=\"";
		switch (type) {
			case "question":
				output += "images/otheroptions.gif";
				break;
			case "close":
				output += "images/close_s.gif";
				break;
			case "hide":
				output += "images/minimise.gif";
				break;
			case "minimize":
				output += "images/barup.gif";
				break;
			default:
				output += "images/otheroptions.gif";
		}
		if (isSmall)
			output += "_s";
		output += "\"/></a>";
		return output;
	},
	setContainer: function(container, otherInfo) {
		this.addWindowContainer(container.elementName, container);
		this.container = container;
		this.container.parentWindowID = this.elementName;
		this.container.parentStageID = this.parentStageID;
	},
	setPrimaryContainer: function(target) {
		this.PrimaryContainerName = target;
	},
	reloadPage: function() {
		this.container.reloadPage();
	},
	historyGoBack: function() {
		var pageNode = null;
		var container = null;
		if (this.backURLHist.size() > 0) {
			var windowHistoryItem = this.backURLHist.pop();
			if(windowHistoryItem.type == WINDOW_HISTORY_PAGE_CHANGE) {
				var currentWindowConfiguration = this.WindowConfiguration;
				var WindowConfiguration = windowHistoryItem.windowLayout;
				var pageNodeList = windowHistoryItem.windowStates;
				var OldLINK = new Array();
				if (currentWindowConfiguration != WindowConfiguration) {
					ArrayOfWindowContainers = this.WindowContainers.values();
					while (ArrayOfWindowContainers.size() > 0) {
						var TempContainer = ArrayOfWindowContainers.pop();
						if (TempContainer.DATA != undefined) {
							OldLINK.push({
								NAME: TempContainer.elementName,
								TYPE: TempContainer.TYPE,
								DATA: TempContainer.DATA,
								panelHeader: TempContainer.panelHeader,
								postData: TempContainer.POSTDATA,
								pageState: TempContainer.pageState
							});
						}
						TempContainer.destroy();
						TempContainer = null;
					}
					this.WindowContainers = $H();
					this.configureWindow(WindowConfiguration);
					this.draw();
					while (pageNodeList.size() > 0) {
						pageNode = pageNodeList.pop();
						container = this.WindowContainers.get(pageNode.NAME);
						if (container != null)
						container.load(pageNode.TYPE, pageNode.DATA, pageNode.panelHeader, pageNode.POSTDATA, pageNode.pageState);
					}
				} else {
					while (pageNodeList.size() > 0) {
						pageNode = pageNodeList.pop();
						container = this.WindowContainers.get(pageNode.NAME);
						if (container != undefined) {
							OldLINK.push({
								NAME: container.elementName,
								TYPE: container.TYPE,
								DATA: container.DATA,
								panelHeader: container.panelHeader,
								postData: container.POSTDATA,
								pageState: container.pageState
							});
							container.load(pageNode.TYPE, pageNode.DATA, pageNode.panelHeader, pageNode.POSTDATA, pageNode.pageState);
						}
					}
				}
				this.forwardURLHist.push({
						type : WINDOW_HISTORY_PAGE_CHANGE,
						windowLayout : currentWindowConfiguration, 
						windowStates : OldLINK
				});
			} else if(windowHistoryItem.type == WINDOW_HISTORY_ACTION_EVENT)
				setTimeout(windowHistoryItem.action, 1);		
		}
		this.setNavButtons();
	},
	historyGoForward: function() {
		var pageNode = null;
		var container = null;
		if (this.forwardURLHist.size() > 0) {
			var windowHistoryItem = this.forwardURLHist.pop();
			if(windowHistoryItem.type == WINDOW_HISTORY_PAGE_CHANGE) {
				var currentWindowConfiguration = this.WindowConfiguration;
			
				var WindowConfiguration = windowHistoryItem.windowLayout;
				var pageNodeList = windowHistoryItem.windowStates;
				var OldLINK = new Array();
				if (currentWindowConfiguration != WindowConfiguration) {
					ArrayOfWindowContainers = this.WindowContainers.values();
					while (ArrayOfWindowContainers.size() > 0) {
						var TempContainer = ArrayOfWindowContainers.pop();
						if (TempContainer.DATA != undefined) {
							OldLINK.push({
									NAME: TempContainer.elementName,
									TYPE: TempContainer.TYPE,
									DATA: TempContainer.DATA,
									panelHeader: TempContainer.panelHeader,
									postData: TempContainer.POSTDATA,
									pageState: TempContainer.pageState
								});
						}
						TempContainer.destroy();
						TempContainer = null;
					}
					this.WindowContainers = $H();
					this.configureWindow(WindowConfiguration);
					this.draw();
					while (pageNodeList.size() > 0) {
						pageNode = pageNodeList.pop();
						container = this.WindowContainers.get(pageNode.NAME);
						if (container != null)
							container.load(pageNode.TYPE, pageNode.DATA, pageNode.panelHeader, pageNode.POSTDATA, pageNode.pageState);
					}
				} else {
					while (pageNodeList.size() > 0) {
						pageNode = pageNodeList.pop();
						container = this.WindowContainers.get(pageNode.NAME);
						if (container != undefined) {
							OldLINK.push({
									NAME: container.elementName,
									TYPE: container.TYPE,
									DATA: container.DATA,
									panelHeader: container.panelHeader,
									postData: container.POSTDATA,
									pageState: container.pageState
								});
							container.load(pageNode.TYPE, pageNode.DATA, pageNode.panelHeader, pageNode.POSTDATA, pageNode.pageState);
						}
					}
				}
				this.backURLHist.push({
						type : WINDOW_HISTORY_PAGE_CHANGE,
						windowLayout : currentWindowConfiguration, 
						windowStates : OldLINK
					});
			} else if(windowHistoryItem.type == WINDOW_HISTORY_ACTION_EVENT)
				setTimeout(windowHistoryItem.action, 1);		
		}
		this.setNavButtons();
	},
	pushActionOnToForwardHistory: function(actionToPush) {
		this.forwardURLHist.push({
						type : WINDOW_HISTORY_ACTION_EVENT,
						action : actionToPush
				});
		this.setNavButtons();
	},
	pushActionOnToBackHistory: function(actionToPush, clearForwardHistory) {
		if(clearForwardHistory == true)
			this.forwardURLHist = [];
		this.backURLHist.push({
						type : WINDOW_HISTORY_ACTION_EVENT,
						action : actionToPush
				});
		this.setNavButtons();
	},
	loadPage: function(ID, LINK, PANELHEADER) {
		if (this.WindowContainers.get(ID) != undefined) {
			this.forwardURLHist = [];
			this.forwardURLHist.push({
						type : WINDOW_HISTORY_PAGE_CHANGE,
						windowLayout : this.WindowConfiguration, 
						windowStates : [{
							NAME: ID,
							TYPE: "LINK",
							DATA: LINK,
							panelHeader: PANELHEADER
						}]
			});
			this.historyGoForward();
			return true;
		}
		var NewWindowConfiguration = {
				target: "_active",
				panelHeader: null,
				raiseToTop: "",
				content: {
					type: "panel",
					name: LINK.target,
					PrimaryContainer: true,
					ContentType: "LINK",
					data: Object.toJSON(LINK)
				}
			};
		this.forwardURLHist = [];
		this.loadWindow(NewWindowConfiguration);
		return true;
	},
	loadWindow: function(WindowConfiguration) {
		if (this.windowFinal)
			return;
		var WindowConfigurationString = "";
		if (Object.isString(WindowConfiguration))
			WindowConfigurationString = WindowConfiguration;
		else
			WindowConfigurationString = Object.toJSON(WindowConfiguration);
		var currentWindowConfiguration = this.WindowConfiguration;
		var OldLINK = new Array();
		if (currentWindowConfiguration != WindowConfigurationString) {
			ArrayOfWindowContainers = this.WindowContainers.values();
			while (ArrayOfWindowContainers.size() > 0) {
				var TempContainer = ArrayOfWindowContainers.pop();
				if (TempContainer != null) {
					if (TempContainer.DATA != undefined) {
						OldLINK.push({
							NAME: TempContainer.elementName,
							TYPE: TempContainer.TYPE,
							DATA: TempContainer.DATA,
							panelHeader: TempContainer.panelHeader,
							postData: TempContainer.POSTDATA,
							pageState: TempContainer.pageState
						});
					}
					TempContainer.destroy();
				}
				TempContainer = null;
			}
			this.WindowContainers = $H();
			this.configureWindow(WindowConfigurationString);
			this.draw();
			if (currentWindowConfiguration != "")
			this.backURLHist.push({
						type : WINDOW_HISTORY_PAGE_CHANGE,
						windowLayout : currentWindowConfiguration, 
						windowStates : OldLINK
				});
		} else
			this.reloadPage();
		this.setNavButtons();
	},
	configureWindow: function(WindowConfiguration) {
		if (this.windowFinal)
			return;
		$('rightInformationMenu_' + this.elementUniqueID).update("");
		$('rightInformationBar_' + this.elementUniqueID).update("");
		if (!(this.windowOptionType != NO_TITLE_BAR_OPTIONS || (this.windowOptionType & TAB_PERSISTENCE_FLAG != 0)))
			$("WindowNavigation_" + this.elementUniqueID).hide();
		this.WindowConfiguration = WindowConfiguration;
		var WindowLayout = eval('(' + WindowConfiguration + ')');
		this.setPageHeaders(WindowLayout.panelHeaders);
		if(WindowLayout.title != null || WindowLayout.leftMenu != null || WindowLayout.info != null)
			this.setWindowTitle(WindowLayout.title, WindowLayout.leftMenu, WindowLayout.info);
		setupContainer(this, WindowLayout.content, null);
		if (WindowLayout.target.toLowerCase() == "_final") {
			var fwbutton = $("FWNavButton_" + this.elementUniqueID);
			var bwbutton = $("BWNavButton_" + this.elementUniqueID);
			if (fwbutton != null)
				fwbutton.remove();
			if (bwbutton != null)
				bwbutton.remove();
			this.windowFinal = true;
		}
	},
	setPageHeaders: function(panelHeaders) {
		var timeBox = $("rightInformationMenu_" + this.elementUniqueID);
		if (timeBox == null)
			return;
		timeBox.update("");
		this.pageHeaders = panelHeaders;
		if (panelHeaders != null) {
			if (panelHeaders.refreshEnabled) {
				
				//show window control bar if hidden
				$("WindowNavigation_" + this.elementUniqueID).setStyle({display:"block"});
			
				var time = -1;
				var timeVisible = true;
				var timeOptions = [5, 15, 30, 60, 120, 300, 600];
				var countdownVisible = true;
				if (panelHeaders.autoRefreshControls != null) {
					if (panelHeaders.autoRefreshControls.time != null)
						time = panelHeaders.autoRefreshControls.time;
					if (panelHeaders.autoRefreshControls.timeVisible != null)
						timeVisible = panelHeaders.autoRefreshControls.timeVisible;
					if (panelHeaders.autoRefreshControls.timeOptions != null) {
						timeOptions = panelHeaders.autoRefreshControls.timeOptions;
						if(Object.isString(timeOptions))
							timeOptions = eval("(" + timeOptions + ")");
					}
					if (panelHeaders.autoRefreshControls.countdownVisible != null)
						countdownVisible = panelHeaders.autoRefreshControls.countdownVisible;
				}
				this.refreshTimeOut = time;
				timeOptions.unshift(-1);
				if (timeVisible) {
					var displayTimeInfo = "<table cellpadding='0' cellspacing='0'><tr><td><nobr>&nbsp;&nbsp;Refresh Time</nobr></td><td><select onchange='" + this.callBackText + ".autoRefreshTimeUpdate(this.value);'>";
					var timeOptionLength = timeOptions.length;
					for (i = 0; i < timeOptionLength; i++) {
						displayTimeInfo += "<option value='" + timeOptions[i] + "'";
						if (timeOptions[i] == time) 
							displayTimeInfo += "selected";
						displayTimeInfo += ">";
						if (timeOptions[i] != -1) {
							var timeInMin = Math.floor(timeOptions[i] / 60);
							if (timeInMin != 0)
							displayTimeInfo += timeInMin + "m ";
							displayTimeInfo += (timeOptions[i] % 60) + "s";
						}  else 
							displayTimeInfo += "Off";
						displayTimeInfo += "</option>";
					}
					displayTimeInfo += "</selected></td></tr></table>";
				}
				if (timeBox != null)
					timeBox.update(displayTimeInfo);
			}
		}
	},
	autoRefreshTimeUpdate: function(newAutoUpdateTime) {
		this.refreshTimeOut = newAutoUpdateTime;
		this.WindowContainers.each(function(containerPair) {
			containerPair.value.autoReloadUpdate();
		});
	},
	addWindowContainer: function(ID, Container) {
		var currentContainer = this.WindowContainers.get(ID);
		if (currentContainer != undefined)
			currentContainer.destroy();
		this.WindowContainers.set(ID, Container);
		return true;
	},
	SetState: function(State) {
		var background = "";
		var LeftBar = "";
		var RightBar = "";
		var windows = null;
		switch (State) {
			case 0:
			LeftBar = 'images/Lefttitlebar.gif';
			RightBar = 'images/righttitlebar.gif';
			background = "url('images/titlebar.gif')";
			break;
			case 1:
			LeftBar = 'images/Lefttitlebar_c.gif';
			RightBar = 'images/righttitlebar_c.gif';
			background = "url('images/titlebar_c.gif')";
			break;
			case -1:
			LeftBar = 'images/Lefttitlebar_s.gif';
			RightBar = 'images/righttitlebar_s.gif';
			background = "url('images/titlebar_s.gif')";
			break;
			default:
			LeftBar = 'images/Lefttitlebar.gif';
			RightBar = 'images/righttitlebar.gif';
			background = "url('images/titlebar.gif')";
		}
		windows = $$("#MenuBarTitle_" + this.elementUniqueID);
		windows.each(function(ID) {
			ID.setStyle({ "background": background });
		});
		windows = $$("#MenuBarTitleLeft_" + this.elementUniqueID);
		windows.each(function(ID) {
			ID.src = LeftBar;
		});
		windows = $$("#MenuBarTitleRight_" + this.elementUniqueID);
		windows.each(function(ID) {
			ID.src = RightBar;
		});
	},
	setWindowTitle: function(newTitle, leftMenu, PanelInformation) {
		var newTabTitle = newTitle
			,windowTitle = $("WindowTitle_" + this.elementUniqueID)
			,windowTitleObjectString = "WindowTitle_" + this.elementUniqueID;
		if(windowTitle == null) {
			windowTitle = $("internalWindowTitleBar_" + this.elementUniqueID);
			windowTitleObjectString = "internalWindowTitleBar_" + this.elementUniqueID;
		}
		
		if (windowTitle != null) {
			if (PanelInformation == null)
				PanelInformation = "";
			if (PanelInformation != "") {
				newTabTitle = newTitle;
				newTitle = "<table cellpadding=\"0\" cellspacing=\"0\" ><tr><td valign='top'>" + newTabTitle + "&nbsp;&nbsp;&nbsp;</td><td><img style='float:none' id='{$pageID}_PageInformationButton' onMouseUp=\"stopPropagation(event);\" onMouseDown='show_GENERAL_BLANK_POPUP(\""+newTabTitle+"\", decodeURIComponent(\"" + encodeURIComponent("<div style=\"padding:10px;width:350px;\">"+PanelInformation+"</div>\">") + "));' src=\"images/info.gif\"/></td></tr></table>";
			}
			windowTitle.update(newTitle);
		}
			
		if (newTitle != "") {
			newTitle = newTitle.replace(/ /g, "&nbsp;");
			var tabTitle = $("WindowBarTitle_" + this.elementUniqueID);
			var tabTitleHolder = $("WindowBarTitleHolder_" + this.elementUniqueID);
			if (tabTitle != null) {
				tabTitle.update(newTabTitle);
				if (tabTitleHolder != null) {
					var tabTempTitle = newTabTitle;
					var tabTitleHoderWidth = tabTitleHolder.getWidth();
					while (tabTitleHolder.scrollWidth > tabTitleHoderWidth && tabTempTitle.length > 10) {
						tabTempTitle = tabTempTitle.substring(0, tabTempTitle.length - 4) + "...";
						tabTitle.update(tabTempTitle);
					}
				}
			}
		}
		
		if (leftMenu != null) {
			if ($("rightInformationBar_" + this.elementUniqueID)) {
				if(Object.isArray(leftMenu))
					createContextMenu("rightInformationBar_" + this.elementUniqueID, leftMenu , HORIZONTAL, this.parentStageID, this.elementName, this.PrimaryContainerName);
				else 
					$("rightInformationBar_" + this.elementUniqueID).update(leftMenu);
			}
		}
	},
	clearHeaders: function() {
		var windowTitle = $("WindowTitle_" + this.elementUniqueID);
		var internalWindowTitle = $("internalWindowTitleBar_" + this.elementUniqueID);
		var windowTitleBar = $("WindowBarTitle_" + this.elementUniqueID);
		var informationBar = $("rightInformationBar_" + this.elementUniqueID);
		if (windowTitle != null)
			windowTitle.update("");
		if (internalWindowTitle != null)
			internalWindowTitle.update("");
		if (informationBar != null) 
			informationBar.update("");
	},
	setLoadingMsg: function(panelID,msg) {
		if (this.PanelsLoading.size() != 0)
			return;
		if ($("internalWindowLoadingInfo_" + this.elementUniqueID) != null)
			$("internalWindowLoadingInfo_" + this.elementUniqueID).update(msg);
		if ($("WindowLoadingInfo_" + this.elementUniqueID) != null) 
			$("WindowLoadingInfo_" + this.elementUniqueID).update(msg);
	},
	setLoading: function(panelID) {
		this.setLoadingMsg(panelID,"<img src=\"images/windowLoad.gif\"/>");
		this.PanelsLoading.set(panelID, "Loading");
	},
	setDoneLoading: function(panelID) {
		this.PanelsLoading.unset(panelID);
		this.setLoadingMsg(panelID,"");
	},
	setNavButtons: function() {
		if ($("BWNavButton_" + this.elementUniqueID) != null)
			$("BWNavButton_" + this.elementUniqueID).src = "images/windownav/BWArrow_"+(this.backURLHist.size() == 0?"inA":"a")+"ctive" + (IS_TOUCH_SYSTEM ? "_touch" : "" ) + ".gif";
		if ($("FWNavButton_" + this.elementUniqueID) != null) 
			$("FWNavButton_" + this.elementUniqueID).src = "images/windownav/FWArrow_"+(this.forwardURLHist.size() == 0?"inA":"a")+"ctive" + (IS_TOUCH_SYSTEM ? "_touch" : "" ) + ".gif";
	}
});
