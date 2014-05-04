/*******************************************************************************
 * Author: Matthew Vandenbussche
 * 
 *Copyright IBM Corp. 2010 All rights reserved.
 *
 * modified: Peter Prib - Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009)  2011-2014 All rights reserved.
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
//The following variables are used to determine
//if we are in the process of moving or resizing
//something and what that something is.
var CORE_MOUSE_DOWN_ACTIONS = $H();
//The core message store is used to store all messages that the TE displays
//These messages are set by the message files loaded form the JS language folder
var CORE_MESSAGE_STORE = {};

var currentSuggestionBox = null;
/**************
* Fist 'floating object' are not 'floating windows', they are two completely different classes of objects
* 'Floating object' include: 'floating panels', 'menus', 'notification pop ups', 'model windows'.
*
* Floating object exist above all other options, there base level is a z-index of 1000 indicated by the variable
* baseFloatingObjectLevel below. When a model panel is created it will increase the base level by 10 and decrease
* it by 10 upon it's destruction. On display of a model panel after it increases thebase floating object level
* by 10 will exist on a level ofbaseFloatingObjectLevel-1 such that all floating objects opened with in the model
* panel are displayed on top.
*
* visibleFloatingObject - will be an open floating object, note that model panel will not register and will protect
* any floating object under it so that they are still present upon the model panels destruction.
*
* AllowAutoClosingOfFloatingObject - when true the function closeOpenFloatingObject will be able to close the
* object in visibleFloatingObject.
*
*******************/
var CORE_ZINDEX_COUNT = 1000;
function getTopZindex() {
	return ++CORE_ZINDEX_COUNT;
}

var  visibleFloatingObject = null
	,AllowAutoClosingOfFloatingObject = true
	,pageWidth = 0
	,pageHeight = 0;
//The Following variables monitor the current mouse position
//and the last mouse position from the last time we checked it.
//This is used in window movement and resizing
var  CORE_Current_Mouse_X = 0
	,CORE_Current_Mouse_Y = 0;

var CORE_GENERAL_CONTEXT_MENU = (IS_TOUCH_SYSTEM?
	 new circleMenu(null, 'CORE_GENERAL_CONTEXT_MENU', false, null, null, true, null, null)
	:new contextBase(null, 'CORE_GENERAL_CONTEXT_MENU', false, null, null, true, null, null)
	);

var CORE_CLIENT_ACTIONS = $H();

var GET_TABLE_LIST_SAME = function(GUID) {
	var  base = GET_GLOBAL_OBJECT('list_table', GUID)
		,results =[];
	if (base==null) return results;
	var objects = GET_GLOBAL_OBJECT_CLASS('list_table');
	if (objects == null) return results;
	for (var i in objects._object) {
		var aObject=objects._object[i];
		if(aObject.baseTableData.tableName!=base.baseTableData.tableName) continue
		if(aObject.GUID==GUID) continue
		results.push(aObject); 
	}
	return results;
};

//Next ID of a open web windows on the screen
var CORE_GUDI_COUNT = 1;
//Current Active window
var CORE_ActiveWindow = ({
		stageID : "",
		windowID : ""
	});

var CORE_ActivePanel = ({
		stageID : "",
		windowID : "",
		panelID : ""
	});

var CORE_ReloadOnConnectionChange = $H();

function getGUID() {
	if (CORE_GUDI_COUNT==undefined) CORE_GUDI_COUNT=0;
	return ++CORE_GUDI_COUNT;
}

function getStagePositionType(stageID) {
	var stage = getStage(stageID);
	if(stage != null)
		return stage.positionType;
	return "absolute";
}

function getStage(stageID) {
	var stage = GET_GLOBAL_OBJECT("STAGE", stageID);
	return stage == null? GET_GLOBAL_OBJECT("MASTER_STAGE", stageID) : stage; 
}

function getWindow(stageID, windowID) {
	if(stageID == null || stageID == '' || windowID == null || windowID == '')
		return null;
	var stage = getStage(stageID);
	if(stage == null)
		return null;
	return stage.PageWindows.get(windowID);
}

function isWindowVisible(stageID, windowID) {
	if(stageID == null || stageID == '' || windowID == null || windowID == '')
		return false;
	var stage = getStage(stageID);
	if(stage == null)
		return false;
	if(stage.elementType == 'MASTER_STAGE') {
		if(stage.ActiveWindow.stageID == stageID && stage.ActiveWindow.windowID == windowID)
			return true;
	} else {
		if(stage.ActiveWindow.stageID == stageID && stage.ActiveWindow.windowID == windowID)
			return isWindowVisible(stage.parentStageID, stage.parentWindowID);
	}
	return false;
}

function getPanel(stageID, windowID, panelID) {
		if(stageID == "" || stageID == null || windowID == "" || windowID == null) {
			var panel = GET_GLOBAL_OBJECT("FLOATING_PANEL", panelID);
			if(panel == null) 
				panel = activeModalPanel.get(panelID);
			return panel;
		} else {
			var window = getWindow(stageID, windowID);
			if(window != null)
				return window.WindowContainers.get(panelID);
		}
		return null;	
}

function getActiveWindow(stageID) {
	if(stageID == null || stageID == '')
		return getStage(CORE_ActiveWindow.stageID).PageWindows.get(CORE_ActiveWindow.windowID);
	if(getStage(stageID) == null)
		return getStage(CORE_ActiveWindow.stageID).PageWindows.get(CORE_ActiveWindow.windowID);
	return getStage(stageID).PageWindows.get(getStage(stageID).ActiveWindow.windowID);
}

function setActiveWindow(stageID, windowID) {
	CORE_ActiveWindow.stageID = stageID;
	CORE_ActiveWindow.windowID = windowID;
	var activeStage = getStage(stageID);
	activeStage.ActiveWindow.stageID = stageID;
	activeStage.ActiveWindow.windowID = windowID;
	return false;
}

function setActivePanel(stageID, windowID, panelID) {
	CORE_ActivePanel.stageID = stageID;
	CORE_ActivePanel.windowID = windowID;
	CORE_ActivePanel.panelID = panelID;
	if(stageID=='' ) return false;
	var activeStage = getStage(stageID);
	activeStage.ActivePanel.windowID = windowID;
	activeStage.ActivePanel.panelID = panelID;
	getWindow(stageID, windowID).activePanel = panelID;
	return false;
}

//Causes an event to be raised every time a mouse movement occurs so that we can track it.
document.onmousemove = StoreMousePosition;
function StoreMousePosition(e) {
	if(!Prototype.Browser.IE) {
		CORE_Current_Mouse_X = e.pageX;
		CORE_Current_Mouse_Y = e.pageY;
	} else {
		CORE_Current_Mouse_X = window.event.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : (document.body != null ? document.body.scrollLeft : 0));
		CORE_Current_Mouse_Y = window.event.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : (document.body != null ? document.body.scrollTop : 0));
	}
	return false;
}

function StoreMousePositionFrame(e, iframeName) {
	CORE_Current_Mouse_X = e.pointerX;
	CORE_Current_Mouse_Y = e.pointerY;
	return false;
}

function RegDown(stageID, item, event) {
	if(CORE_MOUSE_DOWN_ACTIONS.keys().length == 0) {
		CORE_MOUSE_DOWN_ACTIONS.set("regDown", {
			ItemToMove : getWindow(stageID, item),
			CORE_Last_Mouse_X : CORE_Current_Mouse_X,
			CORE_Last_Mouse_Y : CORE_Current_Mouse_Y,
			LastTimeCheck : setTimeout("MoveSection()", 1)
		});
	} else
		Releaseme();
	if(event != null) Event.stop(event);
	return false;
}

function MoveSection(stageID, item) {
	var itemMoveHolder = CORE_MOUSE_DOWN_ACTIONS.get("regDown");
	if(itemMoveHolder != false) {
		if((CORE_Current_Mouse_X - itemMoveHolder.CORE_Last_Mouse_X) != 0)
			itemMoveHolder.ItemToMove.moveLeft(CORE_Current_Mouse_X - itemMoveHolder.CORE_Last_Mouse_X);
		if((CORE_Current_Mouse_Y - itemMoveHolder.CORE_Last_Mouse_Y) != 0)
			itemMoveHolder.ItemToMove.moveTop(CORE_Current_Mouse_Y - itemMoveHolder.CORE_Last_Mouse_Y);
		itemMoveHolder.CORE_Last_Mouse_X = CORE_Current_Mouse_X;
		itemMoveHolder.CORE_Last_Mouse_Y = CORE_Current_Mouse_Y;
		itemMoveHolder.LastTimeCheck = setTimeout("MoveSection()", 1);
	}
	return false;
}

function WindowSize(stageID, item, RSHorizonta, RSVertical, event) {
	if(CORE_MOUSE_DOWN_ACTIONS.keys().length == 0) {
		CORE_MOUSE_DOWN_ACTIONS.set("windowSize", {
			ItemToResize : getWindow(stageID, item),
			AlowResizeHorizontal : RSHorizonta,
			AlowResizeVertical : RSVertical,
			CORE_Last_Mouse_X : CORE_Current_Mouse_X,
			CORE_Last_Mouse_Y : CORE_Current_Mouse_Y,
			LastTimeCheck : setTimeout("ResizeSection()", 1)
		});
	} else {
		Releaseme();
	}
	if(event != null) Event.stop(event);
	return false;
}

function ResizeSection() {
	var itemHolder = CORE_MOUSE_DOWN_ACTIONS.get("windowSize");
	if(itemHolder != null) {
		if(itemHolder.AlowResizeHorizontal && CORE_Current_Mouse_X - itemHolder.CORE_Last_Mouse_X != 0) 
			itemHolder.ItemToResize.sizeWidth(CORE_Current_Mouse_X - itemHolder.CORE_Last_Mouse_X);
		if(itemHolder.AlowResizeVertical && CORE_Current_Mouse_Y - itemHolder.CORE_Last_Mouse_Y != 0)
			itemHolder.ItemToResize.sizeHeight(CORE_Current_Mouse_Y - itemHolder.CORE_Last_Mouse_Y);
		itemHolder.CORE_Last_Mouse_X = CORE_Current_Mouse_X;
		itemHolder.CORE_Last_Mouse_Y = CORE_Current_Mouse_Y;
		itemHolder.LastTimeCheck = setTimeout("ResizeSection()", 0);
	}
	return false;
}

function frameResize(Item, event) {
	var Object = eval(Item);
	if(CORE_MOUSE_DOWN_ACTIONS.keys().length == 0) {
		CORE_MOUSE_DOWN_ACTIONS.set("frameResize", {
			windowItem : Object,
			CORE_Last_Mouse_X : CORE_Current_Mouse_X,
			CORE_Last_Mouse_Y : CORE_Current_Mouse_Y,
			LastTimeCheck : setTimeout("frameResizer()", 1)
		});
		Object.resizeStart();
	} else
		Releaseme();
	if(event != null) Event.stop(event);
	return false;
}

function frameResizer() {
	var change = 0;
	var resizeInfo = CORE_MOUSE_DOWN_ACTIONS.get("frameResize");
	if(resizeInfo != null) {
		if(resizeInfo.windowItem.VerticalSplit == true) {
			change = CORE_Current_Mouse_X - resizeInfo.CORE_Last_Mouse_X;
			if(change >= 1 || change <= -1) {
				resizeInfo.windowItem.dividerMove(change);
				resizeInfo.CORE_Last_Mouse_X = CORE_Current_Mouse_X;
				resizeInfo.CORE_Last_Mouse_Y = CORE_Current_Mouse_Y;
			}
		} else {
			change = CORE_Current_Mouse_Y - resizeInfo.CORE_Last_Mouse_Y;
			if(change >= 1 || change <= -1) {
				resizeInfo.windowItem.dividerMove(change);
				resizeInfo.CORE_Last_Mouse_X = CORE_Current_Mouse_X;
				resizeInfo.CORE_Last_Mouse_Y = CORE_Current_Mouse_Y;
			}
		}
		resizeInfo.LastTimeCheck = setTimeout("frameResizer()", 1);
	}
}

function Releaseme() {
	var OLD_MOUSE_DOWN_ACTIONS = CORE_MOUSE_DOWN_ACTIONS;
	CORE_MOUSE_DOWN_ACTIONS = $H();
	
	OLD_MOUSE_DOWN_ACTIONS.each(function(mouseDownAction) {
		clearTimeout(mouseDownAction.value.LastTimeCheck);
		if(mouseDownAction.value.finishDrageCall != null)
			setTimeout(mouseDownAction.value.finishDrageCall, 0);
		mouseDownAction.value.windowItem.resizeEnd();
	});
	return false;
}

function BarItemClick(stageID, ID) {
	var theStage = getStage(stageID);
	if(theStage != null)
		theStage.BarItemClick(ID);
	return false;
}

function MinimizeWindow(ShowOrHideThisMenu) {
	var localElement = $(ShowOrHideThisMenu);
	if (content == null) return;
	if (!localElement.visible() )
		localElement.show();
	else
		localElement.hide();
}
var MenuExpand=MinimizeWindow;
var toggleShowHide=MinimizeWindow;
function OpenURLInFloatingWindow(URLdata) {
	var NewWindowConfiguration = {"target":"_blank","windowStage":"FloatingStage","raiseToTop":"y","content":{"type":"panel","name":"main","PrimaryContainer":true,"ContentType":"URL","data": URLdata }};
	OpenWindow(NewWindowConfiguration, NORMAL);
}

function OpenPageInNewWindow(WindowName, LINK) {
	var NewWindowConfiguration = {"target":"_active","raiseToTop":"","content":{"type":"panel","name": LINK.target ,"PrimaryContainer":true,"ContentType":LINK.type,"data": LINK.data }};
	if(WindowName == null)
		OpenWindow(NewWindowConfiguration, NORMAL);
	else
		OpenNamedWindow(WindowName, NewWindowConfiguration, NORMAL);
}

function OpenWindow(PageLayout, windowType) {
	OpenNamedWindow(getGUID(), PageLayout, windowType);
}

function OpenNamedWindow(WindowName, PageLayout, windowType) {
	closeOpenFloatingObject();
	var Newwindow = new pageWindow(WindowName, windowType, PageLayout);
	if(PageLayout == null) 
		PageLayout = TE_HOME_PAGE;
	var ShowInStage = 'DefaultStage';
	if(PageLayout.windowStage != null)
		ShowInStage = PageLayout.windowStage;
	if(ShowInStage.toLowerCase() == "_active") {
		ShowInStage = CORE_ActiveWindow.stageID;
		PageLayout.windowStage = CORE_ActiveWindow.stageID;
	}
	Newwindow.showIn(ShowInStage, getStagePositionType(ShowInStage));
	Newwindow.loadWindow(PageLayout);
	getStage(ShowInStage).sizeContent();
	if(ShowInStage == 'FloatingStage')
		Newwindow.setSize(DEFAULT_FLOATING_WINDOW_WIDTH, DEFAULT_FLOATING_WINDOW_HEIGHT);
	if(PageLayout.raiseToTop != null)
		PageLayout.raiseToTop = 'y';
	if(PageLayout.raiseToTop.toLowerCase() == "y")
		RaiseToTop(ShowInStage, WindowName);
}

function OpenBlankWindow(ShowInStage) {
	closeOpenFloatingObject();
	if(TE_HOME_PAGE.target != "_final" && TE_HOME_PAGE.target != "_blank") {
	        var Newwindow = new pageWindow(getGUID(), NORMAL);
	        Newwindow.showIn(ShowInStage, getStagePositionType(ShowInStage));
	}
	loadNewPageLayout(TE_HOME_PAGE);
	getStage(ShowInStage).sizeContent();
	if(Newwindow != null)
		RaiseToTop(ShowInStage, Newwindow.elementName);
}

function getStageWindow(stageID, windowID) {
	return $("Body_" + stageID + "_" + windowID);
}

function RaiseToTop(stageID, windowID) {
	var activeWindowHeight = 50;
	var baseZIndex = 100;
	var windows = null;
	if($("Body_" + stageID + "_" + windowID) == null)
		return;
	setActiveWindow(stageID, windowID);
	var TheStage = getStage(stageID);
	if(NO_TITLE_BAR != TheStage.titleBarType) 
		baseZIndex = 200;
	//Checks to see if it is already on top and if so it exits
	if($("Body_" + stageID + "_" + windowID).getStyle("zIndex") == baseZIndex + activeWindowHeight)
		return;
	windows = $("Body_" + stageID + "_" + windowID).siblings();
	windows.each(function(ID) {
		ID.setStyle({ "zIndex": baseZIndex});
		if(TheStage.sizable == WINDOW_IS_FULL)
			ID.setStyle({ "display": "none"});
	});
	if($("MenuBar_" + stageID + "_" + windowID) != null) {
		windows = $("MenuBar_" + stageID + "_" + windowID).siblings();
		windows.each(function(ID) {
			var TempID = ID.identify();
			var IDnum = TempID.substring(8);
			var Awindow = $("Body_" + IDnum);
			if(Awindow != null)
				SetBarState(IDnum, 0);
		});
	}
	//moves the selected frame in to position
	$("Body_" + stageID + "_" + windowID).setStyle({"zIndex": baseZIndex + activeWindowHeight});
	$("Body_" + stageID + "_" + windowID).show();
	SetBarState(stageID + "_" + windowID, 1);
	TheStage.sizeContent();
}

function SetBarState(ID, State) {
	var type = IS_TOUCH_SYSTEM ? "touch" : "default";
	State = State > 1 || State < -1 ? 0 : State;
	var windows = null;
	windows = $("WindowBarTitle_" + ID);
	if(windows != null)
		windows.setStyle({ "color": WINDOW_STATUSBAR_STATES[type][State].color});
	windows = null;
	windows = $("MenuBarTitle_" + ID);
	if(windows != null)
		windows.setStyle({ "background": WINDOW_STATUSBAR_STATES[type][State].background});
	windows = null;
	windows = $("MenuBarTitleLeft_" + ID);
	if(windows != null)
		windows.src = WINDOW_STATUSBAR_STATES[type][State].LeftBar;
	windows = null;
	windows = $("MenuBarTitleRight_" + ID);
	if(windows != null)
		windows.src = WINDOW_STATUSBAR_STATES[type][State].RightBar;
	windows = null;
	windows = $("BarTitle_" + ID);
	if(windows != null)
		windows.setStyle({ "background": WINDOW_STATUSBAR_STATES[type][State].background});
	windows = null;
	windows = $("BarTitleLeft_" + ID);
	if(windows != null)
		windows.src = WINDOW_STATUSBAR_STATES[type][State].LeftBar;
	windows = null;
	windows = $("BarTitleRight_" + ID);
	if(windows != null)
		windows.src = WINDOW_STATUSBAR_STATES[type][State].RightBar;
}

function browserWindowSize() {
	var tempOnresize = null;
	var localPageWidth = null;
	var localPageHeight = null;
	if (window.onresize && Prototype.Browser.IE)
		tempOnresize = window.onresize;
	if (!Prototype.Browser.IE && !Prototype.Browser.MobileSafari) {
		localPageWidth = window.innerWidth;
		localPageHeight = window.innerHeight;
	} else {
		var pDimensions = document.viewport.getDimensions();
		localPageWidth = pDimensions.width;
		localPageHeight = pDimensions.height;
	}
	if (localPageWidth != pageWidth || localPageHeight != pageHeight) {
		pageHeight = localPageHeight;
		pageWidth = localPageWidth;
		changeWorkArea();
	}
	if (tempOnresize != null)
		window.onresize = tempOnresize;
}

function changeWorkArea() {
	var masterStage = GET_GLOBAL_OBJECT_CLASS("MASTER_STAGE");
	if(masterStage != null) {
		masterStage.each(function(ID) {
				ID.value.size();
			});
	}
	activeModalPanel.each(function(ID) {
			ID.value.size();
	});
}

function loadPage(PageLayout, PageURL) {
	if(PageLayout != null) {
		if(PageLayout != "") {
			if(Object.isString(PageLayout))
				PageLayout = eval('(' + PageLayout + ')');
			
			if(Object.isArray(PageLayout)) {
				PageLayout.each(function(aPageLayout) {
					loadNewPageLayout(aPageLayout);
				});
			} else 
				loadNewPageLayout(PageLayout);
		}
	}
	if(PageURL != null) {
		if(PageURL != "") {
			var LinkList = PageURL;
			if(Object.isString(LinkList))
				LinkList = eval('(' + decodeURIComponent(LinkList) + ')');
			if(Object.isArray(LinkList))
				LinkList.each(function(aLink) {
					loadLink(aLink);
				});
		}
	}
}

function loadDecodedPage(PageLayout, PageURL) {
	if(PageLayout != null) {
		if(PageLayout != "") {
			if(Object.isString(PageLayout))
				PageLayout = eval('(' + PageLayout + ')');
				
			if(Object.isArray(PageLayout))
				PageLayout.each(function(aPageLayout) {
					loadNewPageLayout(aPageLayout);
				});
			else
				loadNewPageLayout(PageLayout);
		}
	}
	if(PageURL != null)	{
		if(PageURL != "") {
			var LinkList = [];
			if(Object.isString(PageURL))
				LinkList = eval('(' + PageURL + ')');
			else
				LinkList = PageURL;
			if(Object.isArray(LinkList))
				LinkList.each(function(aLink) {
					loadLink(aLink);
				});
		}
	}
}

function loadNewPageLayout(Layout) {
	if(Layout == null)
		return;
	var windowToLoadContent = null;
	var stageToLoadContent = 'DefaultStage';
	if(Layout.windowStage != null)
		stageToLoadContent = Layout.windowStage;
	var target = "_active";
	var windowType = NORMAL;
	if(Layout.windowType != null)
		if(Layout.windowType != "")
			windowType = Layout.windowType;
	if(Layout.target != null)
		if(Layout.target != "")
			target = Layout.target;
	if(target.charAt(0) == "_") {
		if(target == "_blank" || target == '_final')
			OpenWindow(Layout, windowType);
		else {
			windowToLoadContent = getActiveWindow(stageToLoadContent);
			if(windowToLoadContent != null) {
				if(windowToLoadContent.windowFinal)
					OpenWindow(Layout, windowType);
				else {
					windowToLoadContent.loadWindow(Layout);
					if(Layout.raiseToTop)
						RaiseToTop(stageToLoadContent, target);
				}
			} else
				OpenWindow(Layout, windowType);
		}
		return;
	}

	windowToLoadContent = getWindow(stageToLoadContent, target);
	if(windowToLoadContent != null) {
		if(windowToLoadContent.windowFinal)
			OpenNamedWindow(null, Layout, windowType);
		else {
			windowToLoadContent.loadWindow(Layout);
			if(Layout.raiseToTop)
				RaiseToTop(stageToLoadContent, target);
		}
	} else
		OpenNamedWindow(target, Layout, windowType);
}

function loadLink(link) {
	var windowToLoadContent = null;
	var stageToLoadContent = ( link.windowStage == null ?  'DefaultStage' : link.windowStage );
	var LoadInWindow = ( link.window == null ? "" : link.window);
	var target = "_self";
	if(link.target != null)
		if(link.target != "")
			target = link.target;
	if(target == "_self") {
		LoadInWindow = getActiveWindow(stageToLoadContent).elementName;
		target = STAGE_activeStages.get(getActiveWindow(stageToLoadContent).parentStageID).ActivePanel.panelID;
	} else if(LoadInWindow == "_self") 
		LoadInWindow = getActiveWindow(stageToLoadContent).elementName;
	if(LoadInWindow == "")
		LoadInWindow = target;
	if(Object.isString(LoadInWindow)) {
		if(LoadInWindow.startsWith("_")) {
			if(LoadInWindow == "_blank" || LoadInWindow == "_final" )
				OpenPageInNewWindow(null, link);
			else {
				windowToLoadContent = getActiveWindow(stageToLoadContent);
				if(windowToLoadContent != null) {
					if(windowToLoadContent.windowFinal)
						OpenPageInNewWindow(null, link);
					else
						windowToLoadContent.loadPage(target, link);
				} else
					OpenPageInNewWindow(null, link);
			}
			return;
		}
		if(getWindow(stageToLoadContent, LoadInWindow) != null)
			getWindow(stageToLoadContent, LoadInWindow).loadPage(target, link);
		else
			OpenPageInNewWindow(LoadInWindow, link);
		return;
	}

	windowToLoadContent = getWindow(stageToLoadContent, LoadInWindow);
	if(windowToLoadContent != null) {
		if(windowToLoadContent.windowFinal)
			OpenPageInNewWindow(null, link);
		else
			windowToLoadContent.loadPage(target, link);
	} else
		OpenPageInNewWindow(LoadInWindow, link);
}
/**
 * @type	Function
 * @name 	miniLinkLoader
 *
 * @param 	panelA (mixed) Required not null
 * @param	panelB (mixed) Default: null
 *
 *			'panelA' and 'panelB' contain one of the three following:
 * 				- An object containing a list of parameters to call the ACTION_PROCESSOR with:
 * 					{action:"list_table", name:"value", …}
 * 				- A string abbreviated with 'URL:'containing a URL to be loaded in the panel
 * 					"URL:acton.php?action=tutorial&name=DB2v97/automatedCompresion"
 * 				- A string not abbreviated with 'URL:'containing the raw data to be contained in the panel
 * 					"hello world"
 *
 * 			If 'panelB' is null then only one panel will be loaded into the window.
 * 			If you wish a split panel pass in ether an empty object '{}' or an empty string '' for 'panelB' if you want no content to be loaded.
 *
 * @param 	loadInWindow (string) Default: "_final"
 *				The window to load the content into
 *
 * @param	loadInStage (string) Default: "DefaultStage"
 *				The stage to load the content into
 *
 * @param	horizontalSplit (boolean) Default: true
 *				Indicates if the splitPane will be horizontal or vertical
 *
 * @param	splitPercent (float) Between: 0.0-1.0, Default: 0.3
 *				Indicates the split ratio on the panels
 *
 * @return 	none
 *
 *
 * Description: This function allows you to write a miniature version of a link to more easily load content.
 *
 * @example
 * 		Example 1 Link		: onclick='miniLinkLoader({action:"list_table", table:"tablecat"});'
 * 		Example 2 Link w details: onclick='miniLinkLoader({action:"list_table", table:"tablecat"}, {});'
 * 		Example 3 URL		 : onclick='miniLinkLoader("URL:action.php?action=list_table&table=tablecat", "");'
 *
 */
function miniLinkLoader(panelA, panelB, loadInWindow, loadInStage, horizontalSplit, splitPercent) {
	loadInWindow = loadInWindow == null ? "_final" : loadInWindow;
	horizontalSplit = horizontalSplit == null ? true : horizontalSplit;
	horizontalSplit = horizontalSplit ? "h" : "v";
	var layout = {};
	var panelAType = 'RAW';
	var panelAData = "";
	var panelAPOSTDATA = null;
	if(panelA != null) {
		if(Object.isString(panelA)) {
			if(panelA.substring(0,4).toUpperCase() == "URL:") {
				panelAType = 'URL';
				panelAData = encodeURIandNormaMessage(panelA.substring(4));
			} else if(panelA.substring(0,5).toUpperCase() == "HTML:") {
				panelAType = 'LINK';
				panelAData = {
						"type":"HTML",
						"data":{
							"baseDirectory":"./html/",
							"address":encodeURIandNormaMessage(panelA.substring(5)),
							"parameters":[]
						}
				};
			} else
				panelAData = encodeURIandNormaMessage(panelA);
		} else {
			panelAType = 'LINK';
		 	panelAData = {type:"action", data:{}};
			panelAPOSTDATA = panelA;
		}
	}
	var panelBType = 'RAW';
	var panelBData = "";
	var panelBPOSTDATA = null;
	if(panelB != null) {
		if(Object.isString(panelB)) {
			if(panelB.substring(0,4).toUpperCase() == "URL:") {
				panelBType = 'URL';
				panelBData = encodeURIandNormaMessage(panelB.substring(4));
			} else
				panelBData = encodeURIandNormaMessage(panelB);
		} else {
			panelBType = 'LINK';
		 	panelBData = {type:"action", data:{}};
			panelBPOSTDATA = panelB;
		}
	}
	if(panelB == null)
		layout = ({"target"	: loadInWindow,"raiseToTop":"","windowStage" : loadInStage, //"DefaultStage",
			"content"	 : {"type":"panel","name":"main","PrimaryContainer":true,"ContentType":panelAType,"data":panelAData,"POSTDATA":panelAPOSTDATA}
		});
	else
		layout = ({"target":loadInWindow,"panelHeaders":null,"raiseToTop":true,"windowStage":loadInStage,"content":{ "type":"splitPane", "direction":horizontalSplit, "splitPercent":splitPercent, "maxSize":null, "allowResize":true, 
			"panelA":{"type":"panel","name":"main","delayLoad":false,"panelTitle":null,"PrimaryContainer":true,"ContentType":panelAType,"data":panelAData,"overflow":"auto","panelHeaders":null,"POSTDATA":panelAPOSTDATA }, 
			"panelB":{"type":"panel","name":"detail","delayLoad":false,"panelTitle":null,"PrimaryContainer":false,"ContentType":panelBType,"data":panelBData,"overflow":"auto","panelHeaders":null,"POSTDATA":panelBPOSTDATA }}
		});
	loadNewPageLayout(layout);
}

function loadSelectedToForm(FromElement, ToForm) {
	var valueOfSelected = eval( '(' + $F(FromElement) + ')' );
	if(valueOfSelected != null) {
		var FormObjectsToFill = $(ToForm).getElements();
		for(var i=0; i < FormObjectsToFill.length; i++) {
			if(valueOfSelected[FormObjectsToFill[i].name] != null)
				FormObjectsToFill[i].value = valueOfSelected[FormObjectsToFill[i].name];
		}
	}
}

function centerLogonForm(elementToCenter) {
	if($(elementToCenter) == null)
		return;
	var toCenter = $(elementToCenter);
	var pDimensions = toCenter.getDimensions();
	var width = pDimensions.width;
	var height = pDimensions.height;
	var elementParent = toCenter.ancestors();
	pDimensions = elementParent[0].getDimensions();
	var Pwidth = pDimensions.width;
	var Pheight = pDimensions.height;
	width = parseInt(Pwidth/2, 10) - parseInt(width/2, 10);
	height = parseInt(Pheight/2, 10) - parseInt(height/2, 10);
	toCenter.setStyle({'top': height + 'px'});
	toCenter.setStyle({'left': width + 'px'});
}

function setupContainer(parent, layout, otherInfo) {
	var BuiltContainer = null;
	if(layout == null)
		return;
	if(layout.type.toUpperCase() == "SPLITPANE") {
		if(layout.name == null)
			layout.name = "SplitPane_" +getGUID();
		BuiltContainer = new splitPane(layout.name, ((layout.direction.toUpperCase() == "V") ? true : false), layout.splitPercent , layout.maxSize, layout.allowResize, layout.showSplitSpacer, layout.splitSpacerWidth, layout.styleOverride);
		parent.setContainer(BuiltContainer, otherInfo);
		setupContainer(BuiltContainer, layout.panelA, true);
		setupContainer(BuiltContainer, layout.panelB, false);
	} else if(layout.type.toUpperCase() == "PANEL") {
		var ContentType = "LINK";
		if(layout.ContentType != null)
			ContentType = layout.ContentType;
		var Data = ContentType.toUpperCase() == "LINK" ? layout.data : layout.data;
		BuiltContainer = new panel(layout.name, layout.delayLoad, layout.panelTitle, layout.PrimaryContainer, ContentType, Data, layout.overflow, layout.panelHeaders, layout.POSTDATA ,layout.reloadOnConnectionChange);
		parent.setContainer(BuiltContainer, otherInfo);
	} else if(layout.type.toUpperCase() == "STAGE") {
		BuiltContainer = new embeddedStage(layout.name, layout.HasMenuBarContainer, layout.top, layout.botton, layout.left, layout.right, layout.titleBarType, layout.windowOptionType, layout.windowControlTypes, layout.sizable);
		parent.setContainer(BuiltContainer, otherInfo);
	}
	return BuiltContainer;
}

function closeOpenFloatingObject() {
	if(!AllowAutoClosingOfFloatingObject)
		return;
	if(visibleFloatingObject != null) {
		visibleFloatingObject.close();
		CORE_ZINDEX_COUNT = 1000;
	}		
}

function encodeMessage(message, parameters) {
	if(message == null)
		return null;
	if(parameters != null) {
		if(!Object.isHash(parameters)) parameters = $H(parameters);
		parameters.each(function(parameter) {
			message = message.replace(new RegExp("\\?" + parameter.key + "\\?", "gi"), parameter.value);
		});
	}
	GLOBAL_CONSTANTS.each(function(parameter) {
		message = message.replace(new RegExp("\\?" + parameter.key + "\\?", "gi"), parameter.value);
	});
	return message;
}

function encodeURIMessage(message, parameters) {
	if(message == null)
		return null;
	if(parameters != null) {
		if(!Object.isHash(parameters)) parameters = $H(parameters);
		parameters.each(function(parameter) {//l
			message = message.replace(new RegExp(encodeURIComponent("?" + parameter.key + "?"), "gi"), encodeURIComponent(parameter.value));
		});
	}
	GLOBAL_CONSTANTS.each(function(parameter) {
		message = message.replace(new RegExp(encodeURIComponent("?" + parameter.key + "?"), "gi"), encodeURIComponent(parameter.value));
	});
	return message;
}

function encodeURIandNormaMessage(message, parameters) {
	if(message == null)
		return null;
	if(parameters != null) {
		if(!Object.isHash(parameters)) parameters = $H(parameters);
		parameters.each(function(parameter) {
			message = message.replace(new RegExp(encodeURIComponent("?" + parameter.key + "?"), "gi"), encodeURIComponent(parameter.value));
			message = message.replace(new RegExp("\\?" + parameter.key + "\\?", "g"), parameter.value);
		});
	}
	GLOBAL_CONSTANTS.each(function(parameter) {
		message = message.replace(new RegExp(encodeURIComponent("?" + parameter.key + "?"), "gi"), encodeURIComponent(parameter.value));
		message = message.replace(new RegExp("\\?" + parameter.key + "\\?", "g"), parameter.value);
	});
	return message;
}

function encodeObject(message, parameters) {
	var result = null;
	if(message == null || Object.isNumber(message) || Object.isFunction(message) || Object.isElement(message) || message === true || message === false || message === undefined) {
		return message;
	} else if(Object.isString(message)) {
		return encodeMessage(message, parameters);
	} else if(Object.isArray(message)) {
		result = [];
		while(message.length != 0) {
			result.unshift(encodeObject(message.pop(), parameters));
		}
		return result;
	} else if(Object.isHash(message)) {
		result = $H();
		message.each(function(node) {
			result.set(node.key, encodeObject(node.value, parameters));
		});
		return result;
	} else {
		message = $H(message);
		result = $H();
		message.each(function(node) {
			result.set(node.key, encodeObject(node.value, parameters));
		});
		return result.toObject();
	}
	return message;
}

function changeNotification(item) {
	setTimeout("changeNotificationCycle('" + item + "', true, 4, '" + $(item).getStyle("background-color") + "')", 300);
}

function changeNotificationCycle(item, colorCycle, count, originalColor) {
	var itemElement = $(item);
	if(itemElement == null)
		return;
	count--;
	if(count >= 0) {
		if(colorCycle)
			itemElement.setStyle({"backgroundColor": "rgb(250, 250, 200)"});
		else
			itemElement.setStyle({"backgroundColor": originalColor});
		setTimeout("changeNotificationCycle('" + item + "', " + (colorCycle ? "false" : "true") + ", " + count + ", '" + originalColor + "')", 500);
	} else
		itemElement.setStyle({"backgroundColor": originalColor});
}

function changeBorderNotification(itemName) {
	var itemObject = $(itemName);
	if(itemObject == null) return;
	setTimeout("changeBorderNotificationCycle('" + itemName + "', true, 4, '" + itemObject.getStyle("border-color") + "')", 300);
}

function changeBorderNotificationCycle(item, colorCycle, count, originalColor) {
	var itemElement = $(item);
	if(itemElement == null)
		return;
	count--;
	if(count >= 0) {
		if(colorCycle)
			itemElement.setStyle({"border-color": "rgb(250, 250, 200)", "border-style": "solid", "border-width":"3px"});
		else
			itemElement.setStyle({"border-color": originalColor});
		setTimeout("changeBorderNotificationCycle('" + item + "', " + (colorCycle ? "false" : "true") + ", " + count + ", '" + originalColor + "')", 500);
	} else
		itemElement.setStyle({"backgroundColor": originalColor});
}

var InitalisedIFrameList = $H();
function InitializeEditableIFrame(theIframe, iframeName) {
	try {
		var editDoc = theIframe.document;
		if (editDoc.designMode != 'undefined')
			editDoc.designMode = 'on';
	} catch(e) {}
}

function InitializeIFrame(theIframe, iframeName) {
	try {
		Event.observe($(iframeName), 'mousemove',
			function (e) {
				alert(e);
				StoreMousePositionFrame(e, iframeName);
			}
		);
		Event.observe($(iframeName), 'mouseup',
				function (e) {
					Releaseme();
				}
		);
		Event.observe($(iframeName), 'click',
				function (e) {
					Releaseme();
				}
		);
	} catch(e) {
		alert(e);
	}
}

function submiteFormToNewWindowInStage(formID, theStage, action, openToNewWindow) {
	openToNewWindow = openToNewWindow== null ? false : openToNewWindow;
	var FormElement = $(formID);
	if(FormElement != null) {
		if(action != null)
			FormElement.action = action;
		if(!openToNewWindow) {
			var WindowName = getGUID();
			OpenNamedWindow(WindowName, {"target":"_blank","windowStage":theStage,"raiseToTop":"y","content":{"type":"panel","name":"formData","PrimaryContainer":true,"ContentType":"URL","data": "http://a" }}, NORMAL);
			FormElement.target = theStage + "_" + WindowName + "_formData_Object_To_Fit_To_Panel";
		} else
			FormElement.target = "_blank";
		FormElement.submit();
	}
}

function openURLonDefaultStageInIframe(theURL) {
	if(theURL.substring(0,7).toUpperCase() != 'HTTP://' && theURL.substring(0,6).toUpperCase() != 'FTP://')
		theURL = 'HTTP://' + theURL;
	var WindowName = getGUID();
	OpenNamedWindow(WindowName, {"target":"_blank","raiseToTop":"y","content":{"type":"panel","name":"formData","PrimaryContainer":true,"ContentType":"URL","data": theURL }}, NORMAL);
}

function togglePanel(panelToShow, panelToHide) {
	pshow = $(panelToShow);
	phide = $(panelToHide);
	if(pshow != null)
		pshow.show();
	if(phide != null)
		phide.hide();
}

function formateTimeForDisplay(number) {
	if(number > 1 )
		return Math.round(number*1000)/1000.0 + "s";
	else if(number > 0.0001 )
		return Math.round(number*1000000)/1000.0 + "ms";
	else if(number > 0.0000001 )
		return Math.round(number*1000000000)/1000.0 + "µs";
	else if(number > 0.0000000001 )
		return Math.round(number*1000000000000)/1000.0 + "ns";
}

function formatTitle(value) {
	return value.replace(/_/g, " ").toLowerCase().replace( /(^|\s)([a-z])/g , function(m,p1,p2){return p1+p2.toUpperCase(); });;
}

function LOCK_SCREEN() {
	var screenLockPanel = $("SCREEN_LOCK_PANEL");
	if(screenLockPanel == null){
		output = "<div id='SCREEN_LOCK_PANEL' class='modalBackground' style='z-index: " + getTopZindex() + ";'><button onClick='UNLOCK_SCREEN();'>Unlock</button> </div>";
		$("PageBody").insert(output);
		return true;
	}
	return false;
}

function UNLOCK_SCREEN() {
	var screenLockPanel = $("SCREEN_LOCK_PANEL");
	if(screenLockPanel != null)
		screenLockPanel.remove();
}

//This function is here because IE does not follow the relevant spec (ECMA-262 v3 15.5.4.14, pp.103,104).
function stringSplit(stringToSplit, splitExpression) {
	if(!Prototype.Browser.IE)
		return stringToSplit.split(splitExpression);
	else {
		if(Object.isString(splitExpression))
			return stringToSplit.split(splitExpression);
		else {
			var returnArray = [];
			var index = 0;
			var match = stringToSplit.match(splitExpression);
			while(match != null ) {
				index = stringToSplit.indexOf(match);
				returnArray.push(stringToSplit.substr(0,index));
				stringToSplit = stringToSplit.substr(index+(match+"").length);
				match = stringToSplit.match(splitExpression);
			}
			returnArray.push(stringToSplit);
			return returnArray;
		}
	}
}

function cloneObject(object) {
	object = Object.toJSON(object);
	return eval('(' + object + ')');
}

function openGeneralContextMenu(baseNodes) {
	if(baseNodes === false) return;
	CORE_GENERAL_CONTEXT_MENU.baseNodes = baseNodes;
	CORE_GENERAL_CONTEXT_MENU.draw();
	CORE_GENERAL_CONTEXT_MENU.open();
}

function retrieveParameter(aParameter, workingBlock, parameters, executedActions , transform) {
	if(transform==undefined)
		if(aParameter.transform!=null) 
			if(aParameter.transform!="") {
				var value = retrieveParameter(aParameter, workingBlock, parameters, executedActions,aParameter.transform);
				return GLOBAL_TRANSFORMS.convert(value, aParameter);
			} 
	switch(aParameter.parameterType.toUpperCase()) {
		case "RETURNOBJECT" :
			var objectArray = aParameter.value.split(".");
			objectArray = objectArray.reverse();
			var actionName = objectArray.pop();
			if(actionName == null) return aParameter.defaultValue;
			var actionResultNode = executedActions.get(actionName);
			if(actionResultNode == null) 
				if(this.sharedActionResults != null) 
					actionResultNode = this.sharedActionResults.get(actionName);
			if(actionResultNode == null) return aParameter.defaultValue;
			try	{
				while(actionName = objectArray.pop()) 
					actionResultNode = actionResultNode[actionName];
				return actionResultNode;
			} catch(e) {}
			return aParameter.defaultValue;
		case "BLOCKVALUE" :
			if(workingBlock == null) return aParameter.defaultValue;
			if(Object.isString(workingBlock)) {
				try {
					return $F(workingBlock + "_" + aParameter.value);
				} catch(err) {
					if($(workingBlock + "_" + aParameter.value) != null) return $(workingBlock + "_" + aParameter.value).innerHTML;
				}
			} else {
				var blockValue = workingBlock.get(aParameter.value.toUpperCase());
				if(blockValue != null) return blockValue;
			}
			return aParameter.defaultValue;
		case "PARAM" :
		case "PARAMETER" :
		case "CONSTANT" :
			value = GLOBAL_CONSTANTS.get(aParameter.value);
			if(value != null) return value;
			value = parameters.get(aParameter.value);
			if(value != null) return value;
			var objectArray = aParameter.value.split(".");
			objectArray = objectArray.reverse();
			var objectName = objectArray.pop();
			value = GLOBAL_CONSTANTS.get(objectName);
			if(value == null) {
				value = parameters.get(objectName);
				if(value == null) return aParameter.defaultValue;
			}
			while(objectName = objectArray.pop()) 
				value = value[objectName];
			return value;
		case "FIXED" :
			return encodeMessage(aParameter.value, parameters);
		case "DOUBLE" :
			return encodeMessage(encodeMessage(aParameter.value, parameters), parameters);
		case "INPUT" :
			return prompt(aParameter.title==null?aParameter.name:aParameter.title,aParameter.defaultValue==null?"":aParameter.defaultValue);
		default :
			return aParameter.value;
	}
}

function columnTypeName(type){
	switch (type) {
		case "s" : return "String"; 
		case "n" : return "Number";
		case "time" : return "Time";  
		case "date" : return "Date";  
		case "timestamp" : return "Timestamp";  
		default : return "Mixed"; 
	}
}

function columnDBTypeConvertValue(type,value) {
	if (type==null) return value;
	try{
		return this.types[type](value);
	} catch(e) {}
	if(this.types==null) this.types=[];
	var typeLower=type.toLowerCase();
	if(!typeLower.indexOf('char')) this.types[type]= function(value) {return value;};
	else if(!typeLower.indexOf('int')) this.types[type]= function(value) {return parseInt(value,10);};
	else if(!typeLower.indexOf('float')) this.types[type]= function(value) {return parseFloat(value);};
	else if(!typeLower.indexOf('decimal')) this.types[type]= function(value) {return parseFloat(value);};
	else if(!typeLower.indexOf('double')) this.types[type]= function(value) {return parseFloat(value);};
	else if(!typeLower.indexOf('real')) this.types[type]= function(value) {return parseFloat(value);};
	else if(!typeLower.indexOf('numeric')) this.types[type]= function(value) {return parseInt(value,10);};
	else if(!typeLower.indexOf('serial')) this.types[type]= function(value) {return parseInt(value,10);};
	else this.types[type]= function(value) {return value;};
	return this.types[type](value);
}

function columnTypeValueInsertion(type,value){
	if(type==null) type = "s";
	if(typeof value  === 'string' ) {
		if(value.substr(0,1)=="(") return value; 
		if(value.toLowerCase()=='null' || value.substr(0,1)=="?")
			switch (type.toLowerCase()) {
				case "varchar":
				case "l":
				case "s": return "cast("+value+" as varchar(255))";
				case "n": return "cast("+value+" as integer)";
				default : return "cast("+value+" as "+type+" )"; 
			}
		if(value.substr(0,1)=="'") 
			switch (type.toLowerCase()) {
				case "varchar":
				case "l":
				case "s": return "cast("+value+" as varchar(255))";
				case "n": return "cast("+value+" as integer)";
				default : return "cast("+value+" as "+type+" )"; 
			}
	}
	switch (type.toLowerCase()) {
		case "varchar":
		case "s" : return "cast('"+value+"' as varchar(255))";
		case "n" : return "cast("+value+" as integer)";
		default  : return "cast("+value+" as "+type+" )";  
	}
}

function columnTypeInputOnChange(GUID,type,panelId){
	switch (type.toLowerCase()) {
		case "n" : return ' onChange="columnTypeInputCheck(\''+type+'\','+GUID+',this,\''+panelId+'\')"';  
		default : return ""; 
	}
}

function columnTypeInputCheck(type,GUID,inputObject,panelId){
	if(inputObject.value==null) return; 
	switch (type.toLowerCase()) {
		case "n" : 
			if(!isNaN(inputObject.value)) return; 
			alert('Value: '+inputObject.value+ ' is not a number.  Number expected');
			inputObject.value=null;
			return;  
		default : return; 
	}
}

function columnTypeInputOptionsRange(value,from,to,digits,conversion) {
	var options;
	if (digits==null)
		for(var i=from; i <= to; i++) {
			options+='<option' + ( i==value ? ' selected="selected"' : '' ) + ' value="'+i+'">'+conversionAttribute(conversion,i)+'</option>';
		}
	else
		for(var i=from; i <= to; i++) {
			iOut=i.toString();
			iOut='0000000000000000'.substr(0,digits-iOut.length)+iOut;
			options+='<option' + ( i==value ? ' selected="selected"' : '' ) + ' value="'+iOut+'">'+conversionAttribute(conversion,iOut)+'</option>';
		}
	return options;
}

function conversionAttribute(type,value) {
	if(type==null) return value;
	switch(type) {
		case 'month':
			switch (parseInt(value,10)) {
				case 1: return "January";
				case 2: return "February";
				case 3: return "March";
				case 4: return "April";
				case 5: return "May";
				case 6: return "June";
				case 7: return "July";
				case 8: return "August";
				case 9: return "September";
				case 10: return "October";
				case 11: return "November";
				case 12: return "December";
				default : throw "conversionAttribute unknown month : "+parseInt(value,10)+" input value : "+value;
			}
		case 'monthShort':
			switch (parseInt(value,10)) {
			case 1: return "Jan";
			case 2: return "Feb";
			case 3: return "Mar";
			case 4: return "Apr";
			case 5: return "May";
			case 6: return "Jun";
			case 7: return "Jul";
			case 8: return "Aug";
			case 9: return "Sep";
			case 10: return "Oct";
			case 11: return "Nov";
			case 12: return "Dec";
				default : throw "conversionAttribute unknown month : "+parseInt(value,10)+" input value : "+value;
			}
		default : throw "conversionAttribute unknown type :"+type;
	}
}

function getStringAfterDelimiter(value,wordNo,delimiter) {
	if(value.length==0) return "";
	if (delimiter==null) delimiter=" "; 
	if (wordNo==null) wordNo=1; 
	var word=false;
	var wordIndex=0;
	var startWordPos=0;
	for (var i=0;i<value.length;i++) {
		if(value.substr(i,1)==delimiter) {
			if(word) {
				wordIndex++;
				word=false;
			}
		} else
			if(!word) {
				word=true;
				startWordPos=i;
				if(wordIndex==wordNo) break;
			}
	}
	return i<value.length?value.substr(startWordPos):"";
}

//work area that can be used to save data between 
var WORK_AREA = $H();
var WORK_AREA_sequence=0;

function getWorkArea(id) {
	data=WORK_AREA.get(id);
	WORK_AREA.unset(id);
	return data;
}

function saveWorkArea(area) {
	id=WORK_AREA_sequence++;
	WORK_AREA.set(id, area);
	return id;
}

function deleteWorkArea(id) {
	WORK_AREA.unset(id);
}

function getEnclosingElememtId(element) {
	for (currentElement=element;element.previousSibling!=null;element.previousSibling) {
		if(currentElement.id==null) continue;
		if(currentElement.id=="") continue;
		return currentElement.id
	}
	if(element.parentNode==null) throw "Cannot fine enclosing element id";
	return getEnclosingElememtId(element.parentNode);
}

function decodeTableEventElement(event) {
	var element = Event.element(event);
	if(!element.tagName.toUpperCase() == 'TD' || !element.hasClassName('tableCellRoot'))
		element = Event.findElement(event, "td.tableCellRoot");
	if(element == null) return;
	var returnInfo = stringSplit(element.id, /[.]/);
	var elementDetail = {
		 object : element
		,tableObject : GET_GLOBAL_OBJECT('list_table',returnInfo[0])
		,type : returnInfo[1]
		,columnType : ""
		,columnName : ""
		,rowNumber : -1
	}
	switch(elementDetail.type) {
		case "dataTableCell" :
			elementDetail.columnType = returnInfo[2];
			elementDetail.columnName = returnInfo[3];
			elementDetail.rowNumber = returnInfo[4];
			break;
		case "rowNumber" :
			elementDetail.rowNumber = returnInfo[2];
	}
	return elementDetail;
}
