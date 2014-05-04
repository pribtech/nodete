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

var embeddedStage = Class.create(basePageElement, {
	initialize: function($super, myID, taskBarStyle, fromTop, fromBotton, fromLeft, fromRight, titleBarType, windowOptionType, windowControlTypes, sizable) {
		$super(myID, "STAGE", true);
		this.positionType = "static";
		this.taskBarStyle = Object.isString(taskBarStyle) ? eval(taskBarStyle) :taskBarStyle;
		this.fromTop = fromTop;
		this.fromBotton = fromBotton;
		this.fromLeft = fromLeft;
		this.fromRight = fromRight;
		this.EndScroll = true;
		this.scrollAcceleration = 0;
		this.contentWidth = 0;
		this.contentHeight = 0;
		this.stageObjects = {};
		this.InResizeEvent = false;
	 /* Window Title Types
	 * 0 - no title bar
	 * 1 - Window Controls outside of title
	 * 2 - Window Controls inside of title
	 *****************/
		this.titleBarType = Object.isString(titleBarType) ? eval(titleBarType) : titleBarType;
	/* Window Navigation Types (Add the numbers to get all the controls you want)
	 * 0 - no Navigation bar
	 * 1 - back button
	 * 2 - forward button
	 * 4 - reload
	 * 8 - address bar
	 *****************/
		this.windowOptionType = Object.isString(windowOptionType) ? eval(windowOptionType) : windowOptionType;
	/* Window Control Types (Add the numbers to get all the controls you want)
	 * 1 - Question Menu // not avalible at this time
	 * 2 - Minimize
	 * 4 - Hide
	 * 8 - Close
	 *****************/
		this.windowControlTypes = Object.isString(windowControlTypes) ? eval(windowControlTypes) : windowControlTypes;
	/* Window Sizing Options
	 * 1 - Window IS Sizable
	 * 2 - Window IS Fixed
	 * 3 - Window Clings To It Container
	 *****************/
		this.sizable = Object.isString(sizable) ? eval(sizable) : sizable;
		this.PageWindows = $H();
		this.ActiveWindow = ({
			stageID : "",
			windowID : ""
		});
		this.ActivePanel = ({
			windowID : "",
			panelID : ""
		});
		this.WidthOffset = 0;
		if((this.taskBarStyle & ( LEFT_BLOCK_TASK_BAR + RIGHT_BLOCK_TASK_BAR ) ) != 0)
			this.WidthOffset = IS_TOUCH_SYSTEM ? 40 : 25;
		this.HeightOffset = 0;
		if((this.taskBarStyle & ( TOP_BLOCK_TASK_BAR + BOTTOM_BLOCK_TASK_BAR ) ) != 0)
			this.HeightOffset = IS_TOUCH_SYSTEM ? 40 : 25;
		
		this.LOCAL_STAGE_VARIABLES = $H();
	},
	getStageObject : function(object) {
		if(this.stageObjects[object] == null)
			this.stageObjects[object] = $(this.elementUniqueID + "_" + object);
		return this.stageObjects[object];
	},
	draw: function() {
		return this.show();
	},
	show: function() {
		this.stageObjects = {};
		return  "<table class='stageBase' id='" + this.elementName + "' cellpadding='0' cellspacing='0'>"
						+	"<tr>"
						+		this.blockTaskBar(LEFT_BLOCK_TASK_BAR,TOP_TAB_TASK_BAR+TOP_BLOCK_TASK_BAR)
						+	( (this.taskBarStyle & ( TOP_TAB_TASK_BAR + TOP_BLOCK_TASK_BAR ) ) == 0 ? "" : "</tr><tr>" )
						+		"<td valign='top'>"
						+			"<div id='" + this.elementName + "_ContentWindow' class='stageContentContainer' style=\"width:" + (this.width - this.WidthOffset) + "px;height:" + (this.height - this.HeightOffset) + "px;\"></div>"
						+ 		"</td>"
						+	( (this.taskBarStyle & ( BOTTOM_BLOCK_TASK_BAR) ) == 0 ? "" : "</tr><tr>" )
						+		 this.blockTaskBar(RIGHT_BLOCK_TASK_BAR,BOTTOM_BLOCK_TASK_BAR)
						+	"</tr>"
						+ "</table>";
	},
	blockTaskBar: function(directionHorizontal,directionVertical) {
		if((this.taskBarStyle & ( directionHorizontal + directionVertical ) ) == 0) return "";
		return "<td id='" + this.elementName + "_MenuBar_Table_cell'"
					+	 ( ( this.taskBarStyle & ( directionHorizontal ) ) != 0 ? " valign='top'" : "")
					+ ">"
					+ this.buildTaskBar()
					+ "</td>";
	},
	buildTaskBar: function() {
		var buildStage = "";
		if((this.taskBarStyle & ( TOP_TAB_TASK_BAR + TOP_BLOCK_TASK_BAR + BOTTOM_BLOCK_TASK_BAR ) ) != 0)
			buildStage +="<table id='" + this.elementName + "_MenuBar_Tab_Table' style='display: none;"
						+ 		( (this.taskBarStyle & ( TOP_TAB_TASK_BAR ) ) == 0 ? "height" : "width" )
						+ 	":100%;' cellpadding='0' cellspacing='0'>"
						+ "<tr>";
		else if((this.taskBarStyle & ( LEFT_BLOCK_TASK_BAR + RIGHT_BLOCK_TASK_BAR ) ) != 0)
			buildStage +="<table id='" + this.elementName + "_MenuBar_Table' style='height:100%;' cellpadding='0' cellspacing='0' bgcolor='white'>"
						+	"<tr>";
		if((this.taskBarStyle & ( TOP_TAB_TASK_BAR ) ) != 0) {
			if((this.taskBarStyle & ( ALLOW_NEW_PANEL ) ) != 0)
				buildStage +="<td style='width:10px;' id='" + this.elementName + "_MenuBar_NewTab'>"
							+	"<img src='images/new_page.gif' onclick='OpenBlankWindow(\"" + this.elementName + "\")'>"
							+ "</td>";
			buildStage +="<td>"
						+ "<table id='" + this.elementName + "_MenuBar_Table' style='width:100%;' class='stageTabAreaHeight" + (IS_TOUCH_SYSTEM ? "_touch" : "" ) + "' cellpadding='0' cellspacing='0'>"
						+ 	"<tr>"
						+ 		"<td id='" + this.elementName + "_MenuBar_Backward_Button' style='display:none;width:10px;'>"
						+ 			"<img onmousedown=\"" + this.callBackText + ".startScrollLeft()\" onmouseout=\"" + this.callBackText + ".EndScrolling()\" onmouseup=\"" + this.callBackText + ".EndScrolling()\" src='images/bw_nav_s.gif'/>"
						+ 		"</td>";
		}
		buildStage +="<td>";
		if((this.taskBarStyle & ( TOP_TAB_TASK_BAR + TOP_BLOCK_TASK_BAR + BOTTOM_BLOCK_TASK_BAR ) ) != 0)
			buildStage +="<div style='width:200px;' class='stageTabMainScrollArea" + (IS_TOUCH_SYSTEM ? "_touch" : "" ) + "' id='" + this.elementName + "_MenuBar' onMouseUp='Releaseme()'>";
		else
			buildStage +="<div id='" + this.elementName + "_MenuBar' onMouseUp='Releaseme()'>";
		buildStage +="<table cellpadding='0' cellspacing='0'>";
		if((this.taskBarStyle & ( TOP_TAB_TASK_BAR + TOP_BLOCK_TASK_BAR + BOTTOM_BLOCK_TASK_BAR ) ) != 0) {
			buildStage +="<tbody>"
						+ 	"<tr id='" + this.elementName + "_MenuBar_Content'></tr>";
			if((this.taskBarStyle & ( TOP_TAB_TASK_BAR) ) != 0) 
				buildStage +="<tr id='" + this.elementName + "_MenuBar_Content_UnderLine'></tr>";
			buildStage +="</tbody>";
		} else if((this.taskBarStyle & ( LEFT_BLOCK_TASK_BAR + RIGHT_BLOCK_TASK_BAR ) ) != 0)
			buildStage +="<tbody id='" + this.elementName + "_MenuBar_Content'></tbody>";
		buildStage +="</table>"
					+ "</div>"
					+ "</td>";
		if((this.taskBarStyle & ( TOP_TAB_TASK_BAR ) ) != 0)
			buildStage +="<td id='" + this.elementName + "_MenuBar_Forward_Button' style='display:none;' style='width:10px;' align='right'>"
						+	"<img onmousedown=\"" + this.callBackText + ".startScrollRight()\" onmouseout=\"" + this.callBackText + ".EndScrolling()\" onmouseup=\"" + this.callBackText + ".EndScrolling()\" src='images/fw_nav_s.gif'/>"
						+	"</td>"
						+	"</tr>"
						+	"</table>"
						+	"</td>"
						+	"</tr>"
						+	"<tr>"
						+	"<td>"
						+	"<div class=\"tabBarUnderline\" />"
						+	"</td>";
		buildStage +="</tr>"
					+"</table>";

		return buildStage;

	},
	addTaskBar: function(ID, pageID, title, windowType) {
		if((this.taskBarStyle & ( TOP_TAB_TASK_BAR + LEFT_BLOCK_TASK_BAR + RIGHT_BLOCK_TASK_BAR + TOP_BLOCK_TASK_BAR + BOTTOM_BLOCK_TASK_BAR ) ) != 0) {
			var mainTag = ((this.taskBarStyle & ( LEFT_BLOCK_TASK_BAR + RIGHT_BLOCK_TASK_BAR ) ) == 0 ?  'td' : 'tr' );
			var barToAdd = new Element(mainTag, { 'id'		: "MenuBar_" + pageID,
												'onMouseDown':"BarItemClick('" + this.elementName + "','" + ID + "')"
							});
			var BuildBarHTML = "";
			if((this.taskBarStyle & ( TOP_TAB_TASK_BAR ) ) != 0) {
				BuildBarHTML +="<table class='stageTabHeight" + (IS_TOUCH_SYSTEM ? "_touch" : "" ) + "' cellpadding=0 cellspacing=0><tr>"
							+		"<td class='stageTabLeftSideWidth' onMouseDown=\"BarItemClick('" + this.elementName + "','" + ID + "');\"><img id=\"MenuBarTitleLeft_" + pageID + "\" src=\"images/" + (IS_TOUCH_SYSTEM ? "Lefttitlebar_touch.gif" : "Lefttitlebar.gif" ) + "\"/></td>"
							+		"<td id=\"MenuBarTitle_" + pageID + "\" class=\"" + (IS_TOUCH_SYSTEM ? "TitleBar_Title_touch" : "TitleBar_Title" ) + "\" onMouseDown=\"BarItemClick('" + this.elementName + "','" + ID + "');\">"
							+		"<table cellpadding=\"0\" cellspacing=\"0\">"
							+		"<tr>"
							+		"<td width='1px' id='WindowLoadingInfo_" + pageID + "'></td>";
				if((this.windowOptionType & ( TAB_PERSISTENCE_FLAG ) ) != 0 && windowType != CAN_NOT_CLOSE)
					BuildBarHTML +="<td width='1px'><input type='checkbox' title='Do not auto close window.' id='persistWindow_" + pageID + "' value='true'/></td>";
				BuildBarHTML +="<td>"
							+ "<div class='stageMenuBarContent_Tabs' id=\"WindowBarTitleHolder_" + pageID + "\">";
			} else {
				BuildBarHTML +="<td width='1px' id='WindowLoadingInfo_" + pageID + "'></td>";
				if((this.windowOptionType & ( TAB_PERSISTENCE_FLAG ) ) != 0 && windowType != CAN_NOT_CLOSE)
					BuildBarHTML +="<td width='1px'><input type='checkbox' title='Do not auto close window.' id='persistWindow_" + pageID + "' value='true'/></td>";
				BuildBarHTML +="<td>"
							+		"<div class='stageMenuBarContent_Basic' id=\"WindowBarTitleHolder_" + pageID + "\">";
			}
			BuildBarHTML +="<span class='stageMenuBarContent_Title' id=\"WindowBarTitle_" + pageID + "\">" + (title == "" ? "No Title" : title) +"</span>"
						+	"<div style=\"vertical-align: middle;position:static; width:100%; height:100%; left:0px; top:0px; \"></div>"
						+	"</div>"
						+	"</td>";
			if((this.taskBarStyle & ( TOP_TAB_TASK_BAR ) ) != 0) {
				if(windowType != CAN_NOT_CLOSE)
					BuildBarHTML +="<td align=\"right\" valign=\"top\" class='TitleBarElements_Close'>"
								+	"<img src=\"images/" + (IS_TOUCH_SYSTEM ? "close.png" : "close_s.gif" ) + "\"onclick=\"getWindow('" + this.elementName + "','"+ ID + "').destroy();"+this.callBackText + ".resizePageWindows()\"/>"
								+	"</td>";
				BuildBarHTML +="</tr>"
							+	"</table>"
							+	"</td>"
							+	"<td class='stageTabRightSideWidth' onMouseDown=\"BarItemClick('" + this.elementName + "','" + ID + "');\"><img style='height:100%;' id=\"MenuBarTitleRight_" + pageID + "\" src=\"images/" + (IS_TOUCH_SYSTEM ? "righttitlebar_touch.gif" : "righttitlebar.gif") + "\"/></td>"
							+	"</tr></table>";
			}
			barToAdd.insert(BuildBarHTML);
			this.getStageObject('MenuBar_Content').insert(barToAdd);
			this.getStageObject('MenuBar').scrollLeft = this.getStageObject('MenuBar').scrollWidth;
			this.showTaskBarButtons();
			if((this.taskBarStyle & ( TOP_TAB_TASK_BAR ) ) != 0) {
				if((this.taskBarStyle & ( ALLOW_NEW_PANEL ) ) == 0) {
					if(this.PageWindows.keys().size() > 1) {
						var titlebar = this.getStageObject("MenuBar_Tab_Table");
						titlebar.show();
						this.HeightOffset = titlebar.getHeight();
						this.PageWindows.each(function(Window) {
							var tabTitle = $("WindowBarTitle_" + Window.value.elementUniqueID);
							var tabTitleHolder = $("WindowBarTitleHolder_" + Window.value.elementUniqueID);
							if(tabTitle != null) {
								if(tabTitleHolder != null) {
									var tabTempTitle = tabTitle.innerHTML;
									var tabTitleHoderWidth = tabTitleHolder.getWidth();
									while(tabTitleHolder.scrollWidth > tabTitleHoderWidth && tabTempTitle.length > 10) {
										tabTempTitle = tabTempTitle.substring(0, tabTempTitle.length - 4) + "...";
										tabTitle.update(tabTempTitle);
									}
								}
							}
						});
					} else {
						this.getStageObject("MenuBar_Tab_Table").hide();
						this.HeightOffset = 0;
					}
					this.setSize();
					this.resizePageWindows();
				}
			}
		}
	},
	resizePageWindows: function() {
		this.PageWindows.each(function(Window) {
			Window.value.resizeStart();
			Window.value.resizeEnd();
			});
	},
	closeTaskBar: function(pageWindowToClose) {
		var mentBarTab = $('MenuBar_' + pageWindowToClose.elementUniqueID);
		if(mentBarTab != null)
			mentBarTab.remove();
		if(this.ActiveWindow.windowID == pageWindowToClose.elementName) {
			var lastWindow = null;
			var pageWindowsKeys = this.PageWindows.keys();
			var pageWindowsKaysSize = pageWindowsKeys.size();
			if(pageWindowsKaysSize > 1) {
				lastWindow = pageWindowsKeys[pageWindowsKaysSize-2];
				for(i = pageWindowsKaysSize-1; i >= 0 && pageWindowsKeys[i] != pageWindowToClose.elementName; i--)
					lastWindow = pageWindowsKeys[i];
				var nextActiveWindow = this.PageWindows.get(lastWindow);
				setActivePanel(nextActiveWindow.parentStageID, nextActiveWindow.elementName, nextActiveWindow.activePanel);
				RaiseToTop(nextActiveWindow.parentStageID, nextActiveWindow.elementName);
			}
		}
		this.PageWindows.unset(pageWindowToClose.elementName);
		this.showTaskBarButtons();
		if((this.taskBarStyle & ( ALLOW_NEW_PANEL | TOP_TAB_TASK_BAR ) ) == ALLOW_NEW_PANEL | TOP_TAB_TASK_BAR) {
			if(this.PageWindows.keys().size() <= 1 && this.getStageObject("MenuBar_Tab_Table") != null) {
				this.getStageObject("MenuBar_Tab_Table").hide();
				this.HeightOffset = 0;
			}
		}
		this.setSize();
	},
	reloadPage: function() {
		if(this.theObjectIsDead) return;
		this.PageWindows.each(function(ID) {
			if(ID != null)
				ID.value.reloadPage();
		});
	},
	showTaskBarButtons: function() {
		if(this.InResizeEvent) return;
		var menubar = this.getStageObject('MenuBar');
		if(menubar == null) return;
		if((this.taskBarStyle & ( TOP_TAB_TASK_BAR ) ) == 0) return;
		if(menubar.scrollWidth <this.width) {
			this.getStageObject("MenuBar_Forward_Button").hide();
			this.getStageObject("MenuBar_Backward_Button").hide();
			menubar.setStyle({"width": (this.width) + "px"});
		} else if(menubar.scrollWidth > this.width ) {
			this.getStageObject("MenuBar_Forward_Button").show();
			this.getStageObject("MenuBar_Backward_Button").show();
			menubar.setStyle({"width": (this.width-(this.getStageObject("MenuBar_Backward_Button").getWidth() + this.getStageObject("MenuBar_Forward_Button").getWidth())) + "px"});
		}
		menubar.scrollLeft = menubar.scrollWidth ;
	},
	size: function() {
		return;
	},
	sizeContent: function() {
		if(this.theObjectIsDead) return;
		if(WINDOW_IS_FULL != this.sizable || this.theObjectIsDead)
			return;
		var window = this.PageWindows.get(this.ActiveWindow.windowID);
		if(window != null)
			window.setSize(this.contentWidth, this.contentHeight);
	},
	destroy: function($super) {
		this.theObjectIsDead = true;
		this.myParent = null;
		this.PageWindows.each(function(ID) {
			if(ID != null)
				ID.value.destroy();
			});
		this.PageWindows = $H();
		if($(this.elementName) != null)
			$(this.elementName).remove();
		$super();
	},
	EndScrolling: function() {
		this.EndScroll = true;
	},
	startScrollLeft: function() {
		if(!this.taskBarStyle || this.theObjectIsDead)
			return;
		this.scrollAcceleration = 1;
		this.EndScroll = false;
		this.scrollLeft();
	},
	scrollLeft: function() {
		if(this.EndScroll || this.theObjectIsDead)
			return;
		this.scrollAcceleration +=0.2;
		this.getStageObject('MenuBar').scrollLeft += -(this.scrollAcceleration);
		setTimeout(this.callBackText + ".scrollLeft()", 10);
	},
	startScrollRight: function() {
		if(!this.taskBarStyle || this.theObjectIsDead)
			return;
		this.scrollAcceleration = 1;
		this.EndScroll = false;
		this.scrollRight();
	},
	scrollRight: function() {
		if(this.EndScroll || this.theObjectIsDead)
			return;
		this.scrollAcceleration +=0.2;
		this.getStageObject('MenuBar').scrollLeft += (this.scrollAcceleration);
		setTimeout(this.callBackText + ".scrollRight()", 10);
	},
	startScrollUp: function() {
		if(!this.taskBarStyle || this.theObjectIsDead)
			return;
		this.scrollAcceleration = 1;
		this.EndScroll = false;
		this.scrollUp();
	},
	scrollUp: function() {
		if(this.EndScroll || this.theObjectIsDead)
			return;
		this.scrollAcceleration +=0.2;
		this.getStageObject('MenuBar').scrollTop += (this.scrollAcceleration);
		setTimeout(this.callBackText + ".scrollUp()", 10);
	},
	startScrollDown: function() {
		if(!this.taskBarStyle || this.theObjectIsDead)
			return;
		this.scrollAcceleration = 1;
		this.EndScroll = false;
		this.scrollDown();
	},
	scrollDown: function() {
		if(this.EndScroll || this.theObjectIsDead)
			return;
		this.scrollAcceleration +=0.2;
		this.getStageObject('MenuBar').scrollTop -= (this.scrollAcceleration);
		setTimeout(this.callBackText + ".scrollDown()", 10);
	},
	resizeStart: function() {
		this.InResizeEvent = true;
		var window = this.PageWindows.get(this.ActiveWindow.windowID);
		if(window != null)
			window.resizeStart();
	},
	resizeEnd: function() {
		this.InResizeEvent = false;
		var window = this.PageWindows.get(this.ActiveWindow.windowID);
		if(window != null)
			window.resizeEnd();
		this.showTaskBarButtons();
	},
	sizeWidth: function(Amount) {
		if(this.theObjectIsDead) return this.width;
		var contentWindow = this.getStageObject('ContentWindow');
		this.width += Amount;
		if(contentWindow != null)
			contentWindow.setStyle({"width" : (this.width- ( this.fromLeft + this.fromRight + this.WidthOffset )) + "px"});
		this.showTaskBarButtons();
		this.contentWidth = this.width- ( this.fromLeft + this.fromRight + this.WidthOffset );
		if(this.contentWidth < 0)
			this.contentWidth = 0;
		var window = this.PageWindows.get(this.ActiveWindow.windowID);
		if(window != null)
			window.setWidth(this.contentWidth);
		return this.width;
	},
	sizeHeight: function(Amount) {
		if(this.theObjectIsDead) return this.height;
		var contentWindow = this.getStageObject('ContentWindow');
		var titlebar = this.getStageObject("MenuBar_Tab_Table");
		if(titlebar != null) 
			this.HeightOffset = ( titlebar.visible() ? titlebar.getHeight() : 0 );
		this.height += Amount;
		if(contentWindow != null)
			contentWindow.setStyle({"height": (this.height - ( this.fromBotton + this.fromTop + this.HeightOffset) ) + "px"}); //Remove height of menubar
		this.contentHeight = this.height - ( this.fromBotton + this.fromTop + this.HeightOffset);
		if(this.contentHeight < 0)
			this.contentHeight = 0;
		var window = this.PageWindows.get(this.ActiveWindow.windowID);
		if(window != null)
			window.setHeight(this.contentHeight);
		return this.height;
	},
	setWidth: function(Amount) {
		if(this.theObjectIsDead) return this.width;
		var contentWindow = this.getStageObject('ContentWindow');
		this.width = Amount;
		if(contentWindow != null)
			contentWindow.setStyle({"width" : (this.width- ( this.fromLeft + this.fromRight + this.WidthOffset )) + "px"});
		this.showTaskBarButtons();
		this.contentWidth = this.width- ( this.fromLeft + this.fromRight + this.WidthOffset );
		if(this.contentWidth < 0)
			this.contentWidth = 0;
		var window = this.PageWindows.get(this.ActiveWindow.windowID);
		if(window != null)
			window.setWidth(this.contentWidth);
		return this.width;
	},
	setHeight: function(Amount) {
		if(this.theObjectIsDead) return this.height;
		var contentWindow = this.getStageObject('ContentWindow');
		var titlebar = this.getStageObject("MenuBar_Tab_Table");
		if(titlebar != null)
			this.HeightOffset = ( titlebar.visible() ? titlebar.getHeight() : 0 );
		this.height = Amount;
		if(contentWindow != null)
			contentWindow.setStyle({"height": (this.height - ( this.fromBotton + this.fromTop + this.HeightOffset) ) + "px"}); //Remove height of menubar
		this.contentHeight = this.height - ( this.fromBotton + this.fromTop + this.HeightOffset);
		if(this.contentHeight < 0)
			this.contentHeight = 0;
		var window = this.PageWindows.get(this.ActiveWindow.windowID);
		if(window != null)
			window.setHeight(this.contentHeight);
	},
	moveLeft: function(Amount) {
		if(this.theObjectIsDead) return;
		this.PageWindows.each(function(aObject) {
			aObject.value.moveLeft(Amount);
			});
	},
	moveTop: function(Amount) {
		if(this.theObjectIsDead) return;
		this.PageWindows.each(function(aObject) {
			aObject.value.moveTop(Amount);
			});
	},
	BarItemClick: function(ID) {
		if((this.taskBarStyle & ( LEFT_BLOCK_TASK_BAR + RIGHT_BLOCK_TASK_BAR + TOP_BLOCK_TASK_BAR + BOTTOM_BLOCK_TASK_BAR ) ) != 0) {
			var barItem = $("Body_" + this.elementName + "_" + ID)
			if(barItem.visible())
				SetBarState(this.elementName + "_" + ID, 0);
			else {
				barItem.setStyle({ "display": "block"});
				SetBarState(this.elementName + "_" + ID, 1);
				RaiseToTop(this.elementName, ID);
			}
		} else
			RaiseToTop(this.elementName, ID);
	},
	closeAllWindows: function() {
		this.PageWindows.each(function(ID) {
			if(ID != null) {
				if(ID.value.windowType != CAN_NOT_CLOSE) {
					if($("persistWindow_" + ID.value.elementUniqueID) == null)
						ID.value.destroy();
					else if($F("persistWindow_" + ID.value.elementUniqueID) != 'true')
						ID.value.destroy();
				}
			}
		});
	}
});