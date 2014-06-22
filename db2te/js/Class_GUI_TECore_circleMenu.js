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

var CIRCLE_MENU = null;
function CIRCLE_MENU_LOAD_IMAGES() {
		CIRCLE_MENU =
				{SUB_MENU_IMAGE : new Image()
				,LINK_MENU_IMAGE : new Image()
				,BACK_MENU_IMAGE : new Image()
				};
		CIRCLE_MENU.SUB_MENU_IMAGE.src = IMAGE_BASE_DIRECTORY + 'circleMenu/submenu.png';
		CIRCLE_MENU.LINK_MENU_IMAGE.src = IMAGE_BASE_DIRECTORY + 'circleMenu/link.png';
		CIRCLE_MENU.BACK_MENU_IMAGE.src = IMAGE_BASE_DIRECTORY + 'circleMenu/back.png';
	}
function getCIRCLE_MENU(image) {
		if (CIRCLE_MENU==nul) CIRCLE_MENU_LOAD_IMAGES();
		return CIRCLE_MENU[image];
	};

var ACTIVE_CIRCLE_MENU = null;

function CIRCLE_MENU_CLOSE(event, cascade) {
	if(ACTIVE_CIRCLE_MENU != null)
		ACTIVE_CIRCLE_MENU.close(event, cascade);
}

function CIRCLE_MENU_MOVE(event) {
	if(ACTIVE_CIRCLE_MENU != null)
		ACTIVE_CIRCLE_MENU.moveProcess(event);
}

var circleMenu = Class.create(basePageElement, {
	initialize: function($super, parentContainer, parentNode, isEmbedded, baseNodes, nodeDirection, rootNode, submenuVerticalPosition, submenuHorizontalPosition, parentStageID, parentWindowID, parentPanelID, menuExpansionType, listStyleType) {
		if (menuWaitingToOpen != null)
			clearTimeout(menuWaitingToOpen);
		var myID = parentNode == null ? "CONTEXTBASE_" + ++contextIDCounter : parentNode;
		$super(myID, "CONTEXTBASE");
		this.parentStageID = parentStageID;
		this.parentWindowID = parentWindowID;
		this.parentPanelID = parentPanelID;
		this.elementParent = parentContainer;
		this.baseNodes = baseNodes;
		this.callBackNode = null;
		this.isEmbedded = isEmbedded;
		this.isRootNode = rootNode;
		this.nodeDirection = nodeDirection;
		this.windowIsVisible = false;
		this.mouseLoad=false;
		this.menuText = "";
		this.setEmpty();
		this.submenuVerticalPosition = submenuVerticalPosition;
		this.submenuHorizontalPosition = submenuHorizontalPosition;
		this.childNodes = $H();
		this.openChildNode = null;
		this.menuTextLength = 0;
		this.MENU_CENTER_X = 0;
		this.MENU_CENTER_Y = 0;
		this.LAST_MOUSE_POINT = {x:0,y:0,tangent:0,distance:0};
		
		this.pointColor = "black";
		
		//holds the menu structure
		this.coreMenuStructure = [];
		this.coreMenuStructure = [];
		//Menu point that have been rendered
		this.MENU_POINTS = [];
		this.MENU_DIAMETER = 0;
		
		this.CURRENT_SELECTED_OBJECT = null;
		
		this.menuExpansionType = menuExpansionType == null ? true : menuExpansionType;
		this.listStyleType = listStyleType == null || listStyleType == "" ? "none" : listStyleType;
		allContextWindows.set(this.elementUniqueID, this);
		if (Object.isString(this.baseNodes)) {
			this.callBackNode = this.baseNodes;
			this.getMenu();
		}
		else if (Object.isArray(this.baseNodes)) {
			this.draw();
		}
		else if (this.baseNodes != null) {
			if (this.baseNodes.nodeType == "DELAYLOADBRANCH") {
				this.callBackNode = this.baseNodes;
			    this.mouseLoad=(this.baseNodes.delayLoad == "mouse");
			    if(!this.mouseLoad)
					this.getMenu();
			}
		}
	},

	reloadOnConnectIfRequired: function()	{
		if(!this.reloadOnConnectionChange) return;
		this.resetMenu();
		this.close();
		this.baseNodes=this.baseNodesPassed;
		this.load();
		this.nodeFilter();
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
	
	getRootNode: function()	{
		return null;
	},
	
	getMenu: function(openMenu, isFirstLevel) {
		this.mouseLoad=false;
		if (this.callBackNode == null)
			return;
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
			'onSuccess': function(transport) {
				thisObject.baseNodes = transport.responseJSON;
				thisObject.draw();
				if(openMenu)
					thisObject.drawMenu(isFirstLevel);

			},
			'onFailure': function(transport) {
				thisObject.baseNodes = [{
					elementID: 'LEAF',
					elementValue: CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.MENU_LOAD_ERROR,
					elementActionScript: '',
					elementSubNodes: null,
					elementSubNodeDirection: null
}];
					thisObject.draw();
					if(openMenu)
						thisObject.drawMenu(isFirstLevel);
				},
				'onException': function(transport,exception) {
					thisObject.baseNodes = [{
						elementID: 'LEAF',
						elementValue: encodeMessage(CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.MENU_LOAD_EXCEPTION, {EXCEPTION_MESSAGE:exception}),
						elementActionScriptScript: '',
						elementSubNodes: null,
						elementSubNodeDirection: null
}];
						thisObject.draw();
						if(openMenu)
							thisObject.drawMenu(isFirstLevel);
			}
		});
	},
	close: function(event, cascade) {
		this.windowIsVisible = false;
		thisNode = $(this.elementUniqueID + "_root");
		if (thisNode != null)
			thisNode.remove();
		if(this.oldActive_Menu == null) {
			thisNode = $("TOUCH_MENU")
			if (thisNode != null)
				thisNode.remove();
		}
		this.TOUCH_MENU = null;
		ACTIVE_CIRCLE_MENU = this.oldActive_Menu;

		if(cascade)
			if(ACTIVE_CIRCLE_MENU != null) {
				ACTIVE_CIRCLE_MENU.CURRENT_SELECTED_OBJECT = null;
				ACTIVE_CIRCLE_MENU.close(event, cascade);
			}

		if(this.CURRENT_SELECTED_OBJECT != null)
			if(this.CURRENT_SELECTED_OBJECT.type.toLowerCase() == "leaf")
				eval(this.CURRENT_SELECTED_OBJECT.action);
	},
	open: function(event, isFirstLevel, X, Y) {
		this.pointColor = "black";
		if(isFirstLevel == null) isFirstLevel = true;
		var parentNode = null;
		var thisNode = null;
		this.TOUCH_MENU = null;
		if(X == null || Y == null) {
			if(event == null && object != null) {
				var object = $(this.elementParent);
				CORE_Current_Mouse_X = object.cumulativeOffset().left;
				CORE_Current_Mouse_Y = object.cumulativeOffset().top;
			} else if(event != null) {
				if( event.touches && event.touches.length) { 
					CORE_Current_Mouse_X = event.touches[0].clientX;
					CORE_Current_Mouse_Y = event.touches[0].clientY;
				} else { 
					CORE_Current_Mouse_X = event.clientX;
					CORE_Current_Mouse_Y = event.clientY;
				}
			}
		} else {
			CORE_Current_Mouse_X = X;
			CORE_Current_Mouse_Y = Y;
		}
		this.LAST_MOUSE_POINT =  {x:CORE_Current_Mouse_X,y:CORE_Current_Mouse_Y,'tangent':0,'distance':0};
		if (this.mouseLoad)
			this.getMenu(true, isFirstLevel);
		else
			this.drawMenu(isFirstLevel)
		if(event != null) {
			event.stopPropagation();
			event.preventDefault();
		}
		return false;
	},
	
	moveProcess: function(event) {
		event.processed = true;
		
		if(this.TOUCH_MENU == null) {
			this.TOUCH_MENU = $('TOUCH_MENU');
			if(this.TOUCH_MENU != null)
				this.TOUCH_MENU.setStyle({ "zIndex": 64000 });
		}
		var canvas = this.TOUCH_MENU;
		if(this.TOUCH_MENU == null) {
			$('PageBody').insert('<canvas id="TOUCH_MENU" width="500px" height="500px" style="padding:0px;margin:0px;position:absolute;top:0px;left:0px;" onmouseup="CIRCLE_MENU_CLOSE(event, true)" ontouchend="CIRCLE_MENU_CLOSE(event, true);" onmousemove="CIRCLE_MENU_MOVE(event)" ontouchmove="CIRCLE_MENU_MOVE(event)"></canvas>');
			this.TOUCH_MENU = $('TOUCH_MENU');
			this.TOUCH_MENU.setStyle({ "zIndex": 64000 });
			canvas = this.TOUCH_MENU;
			canvas.height = window.innerHeight;
			canvas.width = window.innerWidth;
		}
		var ctx = canvas.getContext("2d");
		
		var CORE_Current_Mouse_X = 0;
		var CORE_Current_Mouse_Y = 0;
		if( event.touches && event.touches.length) { 
			CORE_Current_Mouse_X = event.touches[0].clientX;
			CORE_Current_Mouse_Y = event.touches[0].clientY;
		} else { 
			CORE_Current_Mouse_X = event.clientX;
			CORE_Current_Mouse_Y = event.clientY;
		}
		
		/*ctx.beginPath();
		ctx.arc(CORE_Current_Mouse_X, CORE_Current_Mouse_Y, 3, 0, Math.PI*2, true); 
		ctx.closePath();
		ctx.fill();*/

		x = this.MENU_CENTER_X - CORE_Current_Mouse_X;
		y = -(this.MENU_CENTER_Y - CORE_Current_Mouse_Y);
		var tangent = Math.atan(x/y);
		var distanceFromMenu = Math.sqrt(x*x+y*y);
		
		if(Math.sqrt(x*x+(y-60)*(y-60)) < 30) {
			ctx.clearRect(0,0,canvas.width,canvas.height);
			this.close(event, false)
			return;	
		}
		
		if(y<0) tangent = tangent + Math.PI*1.5;
		else if(x>0 && y>0) tangent = tangent + Math.PI*0.5;
		else if(x<0 && y>0) tangent = tangent + Math.PI*2.5;
	
		currentSelectedObjectUpdated = false;
		old_CURRENT_SELECTED_OBJECT = this.CURRENT_SELECTED_OBJECT;
		if(this.MENU_DIAMETER + this.menuTextLength + 25 > distanceFromMenu) {
		var arcSize = 0;
		for(var i = 0; i < this.MENU_POINTS.length; i++) {
			arcSize = this.MENU_POINTS[i].menuArcSize;
			if(this.MENU_DIAMETER + this.menuTextLength + 25 > distanceFromMenu && distanceFromMenu > this.MENU_DIAMETER - 20 && this.MENU_POINTS[i].type.toLowerCase() == "leaf") {
					if(this.MENU_POINTS[i].menuTangent+arcSize > tangent && this.MENU_POINTS[i].menuTangent-arcSize < tangent) {
						doDraw = false;
						currentSelectedObjectUpdated = true;
						if(this.CURRENT_SELECTED_OBJECT == null) {
							this.CURRENT_SELECTED_OBJECT = this.MENU_POINTS[i];
							this.MENU_POINTS[i].entryPoint = null;
							doDraw = true;
						} else if(this.CURRENT_SELECTED_OBJECT.id != this.MENU_POINTS[i].id) {
							ctx.clearRect(0,0,canvas.width,canvas.height);
							this.CURRENT_SELECTED_OBJECT.menuExit = true;
							this.CURRENT_SELECTED_OBJECT = this.MENU_POINTS[i];
							this.MENU_POINTS[i].entryPoint = null;
							doDraw = true;
						}
						//Highlight Menu Button
						if(doDraw) {
							ctx.clearRect(0,0,canvas.width,canvas.height);
							var lingrad = ctx.createLinearGradient(0,40,0,-40);
							lingrad.addColorStop(0, 'rgba(255,255,0,0.0)');
							lingrad.addColorStop(0.5, 'rgba(255,255,0,0.5)');
							lingrad.addColorStop(1, 'rgba(255,255,0,0)');
							ctx.save();
							ctx.translate(this.MENU_CENTER_X, this.MENU_CENTER_Y);
							ctx.rotate(this.MENU_POINTS[i].menuTangent);
							ctx.translate(this.MENU_DIAMETER,0);
							ctx.fillStyle = lingrad;
							ctx.beginPath();
							ctx.moveTo(0, 40);  
							ctx.lineTo(this.menuTextLength+50,  40); 
							ctx.lineTo(this.menuTextLength+50, -40);  
							ctx.lineTo(0, -40);  
							ctx.closePath();  
							ctx.fill();
							
							lingrad = ctx.createRadialGradient(0,0,0,0,0,40);
							lingrad.addColorStop(0, 'rgba(255,255,0,0.5)');
							lingrad.addColorStop(1, 'rgba(255,255,0,0)');
							ctx.beginPath();
							ctx.fillStyle = lingrad;
							ctx.arc(0, 0, 40, Math.PI*0.5, Math.PI*1.5, false); 
							ctx.closePath();
							ctx.fill();
							
							ctx.translate(this.menuTextLength+50,0);
							lingrad = ctx.createRadialGradient(0,0,0,0,0,40);
							lingrad.addColorStop(0, 'rgba(255,255,0,0.5)');
							lingrad.addColorStop(1, 'rgba(255,255,0,0)');
							ctx.beginPath();
							ctx.fillStyle = lingrad;
							ctx.arc(0, 0, 40, Math.PI*0.5, Math.PI*1.5, true); 
							ctx.closePath();
							ctx.fill();
							
							ctx.restore();
							this.pointColor = "purple";
						}
						
						break;
					}
				}
				if(this.MENU_POINTS[i].type.toLowerCase() == "branch" && this.MENU_DIAMETER + 30 > distanceFromMenu && this.MENU_DIAMETER - 30 < distanceFromMenu)  {
					if(this.MENU_POINTS[i].menuTangent+arcSize > tangent && this.MENU_POINTS[i].menuTangent-arcSize < tangent) {
						currentSelectedObjectUpdated = true;
						if(this.CURRENT_SELECTED_OBJECT == null) {
							this.CURRENT_SELECTED_OBJECT = this.MENU_POINTS[i];
							this.MENU_POINTS[i].entryPoint = null;
						} else if(this.CURRENT_SELECTED_OBJECT.id != this.MENU_POINTS[i].id) {
							ctx.clearRect(0,0,canvas.width,canvas.height);
							this.CURRENT_SELECTED_OBJECT.menuExit = true;
							this.CURRENT_SELECTED_OBJECT = this.MENU_POINTS[i];
							this.MENU_POINTS[i].entryPoint = null;
						}
						if(this.CURRENT_SELECTED_OBJECT.entryPoint == null) {
							var x1  = x+this.MENU_POINTS[i].x;
							var y1  = y-this.MENU_POINTS[i].y;
							if(Math.sqrt(x1*x1+y1*y1) <=30) { 
								this.pointColor = "red";
								var entryPointTangent = Math.atan(x1/y1);
								if(y<0) entryPointTangent = entryPointTangent + Math.PI*1.5;
								else if(x>0 && y>0) entryPointTangent = entryPointTangent + Math.PI*0.5;
								else if(x<0 && y>0) entryPointTangent = entryPointTangent + Math.PI*2.5;
								entryPointTangent = entryPointTangent/Math.PI;
								this.CURRENT_SELECTED_OBJECT.entryPoint = entryPointTangent;
							}
						}
						break;
					}
				}
				if(distanceFromMenu > this.MENU_DIAMETER + 20 && this.LAST_MOUSE_POINT.distance < this.MENU_DIAMETER - 20) {
					if(this.MENU_POINTS[i].menuTangent+arcSize > tangent && this.MENU_POINTS[i].menuTangent-arcSize < tangent) {
						var X = this.MENU_CENTER_X+this.MENU_POINTS[i].x;
						var Y = this.MENU_CENTER_Y+this.MENU_POINTS[i].y;
						this.pointColor = "green";
						eval(this.MENU_POINTS[i].action);
						this.LAST_MOUSE_POINT = null;
						this.MENU_POINTS[i].entryPoint = null;
						ctx.clearRect(0,0,canvas.width,canvas.height);
						event.preventDefault();
						return false;
					}
				}
			}
		}
		var id = -1;
		if(old_CURRENT_SELECTED_OBJECT != null) {
			if(old_CURRENT_SELECTED_OBJECT.type.toLowerCase() == "branch" && old_CURRENT_SELECTED_OBJECT.entryPoint != null) {
				var x1  = x+old_CURRENT_SELECTED_OBJECT.x;
				var y1  = y-old_CURRENT_SELECTED_OBJECT.y;
				if(Math.sqrt(x1*x1+y1*y1) >=30 || this.CURRENT_SELECTED_OBJECT.menuExit) { 
					var X = this.MENU_CENTER_X+old_CURRENT_SELECTED_OBJECT.x;
					var Y = this.MENU_CENTER_Y+old_CURRENT_SELECTED_OBJECT.y;
					eval(old_CURRENT_SELECTED_OBJECT.action);
					old_CURRENT_SELECTED_OBJECT.entryPoint = null;
					this.LAST_MOUSE_POINT = null;
					ctx.clearRect(0,0,canvas.width,canvas.height);
					event.preventDefault();
					return false;
				}
			}
		}
		if(!currentSelectedObjectUpdated) {
			if(old_CURRENT_SELECTED_OBJECT != null)
				ctx.clearRect(0,0,canvas.width,canvas.height);
			this.CURRENT_SELECTED_OBJECT = null;
		}
		this.LAST_MOUSE_POINT = {x:CORE_Current_Mouse_X,y:CORE_Current_Mouse_Y,'tangent':tangent,'distance':distanceFromMenu};
		event.preventDefault();
		return false;
	},
	
	nodeFilter: function() {
		this.menuStructure = [];
		var Node = null;
		for(var i=0; i < this.coreMenuStructure.length; i++) {
			Node = this.coreMenuStructure[i];
			if(Node.tag != null) {
				if(IS_TOUCH_SYSTEM) {
					if(Node.tag.toUpperCase().indexOf("NON_TOUCH_SYSTEM") != -1)
						;
					else if(Node.tag.toUpperCase().indexOf("FOR_TOUCH_SYSTEM") != -1)
						this.menuStructure.push(Node);
					else 
						this.menuStructure.push(Node);
				} else {
					if(Node.tag.toUpperCase().indexOf("NON_TOUCH_SYSTEM") != -1) 
						this.menuStructure.push(Node);
					else if(Node.tag.toUpperCase().indexOf("FOR_TOUCH_SYSTEM") != -1)
						;
				}
			} else
				this.menuStructure.push(Node);
		}
	},
	
	drawMenu: function(isFirstLevel) {
		this.oldActive_Menu = ACTIVE_CIRCLE_MENU;
		ACTIVE_CIRCLE_MENU = this;
		
		this.nodeFilter();
		
		var numberOfMenuPoints = this.menuStructure.length;
		
		this.menuTextLength = 50; //px
		
		var menuItemSize = 45;
		var menuItemArcSeparation = 0;
		var menuArcRadius = 0;
		var arcSet = [];
		
		var size = 0;
		for(i=0; i<numberOfMenuPoints; i++) {
			size = this.menuStructure[i].text.length * 8 + 50;
			if(size > this.menuTextLength)
				this.menuTextLength = size;
		}
		
		this.windowIsVisible = true;
		this.MENU_CENTER_X = CORE_Current_Mouse_X;
		this.MENU_CENTER_Y = CORE_Current_Mouse_Y;
		
		//If this is not a first level menu, the menu needs to be moved away from the edge so that the uses can navigate back
		if(!isFirstLevel)
			if(this.MENU_CENTER_Y+100 >= window.innerHeight)
				this.MENU_CENTER_Y = window.innerHeight-100;
		
		thisNode = $(this.elementUniqueID + "_root");
		if (thisNode != null)
			thisNode.remove();
			
		$("PageBody").insert('<canvas id="' + this.elementUniqueID  + "_root" + '" width="500px" height="500px" style="z-index:' + getTopZindex() + ';padding:0px;margin:0px;position:absolute;top:0px;left:0px;" onmouseup="CIRCLE_MENU_CLOSE(event, true)" ontouchend="CIRCLE_MENU_CLOSE(event, true);" onmousemove="CIRCLE_MENU_MOVE(event)" ontouchmove="CIRCLE_MENU_MOVE(event)"></canvas>');
		
		var canvas = $(this.elementUniqueID + "_root");
		var ctx = canvas.getContext("2d");
		canvas.height = window.innerHeight;
		canvas.width = window.innerWidth;
		ctx.save();
		
		ctx.clearRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = 'rgba(255,255,255,0.5)';
		ctx.fillRect (0,0,canvas.width,canvas.height);
		ctx.fill();
		
		var menuIndex = 0;
		var testRadius = 0;
		var loops = 0;
		var fingerMask = 0;
		var avalibleArc = {};
		var foundSuffishenSpace = false;
		menuArcRadius = (Math.ceil((menuItemSize*numberOfMenuPoints)/( 2 * Math.PI * 5))-1) * 5;
		if(menuArcRadius < 100) menuArcRadius = 100;
		while(!foundSuffishenSpace && menuArcRadius < window.innerHeight-this.menuTextLength) {
			menuArcRadius += 5;
			testRadius = this.menuTextLength + menuArcRadius;
			fingerMask = Math.asin(60/menuArcRadius)/Math.PI;
			avalibleArc = {
					left:{
						bottom:[2.5-fingerMask,2],
						top:[2,1.5]
					},
					right:{
						top:[1.5,1],
						bottom:[1,0.5+fingerMask]
					}
			};
			
			if(this.MENU_CENTER_Y < testRadius) {
				var angle_A = Math.acos( this.MENU_CENTER_Y/testRadius)/Math.PI;
				avalibleArc.right.top[0] = 1.5-angle_A;	
				avalibleArc.left.top[1] = 1.5+angle_A;
			} else if(this.MENU_CENTER_Y + testRadius > window.innerHeight) {
				var angle_A = Math.acos( (window.innerHeight-this.MENU_CENTER_Y)/testRadius)/Math.PI;
				var leftAngle =  0.5 + angle_A;
				var rightAngle = 2.5 - angle_A;
				
				if(leftAngle > 0.5+fingerMask)
					avalibleArc.right.bottom[1] = leftAngle;
				if(rightAngle < 2.5-fingerMask)
					avalibleArc.left.bottom[0] = rightAngle;
			}
			if(this.MENU_CENTER_X < testRadius) {
				var angle_A = Math.acos( this.MENU_CENTER_X/testRadius)/Math.PI;
				avalibleArc.right.top[1] = 1+angle_A;	
				avalibleArc.right.bottom[0] = 1-angle_A;
			} else if(this.MENU_CENTER_X + testRadius > window.innerWidth) {
				var angle_A = Math.acos( (window.innerWidth-this.MENU_CENTER_X)/testRadius)/Math.PI;
				avalibleArc.left.top[1] = 2+angle_A;	
				avalibleArc.left.bottom[0] = 2-angle_A;
			}
			
			arcSet = [avalibleArc.right.bottom];
			if(arcSet[0][0] == avalibleArc.right.top[1])
				arcSet[0][0] = avalibleArc.right.top[0];
			else
				arcSet.unshift(avalibleArc.right.top);
			
			if(Math.floor(((arcSet[0][0] - arcSet[0][1])/2 * menuArcRadius * 2 * Math.PI) / menuItemSize) < numberOfMenuPoints) {
				if(arcSet[0][0] == avalibleArc.left.top[1])
					arcSet[0][0] = avalibleArc.left.top[0];
				else
					arcSet.unshift(avalibleArc.left.top);
					
				if(arcSet[0][0] == avalibleArc.left.bottom[1])
					arcSet[0][0] = avalibleArc.left.bottom[0];
				else
					arcSet.unshift(avalibleArc.left.bottom);
			} else {
				arcSet.unshift(avalibleArc.left.top);
					
				if(arcSet[0][0] == avalibleArc.left.bottom[1])
					arcSet[0][0] = avalibleArc.left.bottom[0];
				else
					arcSet.unshift(avalibleArc.left.bottom);
			}
			var processArcSet = arcSet;
			arcSet = [];
			//Here we are condensing the 4 arc 
			for(var i=0; i < processArcSet.length; i++)
				if(processArcSet[i][1] < processArcSet[i][0])
					arcSet.push(processArcSet[i]);
				
			var pointSpace = 0;
			processArcSet = arcSet;
			arcSet = [];
			for(var i=0; i < processArcSet.length; i++) {
				var points = Math.floor(((processArcSet[i][0] - processArcSet[i][1])/2 * menuArcRadius * 2 * Math.PI) / menuItemSize);
				pointSpace += points;
				if(points > 0) {
					arcSet.push(processArcSet[i]);
					if(menuItemArcSeparation > (processArcSet[i][0] - processArcSet[i][1]) / points || menuItemArcSeparation == 0)
						menuItemArcSeparation = (processArcSet[i][0] - processArcSet[i][1]) / points;
				}
				if(pointSpace > numberOfMenuPoints) 
					break;
			}
			 
			if(pointSpace > numberOfMenuPoints)
				foundSuffishenSpace = true;
		}
		
		this.MENU_POINTS = [];
		this.MENU_DIAMETER = menuArcRadius;
		ctx.save();
		ctx.translate(this.MENU_CENTER_X,this.MENU_CENTER_Y);
		if(this.MENU_CENTER_X <  window.innerWidth/2)
			arcSet = arcSet.reverse();
		var activeArc = arcSet.pop();
		var currentArcPossition = 0.5;
		var offset = 0;
		if(arcSet.length == 0)
			offset = ((activeArc[0]-activeArc[1]) - menuItemArcSeparation*numberOfMenuPoints)/2;
		for(i=0; i<numberOfMenuPoints; i++) {
			if(activeArc[0]-currentArcPossition*menuItemArcSeparation < activeArc[1]) {
				activeArc = arcSet.pop();
				if(activeArc == null)
					break;
				currentArcPossition = 0.5;
				if(arcSet.length == 0)
					offset = ((activeArc[0]-activeArc[1]) - menuItemArcSeparation*numberOfMenuPoints)/2;
			}
			var menuTangent = (activeArc[0]-(currentArcPossition*menuItemArcSeparation + offset)) * Math.PI;
			var x = Math.cos(menuTangent);
			var y = Math.sin(menuTangent);
			
			this.MENU_POINTS.push({
				id:getGUID(),
				text:this.menuStructure[i].text,
				action:this.menuStructure[i].action,
				callback:"",
				type:this.menuStructure[i].type.toLowerCase(),
				"x":x*menuArcRadius,
				"y":y*menuArcRadius,
				"menuTangent":menuTangent,
				"menuArcSize":menuItemArcSeparation + offset
			});
			
			ctx.save();
			ctx.rotate(menuTangent);
			
			/*ctx.beginPath();
			ctx.moveTo(this.MENU_DIAMETER-20, 0);  
			ctx.lineTo(this.MENU_DIAMETER + this.menuTextLength+25, 0);
			ctx.closePath();
			ctx.stroke();
			ctx.save();
			ctx.rotate(-(menuItemArcSeparation + offset));
			ctx.beginPath();
			ctx.moveTo(this.MENU_DIAMETER-20, 0);  
			ctx.lineTo(this.MENU_DIAMETER + this.menuTextLength+25, 0);
			ctx.closePath();
			ctx.stroke();
			ctx.rotate(2*(menuItemArcSeparation + offset));
			ctx.beginPath();
			ctx.moveTo(this.MENU_DIAMETER-20, 0);  
			ctx.lineTo(this.MENU_DIAMETER + this.menuTextLength+25, 0);
			ctx.closePath();
			ctx.stroke();
			ctx.restore();*/
			
			ctx.translate(menuArcRadius, 0);
			if(menuTangent >= Math.PI*0.49 && menuTangent <= Math.PI*1.49)
				ctx.rotate(Math.PI);
			var radgrad = ctx.createRadialGradient(0,0,0,0,0,30);  
			radgrad.addColorStop(0, '#FFF');  
			radgrad.addColorStop(0.95, '#FFF');
			radgrad.addColorStop(1, 'rgba(255,255,255,0)');
			ctx.beginPath();
			ctx.fillStyle = radgrad;
			ctx.arc(0, 0, 30, 0, Math.PI*2, true); 
			ctx.closePath();
			ctx.fill();
			
			if(this.menuStructure[i].type.toLowerCase() == "branch")
				ctx.drawImage(getCIRCLE_MENU('SUB_MENU_IMAGE'),-20, -20, 40, 40);
			else
				ctx.drawImage(getCIRCLE_MENU('LINK_MENU_IMAGE'),-20, -20, 40, 40);
			if(menuTangent >= Math.PI*0.49 && menuTangent <= Math.PI*1.49)	{
				ctx.translate(-25, 0);
				ctx.textAlign = "end";	
			} else {
				ctx.translate(25, 0);
				ctx.textAlign = "start";
			}
			
			ctx.beginPath();
			ctx.fillStyle = "black";
			ctx.strokeStyle = "black";
			ctx.textBaseline = "middle";
			ctx.font = "20px helvetiker";
			ctx.fillText(this.menuStructure[i].text, 0, 0);
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			
			currentArcPossition += 1;
		}
		
		if(!isFirstLevel) {
			var radgrad = ctx.createRadialGradient(0,80,0,0,80,60);  
			radgrad.addColorStop(0, '#FFF'); 
			radgrad.addColorStop(0.8, '#FFF'); 
			radgrad.addColorStop(1, 'rgba(255,255,255,0)');
			ctx.beginPath();
			ctx.fillStyle = radgrad;
			ctx.arc(0, 80, 60, 0, Math.PI*2, true); 
			ctx.closePath();
			ctx.fill();
			
			ctx.drawImage(getCIRCLE_MENU('BACK_MENU_IMAGE'),-35, 35, 50, 50);
		}
		
		ctx.restore();
		//event.preventDefault();
		ctx.restore();
	},
			
	destroy: function($super) {
		if (this.childNode != null)
			this.childNode.each(function(aContextMenu) {
				aContextMenu.value.destroy();
			});
		allContextWindows.unset(this.elementUniqueID);
		if ($(this.elementUniqueID + "_root") != null)
			$(this.elementUniqueID + "_root").remove();
		if ($("TOUCH_MENU") != null) {
			$("TOUCH_MENU").remove();
		}
		$super();
	},
	setEmpty: function() {
	},
	draw: function() {
		var ID;
		var buildTextForMenu = "";
		var isEmbedded = this.isEmbedded;
		var isRootNodes = (this.isEmbedded) ? true : false;
		var elementParent = this.elementParent;
		var verticalPosition = BOTTOM;
		var horizontalPosition = RIGHT;
		var LocalAction = "";
		var childNodes = this.childNodes;
		var internalNode = "";
		
		this.coreMenuStructure = [];
		
		if(this.baseNodes != null) {
			var i = 0;
			var Node = null;
			var tag = null;
			var nodeType = null;
			var nodeElementID = null;
			for(i = 0; i<this.baseNodes.length; i++) {
				Node = this.baseNodes[i];
				if(Node == null) continue;
				tag = "a";
				
				var versionNote = "";
				
				if(Node.minVersion != 0 && Node.minVersion != null) {
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
				if(Node == null) return;
				
				nodeType = Node.nodeType;
				nodeElementID = Node.elementID == null ? "MENUNODE_" + (++contextIDCounter) : Node.elementID;
				
				if (nodeType == null)
					nodeType = nodeElementID;
				nodeType = nodeType.toUpperCase();
				if (nodeType == "BRANCH" || nodeType == "DELAYLOADBRANCH" || this.mouseLoad ) {
					internalNode = Node;
					if(nodeType == "BRANCH")
						internalNode = Node.elementSubNodes;
					
					var newContextMenuNode = new circleMenu(this.elementUniqueID, Node.internalID, false, internalNode, VERTICAL, isRootNodes, verticalPosition, horizontalPosition, this.parentStageID, this.parentWindowID, this.parentPanelID, this.menuExpansionType, this.listStyleType);
					childNodes.set( Node.internalID, newContextMenuNode);
						
					this.coreMenuStructure.push({
						text:Node.elementValue +versionNote,
						type:"branch",
						action:	"allContextWindows.get(\"" +Node.internalID + "\").open(event, false, X, Y);",
						tag:Node.tag
					});
				}
				else if (nodeType == "LEAF") {
					LocalAction = "";
					var elementAction = Node.elementAction;
					
					if (elementAction == "" || elementAction == null) {
						if(Node.elementActionScript != null)
							elementAction = 'runTEScript(\'' + Node.internalID + '\', allContextWindows.get(\'' + this.elementUniqueID + '\').baseNodes[' + i + '].elementActionScript, null, \'' +Node.internalID + '\', null, null, \'' + this.parentStageID + '\', \'' + this.parentWindowID + '\', \'' + this.parentPanelID + '\', null);';
						else if(Node.elementFloatingLink != null) {
							var DisplayPoint = "null";
							if(this.isEmbedded && this.isRootNode)
								DisplayPoint = Node.internalID;
							else
								DisplayPoint = this.getRootNode();
							var object = getPanel(this.parentStageID,this.parentWindowID, this.parentPanelID);
							if(object != null) {
								var floatingPanelObject = new floatingPanel(Node.internalID + "_floatingPanel", Node.elementFloatingLink.ContentType, Node.elementFloatingLink.data, DisplayPoint, Node.elementFloatingLink.hideMenuBar, Node.elementFloatingLink.reloadOnConnectionChange, Node.elementFloatingLink.panelHeaders, Node.elementFloatingLink.baseWidth, Node.elementFloatingLink.baseHight, Node.elementFloatingLink.loadContentOnShow, Node.elementFloatingLink.reloadContentOnShow);
								object.registerNestedObject(floatingPanelObject);
								floatingPanelObject.draw();
							}
							
							elementAction = 'FLOATINGPANEL_activeFloatingPanels.get(\'' + Node.internalID + '_floatingPanel\').show_and_size(' + (DisplayPoint != null ? "'" + DisplayPoint + "'" : DisplayPoint) + ');';
							
						}
						else if(Node.elementLinkList != null || Node.elementPageWindows != null)
							elementAction = 'loadPage(allContextWindows.get(\'' + this.elementUniqueID + '\').baseNodes[' + i + '].elementPageWindows, allContextWindows.get(\'' + this.elementUniqueID + '\').baseNodes[' + i + '].elementLinkList);';
					} else {
						elementAction = elementAction.substr(elementAction.indexOf("=")+1);
						elementAction = eval(elementAction);
					}
					this.coreMenuStructure.push({
						text:Node.elementValue +versionNote,
						type:"leaf",
						action:	elementAction,
						tag:Node.tag
					});
				}
			}
		}

		if (this.windowIsVisible == true) {
			this.close();
			this.open();
		}
	}
});