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
var activeContextWindow = null;
var allContextWindows = $H();
var contextIDCounter = 0;
var menuWaitingToOpen = null;
var mouseIsOverContextBase = false;

var closeGivenContextNodeChild = function(nodeName) {
		var parentNode = allContextWindows.get(nodeName);
		if(parentNode == null) return;
		if(parentNode.openChildNode != null)
			parentNode.openChildNode.close();
		parentNode.openChildNode = null;
};
var closeContextMenu = function() {
	if(activeContextWindow != null)
		activeContextWindow.close();
};
var contextNode = Class.create({
	initialize: function(myID, nodeValue, nodeAction, subNodes, subNodeDirection) {
		this.elementID = myID;
		this.elementValue = nodeValue;
		this.elementActionScript = nodeAction;
		this.elementSubNodes = subNodes;
		this.elementSubNodeDirection = subNodeDirection;
	}
});
var createContextMenu = function(baseContainer, baseNodes, nodeDirection, parentStageID, parentWindowID, parentPanelID, menuExpansionType, listStyleType,reloadOnConnectionChange) {
	menuExpansionType = menuExpansionType == null || menuExpansionType == "" ? true : (menuExpansionType.toLowerCase() == "internal" ? false : true);
	var menu = new contextBase(baseContainer, null, EMBEDDED_CONTEXT_WINDOW, baseNodes, nodeDirection, true, CENTER, CENTER, parentStageID, parentWindowID, parentPanelID, menuExpansionType, listStyleType,reloadOnConnectionChange);
	getPanel(parentStageID,parentWindowID,parentPanelID).registerNestedObject(baseContainer, menu);
	menu.nodeFilter();
	return menu;
};
var createContextMenuOnPanelObject = function(baseContainer, baseNodes, nodeDirection, panelObject) {
	var menu = new contextBase(baseContainer, null, EMBEDDED_CONTEXT_WINDOW, baseNodes, nodeDirection, true, CENTER, CENTER);
	if(panelObject != null)
		panelObject.registerNestedObject(baseContainer, menu);
	menu.nodeFilter();
	return menu;
};
var delayContextBaseOpen = function(ID, theDelay) {
	menuWaitingToOpen = setTimeout("allContextWindows.get(\"" + ID + "\").open();", theDelay);
};

var contextBase = Class.create(basePageElement, {
			
	contextBaseWindowCSS : {
		"default" : "contextBaseWindow",
		"touch" : "contextBaseWindow_touch"
	},
	
	menuCSSClass: {
		"default": {
			"base":"contextBaseLIMenu",
			"root":"contextRootLIMenu"	
		},
		"touch":{
			"base":"contextBaseLIMenu_touch",
			"root":"contextRootLIMenu_touch"
		}
	},
		
	linkCSSClass: {
		"default": {
			"base":"contextBaseLILink",
			"root":"contextRootLILink"	
		},
		"touch":{
			"base":"contextBaseLILink_touch",
			"root":"contextRootLILink"
		}
	},
	
	initialize: function($super, parentContainer, parentNode, isEmbedded, baseNodes, nodeDirection, rootNode, submenuVerticalPosition, submenuHorizontalPosition, parentStageID, parentWindowID, parentPanelID, menuExpansionType, listStyleType,reloadOnConnectionChange) {
		if (menuWaitingToOpen != null) 
			clearTimeout(menuWaitingToOpen);
		var myID = parentNode == null ? "CONTEXTBASE_" + ++contextIDCounter : parentNode;
		$super(myID, "CONTEXTBASE");
		this.parentStageID = parentStageID;
		this.parentWindowID = parentWindowID;
		this.parentPanelID = parentPanelID;
		this.elementParent = parentContainer;
		this.baseNodes = baseNodes;
		this.baseNodesPassed = baseNodes;
		this.callBackNode = null;
		this.isEmbedded = isEmbedded;
		this.isRootNode = rootNode;
		this.nodeDirection = nodeDirection;
		this.reloadOnConnectionChange=reloadOnConnectionChange==undefined?false:reloadOnConnectionChange;
		this.windowIsVisible = false;
		this.mouseLoad=false;
		this.menuText = "";
		this.setEmpty();
		this.submenuVerticalPosition = submenuVerticalPosition;
		this.submenuHorizontalPosition = submenuHorizontalPosition;
		this.openChildNode = null;
		this.openMenuObject = null;
		this.menuExpansionType = menuExpansionType == null ? true : menuExpansionType;
		this.listStyleType = listStyleType == null || listStyleType == "" ? "none" : listStyleType;
		allContextWindows.set(this.elementUniqueID, this);
		this.load();
	},
	load: function() {
		if (this.baseNodes == null) return;
		if (Object.isString(this.baseNodes)) {
			this.callBackNode = this.baseNodes;
			this.getMenu();
			return;
		} 
		if (Object.isArray(this.baseNodes)) {
			this.draw();
			return;
		} 
		if (this.baseNodes.nodeType != "DELAYLOADBRANCH") return;
		this.callBackNode = this.baseNodes;
	    this.mouseLoad=(this.baseNodes.delayLoad == "mouse");
	    if(!this.mouseLoad) 
			this.getMenu();
	},
	reloadOnConnectIfRequired: function()	{
		if(!this.reloadOnConnectionChange) return;
		this.resetMenu();
		this.close();
		this.baseNodes=this.baseNodesPassed;
		this.load();
		this.nodeFilter();
	},
	getRootNode: function()	{
		var parent = allContextWindows.get(this.elementParent);
		if(parent == null) return null
		if(parent.isEmbedded && parent.isRootNode)
			return this.elementName;
		return parent.getRootNode();
	},
	
	getMenu: function(openMenu) {
		this.mouseLoad=false;
		if (this.callBackNode == null) return;
		this.setEmpty();
		var parameters = new Object();
		var thisObject = this;
		if(Object.isString(this.callBackNode))
			parameters.baseMenuFolder = this.callBackNode;
		else
			parameters.rootCallBack = this.callBackNode.rootCallBack;
		parameters.USE_CONNECTION = getActiveDatabaseConnection();
		parameters.returntype = "JSON";
		
		new Ajax.Request(MENU_PROCESSOR, {
			'parameters': parameters,
			'method': 'post',
			'onComplete': function(transport) {
				thisObject.draw();
				if(openMenu)
					thisObject.open();
				thisObject.nodeFilter();
			},
			'onSuccess': function(transport) {
				thisObject.baseNodes = transport.responseJSON;
			},
			'onFailure': function(transport) {
				thisObject.baseNodes = [{
					elementID: 'LEAF',
					elementValue: CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.MENU_LOAD_ERROR,
					elementActionScript: '',
					elementSubNodes: null,
					elementSubNodeDirection: null
				}];
			},
			'onException': function(transport,exception) {
				thisObject.baseNodes = [{
					elementID: 'LEAF',
					elementValue: encodeMessage(CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.MENU_LOAD_EXCEPTION, {EXCEPTION_MESSAGE:exception}),
					elementActionScriptScript: '',
					elementSubNodes: null,
					elementSubNodeDirection: null
				}];
			}
		});
	},
	close: function() {
		var thisNode = null;
		if(this.menuExpansionType) {
			if (this.openChildNode != null) {
				this.openChildNode.close();
				this.openChildNode = null;
			}
			if (this.openMenuObject != null) {
				this.openMenuObject.remove();
				this.openMenuObject = null
				this.windowIsVisible = false;
			}
			if (activeContextWindow != null)
				if (activeContextWindow.elementUniqueID == this.elementUniqueID)
					activeContextWindow = null;
			if (visibleFloatingObject != null)
				if (visibleFloatingObject.elementUniqueID == this.elementUniqueID)
					visibleFloatingObject = null;
		} else {
			if(this.openMenuObject != null)	{
				this.openMenuObject.remove();
				this.openMenuObject = null;
			}
			thisNode = $(this.elementUniqueID);
			if(thisNode != null)
				thisNode.update(thisNode.innerHTML.replace(/\(-\)/, "(+)"));
		}
	},
	open: function(event) {
		var parentNode = null;
		var thisNode = null;
		if (this.mouseLoad)
			this.getMenu();
		
		if(this.menuExpansionType) {
			parentNode = allContextWindows.get(this.elementParent);
			if (parentNode != null) {
				if (parentNode.openChildNode != null) 
					parentNode.openChildNode.close();
				parentNode.openChildNode = this;
			}
			AllowAutoClosingOfFloatingObject = true;
			if (!this.isEmbedded && this.isRootNode) {
				closeOpenFloatingObject();
				activeContextWindow = this;
				visibleFloatingObject = this;
			}
			if (!this.isEmbedded) 
				$("PageBody").insert(this.menuText);

			this.openMenuObject = $(this.elementUniqueID + "_TopNode");
			
			if (this.openMenuObject != null) {
				this.openMenuObject.show();
				this.nodeFilter();
				if (!this.isEmbedded) 
					this.position();
			}
		} else {
			this.openMenuObject = $(this.elementUniqueID + "_TopNode");
			
			if(this.openMenuObject == null) {
				parentNode = allContextWindows.get(this.elementParent);
				if (parentNode != null) {
					if (parentNode.openChildNode != null)
						parentNode.openChildNode.close();
					parentNode.openChildNode = this;
				}
				
				thisNode = $(this.elementUniqueID);

				if (thisNode != null) {
					thisNode.update(thisNode.innerHTML.replace(/\(\+\)/, "(-)"));
					thisNode.insert(this.menuText);
				}
				this.openMenuObject = $(this.elementUniqueID + "_TopNode");

				if (this.openMenuObject != null) {
					this.openMenuObject.show();
					this.nodeFilter();
				}
			} else {
				this.openMenuObject.remove();
				thisNode = $(this.elementUniqueID);
				if(thisNode != null)
					thisNode.update(thisNode.innerHTML.replace(/\(-\)/, "(+)"));
			}
		}
		this.windowIsVisible = true;
	},
	nodeFilter: function() {
		if(this.baseNodes == null) return;
		var Node = null;
		var nodeElement = null;
		
		for(var i = 0; i<this.baseNodes.length; i++) {
			Node = this.baseNodes[i];
			if(Node == null) continue;
			nodeElement = $(Node.internalID);
			if(nodeElement == null) continue;	
			if(Node.tag != null) {
				if(Node.tag.toUpperCase().indexOf("NON_TOUCH_SYSTEM") == -1)
					if(Node.tag.toUpperCase().indexOf("FOR_TOUCH_SYSTEM") != -1) {
						nodeElement.hide();
						continue;	
					}
			}	
			if(isDatabaseConnectionVersion(Node)) 
				nodeElement.show();
			else 
				nodeElement.hide();
		}
	},
	position: function() {
		if (this.openMenuObject == null) return;
		if (this.openMenuObject.getStyle("display") != "block") return;
		var buttonOffset = 0
			,scrollOffset = 0
			,buttonWidth = 0
			,buttonHeight = 0;
		
		var parentElement = $(this.elementUniqueID);
		if(parentElement == null) {
			if(this.baseNodes.elementPosition!=null) {
				parentElement = $(this.baseNodes.elementPosition);
				buttonOffset = parentElement.cumulativeOffset();
				buttonLeft = buttonOffset[0];
				buttonTop = buttonOffset[1];
			} else {
				buttonLeft = CORE_Current_Mouse_X;
				buttonTop = CORE_Current_Mouse_Y;
			}
			buttonOffset = {
					 left: buttonLeft
					,top: buttonTop
				};
		} else {
			var pDimensions = parentElement.getDimensions();
			scrollOffset = parentElement.cumulativeScrollOffset();
			buttonOffset = parentElement.cumulativeOffset();
			buttonOffset[0] -= scrollOffset[0];
			buttonOffset[1] -= scrollOffset[1];
			buttonOffset.left -= scrollOffset.left;
			buttonOffset.top -= scrollOffset.top;
			
			buttonWidth = pDimensions.width;
			buttonHeight = pDimensions.height;
		}
		var pDimensions = this.openMenuObject.getDimensions();
		var sizingObject = {
			WindowPositionTop: false,
			WindowPositionLeft : false,
			windowHeight	 : pageHeight,
			windowWidth		: pageWidth,
			buttonOffset	 : buttonOffset,
			buttonWidth		: buttonWidth,
			buttonHeight	 : buttonHeight,
			spButtonLeft	 : buttonOffset.left,
			spButtonRight	: pageWidth - (buttonOffset.left + buttonWidth),
			spButtonCenterV	: buttonOffset.left + (buttonWidth/2),
			spButtonTop		: buttonOffset.top,
			spButtonBottom	 : pageHeight - (buttonOffset.top + buttonHeight),
			spButtonCenterH	: buttonOffset.top + (buttonHeight/2),
			containerWidth	 : pDimensions.width,
			containerHeight	: pDimensions.height
		};
		
		var overflow = "hidden";
		if(sizingObject.containerWidth > sizingObject.windowWidth)	{
			sizingObject.containerWidth = sizingObject.windowWidth-10;
			overflow = "auto";
		}
		if(sizingObject.containerHeight > sizingObject.windowHeight) {
			sizingObject.containerHeight = sizingObject.windowHeight-10;
			overflow = "auto";
		}
		
		var Menulocation = ( this.submenuHorizontalPosition != null ? this.submenuHorizontalPosition : RIGHT ) + "." + (this.submenuVerticalPosition != null ? this.submenuVerticalPosition : BOTTOM);
		switch(Menulocation) {
			case RIGHT + "." + TOP:
				if(menuPosition.RT(sizingObject)) break;
				if(menuPosition.RB(sizingObject)) break;
				if(menuPosition.RC(sizingObject)) break;
				menuPosition.RCI(sizingObject);
				break;
			case RIGHT + "." + BOTTOM:
				if(menuPosition.RB(sizingObject)) break;
				if(menuPosition.RT(sizingObject)) break;
				if(menuPosition.RC(sizingObject)) break;
				menuPosition.RCI(sizingObject);
				break;
			case RIGHT + "." + CENTER:
				if(menuPosition.RC(sizingObject)) break;
				menuPosition.RCI(sizingObject);
				break;
			case LEFT + "." + TOP:
				if(menuPosition.LT(sizingObject)) break;
				if(menuPosition.LB(sizingObject)) break;
				if(menuPosition.RC(sizingObject)) break;
				menuPosition.RCI(sizingObject);
				break;
			case LEFT + "." + BOTTOM:
				if(menuPosition.LB(sizingObject)) break;
				if(menuPosition.LT(sizingObject)) break;
				if(menuPosition.RC(sizingObject)) break;
				menuPosition.RCI(sizingObject);
				break;
			case LEFT + "." + CENTER:
				if(menuPosition.LC(sizingObject)) break;
				if(menuPosition.RC(sizingObject)) break;
				menuPosition.RCI(sizingObject);
				break;
			case CENTER + "." + TOP:
				if(menuPosition.CT(sizingObject)) break;
				if(menuPosition.CB(sizingObject)) break;
				if(menuPosition.RC(sizingObject)) break;
				menuPosition.RCI(sizingObject);
				break;
			case CENTER + "." + BOTTOM:
				if(menuPosition.CB(sizingObject)) break;
				if(menuPosition.CT(sizingObject)) break;
				if(menuPosition.RC(sizingObject)) break;
				menuPosition.RCI(sizingObject);
				break;
			case CENTER + "." + CENTER:
				menuPosition.CC(sizingObject);
				break;
			default:
				break;
		}
		this.openMenuObject.setStyle({ "overflow" : overflow, "top": sizingObject.WindowPositionTop + "px", "left": sizingObject.WindowPositionLeft + "px", "height" : sizingObject.containerHeight + "px", "width": sizingObject.containerWidth + "px", "zIndex" :getTopZindex()});
	},
	resetMenu: function(){
		for(i=0; i<this.baseNodes.length; i++) {
			if(this.baseNodes.nodeType == "BRANCH")	{
				this.baseNodes[i].menuObject.close();
				this.baseNodes[i].menuObject.destroy();
				this.baseNodes[i].menuObject = null;
			}
		}
		if (this.openMenuObject == null) return;
		this.openMenuObject.remove();
		this.openMenuObject = null;
	},
	destroy: function($super) {
		allContextWindows.unset(this.elementUniqueID);
		this.resetMenu();
		$super();
	},
	
	openFirstLink: function(GUID) {
		if(this.baseNodes==null) return false;
		for(var i=0; i<this.baseNodes.length; i++) {
			switch(this.baseNodes[i].nodeType) {
				case "BRANCH":
					if(this.baseNodes[i].menuObject.openFirstLink(GUID)) return true;
					break;
				case "LEAF":
					if(GUID == null || (GUID != null && GUID == this.baseNodes[i].GUID)) {
						loadPage(this.baseNodes[i].elementPageWindows, this.baseNodes[i].elementLinkList);
						return true;
					}					
					break;
			}
		}
		return false;
	},
	
	setEmpty: function() {
		if (this.isEmbedded) {
			buildTextForMenu = "<span class='contextBaseWindow' style='display:block;position:static;'";
		} else if(!this.menuExpansionType) {
			buildTextForMenu = "<div class='contextBaseWindow' style='display:none;padding-left:5px;'";
		} else {
			buildTextForMenu = "<div class='contextBaseWindow' style='display:none;z-index:" + getTopZindex() + ";position:absolute;border: 1px solid #a4a4a4;left:0px;top:0px;'";
		}
		buildTextForMenu += " id='" + this.elementUniqueID + "_TopNode'"
						+ 	" onmouseout='if(menuWaitingToOpen != null){clearTimeout(menuWaitingToOpen);} mouseIsOverContextBase=false;' onmouseover='mouseIsOverContextBase=true;'>"
						+ 	"<img style='float:none;' src='images/loadingpage_small_transparent.gif'/>";

		if (this.isEmbedded) {
			buildTextForMenu += "</span>";
			$(this.elementParent).update(buildTextForMenu);
		} else 
			buildTextForMenu += "</div>";
		this.menuText = buildTextForMenu;
	},
	
	draw: function() {
		if(this.baseNodes.length==1) 
			if(this.callBackNode!=null)
				if(this.callBackNode.replacement) { 
					var node=$(this.callBackNode.internalID);
					this.callBackNode.elementValue=this.baseNodes[0].elementValue;
					node.textContent=this.baseNodes[0].elementValue;
					this.baseNodes=this.baseNodes[0].elementSubNodes;
				}

		var ID;
		var buildTextForMenu = "";
		var offset = { left: 0, top: 0 };
		var menuCSSClass = this.menuCSSClass[IS_TOUCH_SYSTEM ? "touch" : "default"][(this.isEmbedded || !this.menuExpansionType) ? "root" : "base"];
		var linkCSSClass = this.linkCSSClass[IS_TOUCH_SYSTEM ? "touch" : "default"][(this.isEmbedded || !this.menuExpansionType) ? "root" : "base"];
		var verticalPosition = BOTTOM;
		var horizontalPosition = RIGHT;
		var LocalAction = "";
		var contextBaseWindowCSS = this.contextBaseWindowCSS[IS_TOUCH_SYSTEM ? "touch" : "default"];
		
		if (this.isEmbedded) {
			horizontalPosition = LEFT;
			buildTextForMenu += "<span class='" + contextBaseWindowCSS + "' style='display:block;'" + (IS_TOUCH_SYSTEM ? "font-size:18px;" : "") + "";
		} else if(!this.menuExpansionType) {
			buildTextForMenu += "<div class='" + contextBaseWindowCSS + "' style='background-color: #e1e1e1;display:none;padding-left:5px;" + (IS_TOUCH_SYSTEM ? "font-size:18px;" : "") + "'";
		} else {
			buildTextForMenu += "<div class='" + contextBaseWindowCSS + "' style='background-color: #e1e1e1;display:none;z-index:" + getTopZindex() + ";position:absolute;border: 1px solid #a4a4a4;left:0px;top:0px;" + (IS_TOUCH_SYSTEM ? "font-size:18px;" : "") + "'";
		}
		buildTextForMenu += " id='" + this.elementUniqueID + "_TopNode'"
						+	" onmouseout='if(menuWaitingToOpen != null){clearTimeout(menuWaitingToOpen);} mouseIsOverContextBase=false;' onmouseover='mouseIsOverContextBase=true;'>"
						+ 	"<ol style='list-style-type:" + this.listStyleType + "' class='"
						+ 		(this.nodeDirection ? 'contextBaseULVertical' : 'contextBaseULHorizontal')
						+ 			(IS_TOUCH_SYSTEM ? '_touch' : '' )
						+ 	"' >";
			
		var localMenuText = "";
		if(this.baseNodes != null) {
			var Node = null;
			var tag = null;
			var nodeElementID = null;
			for(var i = 0; i<this.baseNodes.length; i++) {
				Node = this.baseNodes[i];
				if(Node == null) continue;
				tag = "a";
				
				var versionNote = "";
				if(Node.minVersion != 0 && Node.minVersion != null)	{
					versionNote = " (" + Node.minVersion;
					if(Node.minFixPack != 0 && Node.minFixPack != null)
						versionNote += "fp" + Node.minFixPack;
					if(Node.maxVersion != 0 && Node.maxVersion != null)
						versionNote += "-" + Node.maxVersion;
					else
						versionNote += "+";
					versionNote += ") ";
				} else if(Node.maxVersion != 0 && Node.maxVersion != null)
					versionNote = " (" + Node.maxVersion + "-) ";
			
				Node.internalID = (++contextIDCounter) + "_contextNode";
					
				nodeElementID = Node.elementID == null ? "MENUNODE_" + (++contextIDCounter) : Node.elementID;
					
				if (Node.nodeType == null) 
					Node.nodeType = nodeElementID;
				Node.nodeType = Node.nodeType.toUpperCase();
					
				if (Node.nodeType == "LINE") {
					if(Node.elementValue != null && Node.elementValue != 'none')
						localMenuText += "<li class='contextBaseBreak' id='" + Node.internalID + "' style='list-style:none;'><font class='" + (IS_TOUCH_SYSTEM ? "contextBaseBreakText_touch" : "contextBaseBreakText") + "'>" + Node.elementValue + versionNote + "</font></li>";
					else
						localMenuText += "<li class='contextBaseBreakNoText' id='" + Node.internalID + "' style='list-style:none;'>&nbsp;</li>";
				} else if (Node.nodeType == "BRANCH" || Node.nodeType == "DELAYLOADBRANCH" || this.mouseLoad ) {
					LocalAction = "";
					if(this.menuExpansionType) {
						if (this.isEmbedded) 
							LocalAction += " onMouseOver='if(activeContextWindow != null && !allContextWindows.get(\"" + Node.internalID + "\").windowIsVisible){delayContextBaseOpen(\"" +Node.internalID + "\", 0);}'";
						else 
							LocalAction += " onMouseOver='delayContextBaseOpen(\"" +Node.internalID + "\", 500);'";
					}
						
					if (this.isEmbedded && this.menuExpansionType) 
						LocalAction += " onmousedown='if(activeContextWindow == null){allContextWindows.get(\"" +Node.internalID + "\").open(event);}else{closeOpenFloatingObject();}'";
					else
						LocalAction += " onmousedown='allContextWindows.get(\"" +Node.internalID + "\").open(event);'";
					Node.menuObject = new contextBase(this.elementUniqueID, Node.internalID, false, (Node.nodeType == "BRANCH" ? Node.elementSubNodes : Node ) , VERTICAL, this.isEmbedded , verticalPosition, horizontalPosition, this.parentStageID, this.parentWindowID, this.parentPanelID, this.menuExpansionType, this.listStyleType , Node.reloadOnConnectionChange);
					localMenuText += "<li class='" + menuCSSClass + "' id='" + Node.internalID + "' valign='center'><a id='" + nodeElementID + "' " + LocalAction + " >" + Node.elementValue + versionNote + (this.menuExpansionType ? "" : " (+)") + "</a></li>";
				} else if (Node.nodeType == "LEAF") {
					LocalAction = "";
					var elementAction = Node.elementAction;
					if (this.isEmbedded || !this.menuExpansionType) 
						LocalAction += " onMouseOver='if(activeContextWindow != null) {closeGivenContextNodeChild(\"" + this.elementParent + "\");}' ";

					if (elementAction == "" || elementAction == null) {
						if(Node.elementActionScript != null) {
							elementAction = ' onClick="runTEScript(\'' + Node.internalID + '\', allContextWindows.get(\'' + this.elementUniqueID + '\').baseNodes[' + i + '].elementActionScript, null, \'' +Node.internalID + '\', null, null, \'' + this.parentStageID + '\', \'' + this.parentWindowID + '\', \'' + this.parentPanelID + '\', null);"';
						} else if(Node.elementFloatingLink != null) {
							var DisplayPoint = (this.isEmbedded && this.isRootNode ? Node.internalID : this.getRootNode() );
																		//myID,                            Type,                                  Data,                          parentTrigger,hideMenuBar,                          reloadOnConnectionChange,                          panelHeaders,                          baseWidth,                          baseHeight,                         loadContentOnShow,                          reloadContentOnShow
							var object = getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID);
							if(object != null) {
								var floatingPanelObject = new floatingPanel(Node.internalID + "_floatingPanel", Node.elementFloatingLink.ContentType, Node.elementFloatingLink.data, DisplayPoint, Node.elementFloatingLink.hideMenuBar, Node.elementFloatingLink.reloadOnConnectionChange, Node.elementFloatingLink.panelHeaders, Node.elementFloatingLink.baseWidth, Node.elementFloatingLink.baseHight, Node.elementFloatingLink.loadContentOnShow, Node.elementFloatingLink.reloadContentOnShow);
								object.registerNestedObject(floatingPanelObject);
								floatingPanelObject.draw();
							}
							elementAction = ' onClick="FLOATINGPANEL_activeFloatingPanels.get(\'' + Node.internalID + '_floatingPanel\').show_and_size(' + (DisplayPoint != null ? "'" + DisplayPoint + "'" : DisplayPoint) + ');"';
							
						} else if(Node.elementLinkList != null || Node.elementPageWindows != null) {
							elementAction = ' onClick="loadPage(allContextWindows.get(\'' + this.elementUniqueID + '\').baseNodes[' + i + '].elementPageWindows, allContextWindows.get(\'' + this.elementUniqueID + '\').baseNodes[' + i + '].elementLinkList);"';
						}
					}
					if (elementAction == "" || elementAction == null) {
						linkCSSClass = IS_TOUCH_SYSTEM ? "contextBase_touch" : "contextBase";
						tag = "span";
						elementAction = "";
					}
					localMenuText += "<li onclick='closeContextMenu();' class='" + linkCSSClass + "' id='" +Node.internalID + "' valign='center'><" + tag + " id='" + nodeElementID + "' " + elementAction + LocalAction + " >" + Node.elementValue +versionNote + "</" + tag + "></li>";
				}
			}
		}
		buildTextForMenu += localMenuText;
		buildTextForMenu += "</ol>";
		
		if (this.isEmbedded) {
			buildTextForMenu += "</span>";
			$(this.elementParent).update(buildTextForMenu);
		} else 
			buildTextForMenu += "</div>";
		
		this.menuText = buildTextForMenu;
		if (this.windowIsVisible == true) {
			this.close();
			this.open();
		}
	}
});

var menuPosition = {
	
	RT : function(sizingObject) {
		if(sizingObject.spButtonRight > sizingObject.containerWidth && (sizingObject.spButtonTop + sizingObject.buttonHeight) > sizingObject.containerHeight ) {
			sizingObject.WindowPositionTop = (sizingObject.spButtonTop + sizingObject.buttonHeight) - sizingObject.containerHeight;
			sizingObject.WindowPositionLeft = sizingObject.spButtonLeft + sizingObject.buttonWidth;
			return true;
		} 
		if(sizingObject.spButtonLeft > sizingObject.containerWidth && (sizingObject.spButtonTop + sizingObject.buttonHeight) > sizingObject.containerHeight ) {
			sizingObject.WindowPositionTop = (sizingObject.spButtonTop + sizingObject.buttonHeight) - sizingObject.containerHeight;
			sizingObject.WindowPositionLeft = sizingObject.spButtonLeft - sizingObject.containerWidth;
			return true;
		}
		return false;
	},
	RB : function(sizingObject) {
		if(sizingObject.spButtonRight > sizingObject.containerWidth && (sizingObject.spButtonBottom + sizingObject.buttonHeight) > sizingObject.containerHeight ) {
			sizingObject.WindowPositionTop = sizingObject.spButtonTop;
			sizingObject.WindowPositionLeft = sizingObject.spButtonLeft + sizingObject.buttonWidth;
			return true;
		} 
		if(sizingObject.spButtonLeft > sizingObject.containerWidth && (sizingObject.spButtonBottom + sizingObject.buttonHeight) > sizingObject.containerHeight ) {
			sizingObject.WindowPositionTop = sizingObject.spButtonTop;
			sizingObject.WindowPositionLeft = sizingObject.spButtonLeft - sizingObject.containerWidth;
			return true;
		}
		return false;
	},
	RC : function(sizingObject) {
		var containterHalfSize = (sizingObject.containerHeight/2) +1;
		var buttonHalfHight = (sizingObject.buttonHeight/2);
		if(sizingObject.spButtonRight > sizingObject.containerWidth) {
			sizingObject.WindowPositionLeft = sizingObject.spButtonLeft + sizingObject.buttonWidth;
		} else if(sizingObject.spButtonLeft > sizingObject.containerWidth) {
			sizingObject.WindowPositionLeft = sizingObject.spButtonLeft - sizingObject.containerWidth;
		}
		if(sizingObject.WindowPositionLeft == false) return false;
		if(containterHalfSize < (buttonHalfHight + sizingObject.spButtonTop) && containterHalfSize < (buttonHalfHight + sizingObject.spButtonBottom)) {
			sizingObject.WindowPositionTop = (buttonHalfHight + sizingObject.spButtonTop) - containterHalfSize;
		} else if(containterHalfSize < (buttonHalfHight + sizingObject.spButtonTop)) {
			sizingObject.WindowPositionTop = 0;
		} else {
			sizingObject.WindowPositionTop = sizingObject.windowHeight - sizingObject.containerHeight;
		}
		return true;	
	},
	RCI : function(sizingObject) {
		if( sizingObject.spButtonLeft > sizingObject.spButtonRight) {
			sizingObject.WindowPositionLeft = 0;
		} else {
			sizingObject.WindowPositionLeft = sizingObject.windowWindow - sizingObject.containerWidth;
		}
		if(sizingObject.WindowPositionLeft == false) return false;
		if(containterHalfSize < (buttonHalfHight + sizingObject.spButtonTop) && containterHalfSize < (buttonHalfHight + sizingObject.spButtonBottom)) {
			sizingObject.WindowPositionTop = (buttonHalfHight + sizingObject.spButtonTop) - containterHalfSize;
		} else if(containterHalfSize < (buttonHalfHight + sizingObject.spButtonTop)) {
			sizingObject.WindowPositionTop = 0;
		} else {
			sizingObject.WindowPositionTop = sizingObject.windowHeight - sizingObject.containerHeight;
		}
		return true;	
	},
	LT : function(sizingObject) {
		if(sizingObject.spButtonTop > sizingObject.containerHeight) {
			var containterHalfSize = (sizingObject.containerWidth/2) +1;
			var buttonHalfWidth = (sizingObject.buttonWidth/2);
			sizingObject.WindowPositionTop = sizingObject.spButtonTop - sizingObject.containerHeight;
			if((sizingObject.spButtonRight + sizingObject.buttonWidth) > sizingObject.containerWidth) {
				sizingObject.WindowPositionLeft = sizingObject.spButtonLeft;
			} else if((sizingObject.spButtonLeft + sizingObject.buttonWidth) > sizingObject.containerWidth) {
				sizingObject.WindowPositionLeft = (sizingObject.spButtonLeft + sizingObject.buttonWidth) - sizingObject.containerWidth;
			} else if((sizingObject.spButtonLeft + buttonHalfWidth) > containterHalfSize && (sizingObject.spButtonRight + buttonHalfWidth) > containterHalfSize) { 
				sizingObject.WindowPositionLeft = (sizingObject.spButtonLeft + buttonHalfWidth) - containterHalfSize;
			} else if((sizingObject.spButtonRight + buttonHalfWidth) > containterHalfSize) {
				sizingObject.WindowPositionLeft = sizingObject.windowWidth - sizingObject.containerWidth;
			} else {
				sizingObject.WindowPositionLeft = 0;
			}
			return true;
		}
		return false;
	},
	LB : function(sizingObject) {
		var containterHalfSize = (sizingObject.containerWidth/2) +1;
		var buttonHalfWidth = (sizingObject.buttonWidth/2);
		if(sizingObject.spButtonBottom > sizingObject.containerHeight) {
			sizingObject.WindowPositionTop = sizingObject.spButtonTop + sizingObject.buttonHeight;
			if((sizingObject.spButtonRight + sizingObject.buttonWidth) > sizingObject.containerWidth) {
				sizingObject.WindowPositionLeft = sizingObject.spButtonLeft;
			} else if((sizingObject.spButtonLeft + sizingObject.buttonWidth) > sizingObject.containerWidth) {
				sizingObject.WindowPositionLeft = (sizingObject.spButtonLeft + sizingObject.buttonWidth) - sizingObject.containerWidth;
			} else if((sizingObject.spButtonLeft + buttonHalfWidth) > containterHalfSize && (sizingObject.spButtonRight + buttonHalfWidth) > containterHalfSize) { 
				sizingObject.WindowPositionLeft = (sizingObject.spButtonLeft + buttonHalfWidth) - containterHalfSize;
			} else if((sizingObject.spButtonRight + buttonHalfWidth) > containterHalfSize) {
				sizingObject.WindowPositionLeft = sizingObject.windowWidth - sizingObject.containerWidth;
			} else {
				sizingObject.WindowPositionLeft = 0;
			}
			return true;
		}
		return false;
	},
	LC : function(sizingObject) {
		var containterHalfSize = (sizingObject.containerHeight/2) +1;
		var buttonHalfHight = (sizingObject.buttonHeight/2);
		if(sizingObject.spButtonRight > sizingObject.containerWidth) {
			sizingObject.WindowPositionLeft = sizingObject.spButtonLeft - sizingObject.containerWidth;
		} else if(sizingObject.spButtonLeft > sizingObject.containerWidth) {
			sizingObject.WindowPositionLeft = sizingObject.spButtonLeft + sizingObject.buttonWidth;
		}
		if(sizingObject.WindowPositionLeft == false) return false;
		if(containterHalfSize < (buttonHalfHight + sizingObject.spButtonTop) && containterHalfSize < (buttonHalfHight + sizingObject.spButtonBottom)) {
			sizingObject.WindowPositionTop = (buttonHalfHight + sizingObject.spButtonTop) - containterHalfSize;
		} else if(containterHalfSize < (buttonHalfHight + sizingObject.spButtonTop)) {
			sizingObject.WindowPositionTop = 0;
		} else {
			sizingObject.WindowPositionTop = sizingObject.windowHeight - sizingObject.containerHeight;
		}
		return true;	
	},
	CT : function(sizingObject) {
		if(sizingObject.spButtonTop > sizingObject.containerHeight) {
			var containterHalfSize = (sizingObject.containerWidth/2) +1;
			var buttonHalfWidth = (sizingObject.buttonWidth/2);
			sizingObject.WindowPositionTop = sizingObject.spButtonTop - sizingObject.containerHeight;
			if((sizingObject.spButtonLeft + buttonHalfWidth) > containterHalfSize && (sizingObject.spButtonRight + buttonHalfWidth) > containterHalfSize) { 
				sizingObject.WindowPositionLeft = (sizingObject.spButtonLeft + buttonHalfWidth) - containterHalfSize;
			} else if((sizingObject.spButtonRight + buttonHalfWidth) > containterHalfSize) {
				sizingObject.WindowPositionLeft = sizingObject.windowWidth - sizingObject.containerWidth;
			} else {
				sizingObject.WindowPositionLeft = 0;
			}
			return true;
		}
		return false;
	},
	CB : function(sizingObject) {
		var containterHalfSize = (sizingObject.containerWidth/2) +1;
		var buttonHalfWidth = (sizingObject.buttonWidth/2);
		if(sizingObject.spButtonBottom > sizingObject.containerHeight) {
			sizingObject.WindowPositionTop = sizingObject.spButtonTop + sizingObject.buttonHeight;
			if((sizingObject.spButtonLeft + buttonHalfWidth) > containterHalfSize && (sizingObject.spButtonRight + buttonHalfWidth) > containterHalfSize) { 
				sizingObject.WindowPositionLeft = (sizingObject.spButtonLeft + buttonHalfWidth) - containterHalfSize;
			} else if((sizingObject.spButtonRight + buttonHalfWidth) > containterHalfSize) {
				sizingObject.WindowPositionLeft = sizingObject.windowWidth - sizingObject.containerWidth;
			} else {
				sizingObject.WindowPositionLeft = 0;
			}
			return true;
		}
		return false;	
	},
	CC : function(sizingObject) {
		
		var containterHalfHight = (sizingObject.containerHeight/2) +1;
		var buttonHalfHight = (sizingObject.buttonHeight/2);
		var containterHalfWidth = (sizingObject.containerWidth/2) +1;
		var buttonHalfWidth = (sizingObject.buttonWidth/2);

		if(containterHalfHight < (buttonHalfHight + sizingObject.spButtonTop) && containterHalfHight < (buttonHalfHight + sizingObject.spButtonBottom)) {
			sizingObject.WindowPositionTop = (buttonHalfHight + sizingObject.spButtonTop) - containterHalfHight;
		} else if(containterHalfHight < (buttonHalfHight + sizingObject.spButtonTop)) {
			sizingObject.WindowPositionTop = 0;
		} else {
			sizingObject.WindowPositionTop = sizingObject.windowHeight - sizingObject.containerHeight;
		}
		
		if((sizingObject.spButtonLeft + buttonHalfWidth) > containterHalfWidth && (sizingObject.spButtonRight + buttonHalfWidth) > containterHalfWidth) { 
			sizingObject.WindowPositionLeft = (sizingObject.spButtonLeft + buttonHalfWidth) - containterHalfWidth;
		} else if((sizingObject.spButtonRight + buttonHalfWidth) > containterHalfWidth) {
			sizingObject.WindowPositionLeft = sizingObject.windowWidth - sizingObject.containerWidth;
		} else {
			sizingObject.WindowPositionLeft = 0;
		}
		return false;	
	}	
};