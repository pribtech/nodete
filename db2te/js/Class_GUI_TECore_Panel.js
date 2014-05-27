/*******************************************************************************
 * Author: Matthew Vandenbussche
 * 
 *Copyright IBM Corp. 2010 All rights reserved.
 *
 * Updated author: Peter Prib
 *Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2013 All rights reserved.
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
var panel = Class.create(basePageElement, {
	loadIndicator: null,
	loadIndicatorTimer: null,
	loadIndicatorElapsedTime: 0,
	URL: null,
	elementObject: null,
	loadIndicator: null,
	localPanelConstants: null,
	localLayoutContainer: null,
	IsFirstLoad: true,
	rawTitleBarLayout: "",
	panelInformation: null,
	refresh: false,
	refreshOptions: 0,
	pageState: null,

	initialize: function($super, myID, delayLoad, panelTitle, PrimaryContainer, Type, Data, overflow, panelHeaders, POSTDATA , reloadOnConnectionChange) {
		$super(myID, "PANEL");
		PrimaryContainer = PrimaryContainer == null ? false : PrimaryContainer;
		PrimaryContainer = Object.isString(PrimaryContainer) ? (PrimaryContainer.toLowerCase() == "true" ? true : false) : PrimaryContainer;
		this.PrimaryContainer = PrimaryContainer === true ? true : false;
		this.TYPE = Type.toUpperCase();
		this.DATA = Data == null ? "" : Data;
		this.overflow = overflow == null ? "auto" : overflow;
		this.panelTitle = panelTitle == null ? null : decodeURIComponent(panelTitle);
		this.POSTDATA = POSTDATA == null ? new Object() : POSTDATA;
		this.nestedObject = $H();
		this.pageHeaders = panelHeaders == null ? null : panelHeaders;
		this.reloadScope = panelHeaders != null ? (panelHeaders.scope != "" ? panelHeaders.scope.toLowerCase() : "inherit") : "inherit";
		this.refreshTimeOut = -1;
		this.externalInformationPanel = false;
		this.refreshType = "silentReload";
		this.refreshCallback = null;
		this.refreshCallBackTimer = null;
		this.delayLoad = delayLoad == null ? false : delayLoad;
		this.localPanelConstants = $H();
		this.pageState = new Object();
		this.panelTitleBar = null;
		this.InResizeEvent = false;
		if(this.pageHeaders != null) {
			if (this.pageHeaders.autoRefreshControls != null)
				if (this.pageHeaders.autoRefreshControls.time != null && this.pageHeaders.autoRefreshControls.time != "")
					this.refreshTimeOut = this.pageHeaders.autoRefreshControls.time;
			this.refreshOptions = ( Object.isString(this.pageHeaders.refreshOptions) ? eval(this.pageHeaders.refreshOptions) : this.pageHeaders.refreshOptions );
		}
		this.reloadOnConnectionChange=reloadOnConnectionChange == null ? false : reloadOnConnectionChange;
	},
	
	registerNestedObject: function(ID, Object) {
		if(Object == null) {
			Object = ID;
			ID = Object.elementName;
		}
		if(Object != null) {
			this.nestedObject.set(ID, Object);
			Object.parentWindowID = this.parentWindowID;
			Object.parentStageID = this.parentStageID;
			if(Object.elementType != null) {
				var window = getWindow(this.parentStageID, this.parentWindowID);
				if(window != null)
					window.addWindowContainer(Object.elementName, Object);
			}
		}
		this.setSize();
	},
	
	setContainer: function(container, otherInfo) {
		this.registerNestedObject(container.elementName, container);
		this.localLayoutContainer = container;
	},
	
	load: function(Type, Data, panelHeader, POSTDATA, pageState) {
		this.pageState = pageState == null ? new Object() : pageState;
		this.panelHeader = panelHeader;
		this.POSTDATA = POSTDATA == null ? new Object() : POSTDATA;
		
		if (this.refreshCallBackTimer != null)
			clearTimeout(this.refreshCallBackTimer);
		this.refreshTimeOut = -1;
		this.refreshType = "silentReload";
		this.refreshCallback = null;
		this.refreshCallBackTimer = null;
		this.clearPanel();
		this.TYPE = Type.toUpperCase();
		this.DATA = Data;
		this.IsFirstLoad = true;
		this.fullReloadOfPage();
	},
	
	loadURL: function() {
		var parentWindow = getWindow(this.parentStageID, this.parentWindowID);
		if (parentWindow != null) {
			if (parentWindow.WindowContainers.get(this.elementName) != null) {
				parentWindow.forwardURLHist = new Array();
				parentWindow.forwardURLHist.push(new Array(getWindow(this.parentStageID, this.parentWindowID).WindowConfiguration, new Array(new Array(this.elementName, "URL", encodeURIComponent($("URL_" + this.elementUniqueID).value)))));
				parentWindow.historyGoForward();
			}
		}
	},
	
	reloadPage: function(refresh) {
		if(this.theObjectIsDead) return;
		if(this.refreshObject!=null) {
			this.refreshObject.refresh();
			return;
		}
		switch (this.refreshType.toLowerCase()) {
			case "table":
				updateFunction(this.URL, this.parentStageID, this.parentWindowID, this.elementName, this.elementUniqueID);
				return;
			case "callback":
				try{eval(this.refreshCallback);}
				catch(e) {}
				return;
			case "noaction":
				return;
			case "reload":
			case "silentreload":
			default:
				this.fullReloadOfPage(refresh);
		}
	},
	
	setLoadingMessage: function() {
		var loadIconSize = (this.width < 50 || this.height < 50) ? "_small" : "";
		this.setContent("<table id='" + this.elementUniqueID + "_Object_To_Fit_To_Panel' style='width:" + this.width + "px;height:" + this.height + "px;position:static;'cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center'><img style='float:none;' src='images/loadingpage" + loadIconSize + ".gif'/></td></tr></table>", null, "", "hidden");
	},
	
	fullReloadOfPage: function(refresh) {
		refresh = refresh == null ? true : refresh;
		this.refresh = refresh;
		if (this.delayLoad == true) {
			this.delayLoad = false;
			this.setContent("<table width='100%' height='100%' cellspacing='0' cellpadding='0' align='center' valign='center'><tr><td align='center'><button onclick='" + this.callBackText + ".fullReloadOfPage()'>" + CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.LOAD_PAGE_BUTTON + "</button></td></tr></table>", null);
			return;
		}
		if (this.refreshCallBackTimer != null)
			clearTimeout(this.refreshCallBackTimer);
		this.externalInformationPanel = false;
		this.refreshCallBackTimer = null;
		var thisObject = this;
		var POSTDATA = this.POSTDATA;
		POSTDATA.USE_CONNECTION = null;
		var URL = this.DATA;
		var TYPE = this.TYPE;
		var myID = this.elementName;
		var parentWindowID = this.parentWindowID;
		var parentStageID = this.parentStageID;
		var elementUniqueID = this.elementUniqueID;
		var keys = null;
		var param = null;
		var PrimaryContainer = this.PrimaryContainer == null ? true : this.PrimaryContainer;
		var i = 0;
		var parentWindow = getWindow(this.parentStageID, this.parentWindowID);
		if(parentWindow != null && this.IsFirstLoad)
			this.refreshTimeOut = parentWindow.refreshTimeOut;
		
		if(this.localLayoutContainer != null) {
			parentWindow.WindowContainers.unset(this.localLayoutContainer.elementName);
			this.localLayoutContainer.destroy();
		}
		
		this.nestedObject.each(function(pair) {
			if (pair.value != null) {
				if(pair.value.elementType != null && parentWindow != null)
					parentWindow.WindowContainers.unset(pair.value.elementName);
				pair.value.destroy();
			}
		});
		
		this.nestedObject = $H();
		if (URL == "" || URL == null) {
			this.setContent("", null);
			return;
		}
		
		if (TYPE.toUpperCase() == "URL" || TYPE.toUpperCase() == "LINK") {
			if (this.TYPE.toUpperCase() == "LINK") {
				var link = {};
				if (Object.isString(this.DATA))
					link = eval("(" + this.DATA + ")");
				else 
					link = this.DATA;
 
 				TYPE = link.type.toUpperCase();
				URL = link.data;
				if (link.formList != null && this.IsFirstLoad) {
					this.IsFirstLoad = false;
					for (i = 0; i < link.formList.length; i++) {
						if ($(link.formList[i]) != null) {
							param = $(link.formList[i]).serialize(true);
							keys = Object.keys(param);
							keys.each(function(key) {
								if(key=='$action')
									POSTDATA['action'] =  param[key];
								else
									POSTDATA[key] = param[key];
							});
						}
					}
				}
				if(!Object.isString(URL)) {
					var LinkData = URL;
					URL = "";
					if(LinkData.baseDirectory != null)
						URL = LinkData.baseDirectory;
					if(LinkData.address == null) {
						TYPE = "action";
						URL = ACTION_PROCESSOR;
					} else
						URL += LinkData.address;
					
					keys = Object.keys(LinkData.parameters);
					keys.each(function(key) {
						if(key=='$action')
							POSTDATA['action'] = LinkData.parameters[key];
						else
							POSTDATA[key] = LinkData.parameters[key];
					});
				}
			}
			if ($("URL_" + this.elementUniqueID) != null)
				$("URL_" + this.elementUniqueID).value = URL;
			if (URL.substring(0, 7).toUpperCase() == 'FILE://' || URL.substring(0, 8).toUpperCase() == 'HTTPS://' || URL.substring(0, 7).toUpperCase() == 'HTTP://' || URL.substring(0, 6).toUpperCase() == 'FTP://') {
					this.externalInformationPanel = true;
					getWindow(parentStageID, parentWindowID).setLoading(myID);
					URL = encodeURIandNormaMessage(URL);
					thisObject.setContent('<iframe name="' + this.elementUniqueID + '_Object_To_Fit_To_Panel" id="' + this.elementUniqueID + '_Object_To_Fit_To_Panel" onunload="getWindow(\'' + parentStageID + '\', \'' + parentWindowID + '\').setLoading(\'' + myID + '\');" onLoad="getWindow(\'' + parentStageID + '\', \'' + parentWindowID + '\').setDoneLoading(\'' + myID + '\');" src="' + URL + '" frameborder="0" style="position:absolute;z-index:10;height:100%;width:100%;"></iframe>', (this.panelTitle != null ? this.panelTitle : CORE_MESSAGE_STORE.LANGUAGE_MESSAGES.EXTERNAL_INFORMATION_TITLE), "", "hidden");
			} else {
				POSTDATA.primaryContainer = this.PrimaryContainer;
				POSTDATA.uniqueID = this.elementUniqueID;
				POSTDATA.stageID = this.parentStageID;
				POSTDATA.windowID = this.parentWindowID;
				POSTDATA.panelID = this.elementName;
				
				if(POSTDATA.USE_CONNECTION == null) {
					if(POSTDATA.useConnectWithTag != null)
						POSTDATA.USE_CONNECTION = getConnectionWithTag(POSTDATA.useConnectWithTag);
					if(POSTDATA.USE_CONNECTION == null)
						POSTDATA.USE_CONNECTION = getActiveDatabaseConnection();
				}
				
				var ClientActionFound = false;
				POSTDATA.refreshEnabled = ( this.pageHeaders == null ? "false" : this.pageHeaders.refreshEnabled );
				if(TYPE.toUpperCase() == "ACTION") {
					var action = CORE_CLIENT_ACTIONS.get(POSTDATA.action);
					if(action==undefined) {
						this.setLoadingMessage();
						CORE_CLIENT_ACTIONS.set(POSTDATA.action,false);
						var script = document.createElement("script");
						script.type = "text/javascript";
						script.src = JS_BASE_DIRECTORY+"clientActions/"+POSTDATA.action+".js";
						script.onload = function(){
							var action = CORE_CLIENT_ACTIONS.get(POSTDATA.action);
							new action(POSTDATA);
							thisObject.setReload();
						};
						document.body.appendChild(script);
					}
					if(action != null && action!=false) {
						ClientActionFound = true;
						new action(POSTDATA);
						this.setReload();
					}
				}
				
			 	if(!ClientActionFound) {
					this.URL = URL;
					new Ajax.Request(URL, {
						'parameters': POSTDATA,
						'method': 'post',
						'onCreate': function() {
							var window = getWindow(parentStageID, parentWindowID);
							if (window != null && (thisObject.refreshType.toLowerCase() == "reload"))
								window.setLoading(myID);
							if (!refresh || (thisObject.refreshType.toLowerCase() == "reload"))
								thisObject.setLoadingMessage();
						},
						'onSuccess': function(transport) {
							var window = getWindow(parentStageID, parentWindowID);
							if (window != null)
								window.setDoneLoading(myID);
							thisObject.setContent(transport.responseText, null);
							thisObject.setReload();
						},
						'onFailure': function(transport) {
							var window = getWindow(parentStageID, parentWindowID);
							if (window != null)
								window.setDoneLoading(myID);
							thisObject.setContent(transport.responseText, "Error Loading Page");
						},
						'onException': function(transport,exception) {
							alert(exception);
							return;
						}
					});
				}
			}
		} else if (TYPE == "RAW") {
			this.setContent(URL, null);
		} else if (TYPE == "LAYOUT") {
			var baseObject = setupContainer(this, this.DATA, null);
			$(elementUniqueID).setStyle({ "overflow": "hidden" });
			this.setContent(baseObject.draw(), null, null, "hidden");
			baseObject.setSize(this.width, this.height);
			baseObject.fullReloadOfPage();
		} else {
			this.setContent("", null);
		}
		if (POSTDATA["DO_NOT_SAVE_LOCAL_POSTDATA"] == "true")
			this.POSTDATA = new Object();
	},
	getElementObject: function() {
		if(this.elementObject == null)
			this.elementObject = $(this.elementUniqueID);
		return this.elementObject;
	},
	loadLayout: function(layout) {
		var baseObject = setupContainer(this, layout, null);
		if (this.getElementObject() != null)
			this.getElementObject().setStyle({ "overflow": "hidden" });
		this.setContent(baseObject.draw(), null, null, "hidden");
		baseObject.reloadPage();
		baseObject.setSize(this.width, this.height);
	},
	setOverflow: function(overflowValue) {
		this.getElementObject().setStyle({ 'overflow': overflowValue });
	},
	setContent: function(Content, Title, PanelInformation, overflow, LeftMenu) {
		if(this.theObjectIsDead) return;
		if(!this.refresh || (this.refreshType.toLowerCase() == "reload"))
			this.clearPanel();
		this.hideAddressBar();
		var contentHolder = this.getElementObject();
		var theDataObjectChildren = null;
		overflow = overflow == null ? this.overflow : overflow;
		if (contentHolder != null) {
			contentHolder.setStyle({ "overflow": overflow });
			if (Content != null && contentHolder != null) {
				contentHolder.update(Content);
			}
		}
		if (Title == null && contentHolder != null) {
			try
			{
				theDataObjectChildren = contentHolder.select('div[id="title"]');
				if (theDataObjectChildren.size() > 0) {
					Title = theDataObjectChildren[0].innerHTML;
				}
			}
			catch(e)
			{
				if(ENABLE_VERBOSE)
					alert(e);
			}
		}		
		if (Title == null)
			Title = this.panelTitle;
		if (Title == null)
			Title = "";
		//CHROME FIX: This try/catch is to get the YUI package working in the tutorial framework.
		try
		{
			Title = Title.replace(/ /g, '&nbsp;');		
			if (PanelInformation == null && contentHolder != null) {
				theDataObjectChildren = contentHolder.select("div[id='panelInformation']");
				if (theDataObjectChildren.size() > 0) {				
					PanelInformation = theDataObjectChildren[0].innerHTML;				
				}
			}
			if (PanelInformation == null)
				PanelInformation = this.panelInformation;
			if (PanelInformation == null)
				PanelInformation = "";
	
			if (LeftMenu == null && contentHolder != null) {
				theDataObjectChildren = contentHolder.select("div[id='pageLeftMenu']");
				if (theDataObjectChildren.size() > 0) {
					LeftMenu = theDataObjectChildren[0].innerHTML;
				}
			}
		} 
		catch (e)
		{
			if(ENABLE_VERBOSE)
				alert(e);
		}

		if (this.PrimaryContainer) {
			var window = getWindow(this.parentStageID, this.parentWindowID);
			if (window != null)
			{
				window.PrimaryContainerName = this.elementName;
				if(window.windowOptionType != NO_TITLE_BAR_OPTIONS && window.windowOptionType != TAB_PERSISTENCE_FLAG)
				{
					window.setWindowTitle(Title, LeftMenu, PanelInformation);
				}
				else
				{
					window.setWindowTitle(Title);
					if((LeftMenu != "" && LeftMenu != null) || (PanelInformation != "" && PanelInformation != null))
						this.setWindowTitle(Title, LeftMenu, PanelInformation);
					else if(this.pageHeaders != null && this.reloadScope != "inherit")
						if (this.pageHeaders.refreshEnabled)
							this.setWindowTitle(Title, LeftMenu, PanelInformation);
				}
			}
			else
			{
				this.setWindowTitle(Title, LeftMenu, PanelInformation);
			}
		}
		else 
		{
			this.setWindowTitle(Title, LeftMenu, PanelInformation);
		}
		this.showAddressBar();
		this.setSize();
		this.setReload();
	},
	setReload: function() {
		if (this.refreshCallBackTimer != null)
			clearTimeout(this.refreshCallBackTimer);
		this.refreshCallBackTimer = null;
		
		if(this.refreshTimeOut < 0)
			return;
		if(this.pageHeaders != null)
			if(!this.pageHeaders.refreshEnabled)
				return;

		if(this.pauseAutoReload()) {
			this.refreshCallBackTimer = setTimeout(this.callBackText + ".setReload()", this.refreshTimeOut * 1000);
		} else if (this.pageHeaders != null) {
			if (this.pageHeaders.refreshEnabled && this.refreshTimeOut != -1) 
				this.refreshCallBackTimer = setTimeout(this.callBackText + ".doReload()", this.refreshTimeOut * 1000);
		}
	},

	autoReloadUpdate: function() {
		if (this.pageHeaders != null) {
			if (this.pageHeaders.refreshEnabled && this.reloadScope == "inherit") {
				this.refreshTimeOut = getWindow(this.parentStageID, this.parentWindowID).refreshTimeOut;
				if (this.refreshCallBackTimer != null) 
					clearTimeout(this.refreshCallBackTimer);
				
				if(this.refreshTimeOut < 0)
					return;
				
				if(this.pauseAutoReload()) 
					this.refreshCallBackTimer = setTimeout(this.callBackText + ".setReload()", this.refreshTimeOut * 1000);
				else if (this.refreshTimeOut != -1) 
					this.refreshCallBackTimer = setTimeout(this.callBackText + ".doReload()", this.refreshTimeOut * 1000);
			}
		}
	},
	
	pauseAutoReload: function() {
		if(!ACTIVE_DATABASE_CONNECTION_AUTHENTICATED && this.refreshOptions & REFRESH_ON_NO_CONNECTION == 0)
			return true;
		var value = this.refreshOptions & REFRESH_WHEN_NOT_VISIBLE;
		if(value  == 0)
			return !isWindowVisible(this.parentStageID, this.parentWindowID);
		return false;
	},

	updateReloadTime: function(reloadTime) {
		if(this.refreshTimeOut != reloadTime) {
			this.refreshTimeOut = reloadTime;
			//This syncs the visible time with the current internal update time
			var timeOptionIndicator = $(this.elementUniqueID + "_timeOptionValue");
			if(timeOptionIndicator != null)
				timeOptionIndicator.value = reloadTime;
			this.buildRawTitleBarLayout();
			this.setReload();
		}
	},

	doReload: function() {
		if (this.refreshCallBackTimer != null)
			clearTimeout(this.refreshCallBackTimer);
		this.refreshCallBackTimer = null;
		switch (this.refreshType.toLowerCase()) {
			case "reload":
			case "silentreload":
				this.fullReloadOfPage(true);
				return;
			case "table":
				updateFunction(this.URL, this.parentStageID, this.parentWindowID, this.elementName, this.elementUniqueID);
				this.setReload();
				return;
			case "callback":
				eval(this.refreshCallback);
				this.setReload();
		}
	},
	
	clearPanel: function() {
		var panelContent = this.getElementObject();
		if(this.panelTitleBar == null)
			this.panelTitleBar = $("AddyBar_" + this.elementUniqueID);
		if (panelContent != null)
			panelContent.update("");
		if (this.panelTitleBar != null) {
			this.panelTitleBar.update(this.rawTitleBarLayout);
			this.panelTitleBar.hide();
		}
	},
	
	setWindowTitle: function(newTitle, leftMenu, PanelInformation) {
		var panelTitle = $("panelTitle_" + this.elementUniqueID);
		var panelMenu = $("panelMenuRight_" + this.elementUniqueID);
		if (PanelInformation == null)
			PanelInformation = "";
		if (panelTitle != null) {
			if (PanelInformation != "")
				newTitle = "<table><tr><td>" + newTitle + "</td><td><img style='float:none' onMouseUp=\"stopPropagation(event);\" onMouseDown='show_GENERAL_BLANK_POPUP(null, decodeURIComponent(\"" + encodeURIComponent("<div style='padding:10px;width:350px'>"+PanelInformation+"</div>") + "\"));' src=\"images/info.gif\"/></td></tr></table>";
			panelTitle.update(newTitle);
		}
		if (panelMenu != null && leftMenu != null) {
			if(Object.isArray(leftMenu))
				createContextMenu("panelMenuRight_" + this.elementUniqueID, leftMenu , HORIZONTAL, this.parentStageID, this.parentWindowID, this.elementName);
			else
				panelMenu.update(leftMenu);
		}
	},
	
	resizeStart: function() {
		this.InResizeEvent = true;
		if(this.externalInformationPanel) {
			var contentHolder = this.getElementObject();
			if(contentHolder != null) contentHolder.hide();
		}
		this.nestedObject.each(function(aObject) {
			aObject.value.resizeStart();
		});
	},
	
	resizeEnd: function() {
		var frame = this.getElementObject();
		if(this.externalInformationPanel) {
			var contentHolder = this.getElementObject();
			if(contentHolder != null) contentHolder.show();
		}
		
		this.loadIndicator = $('loadIndicator_' + this.elementUniqueID);
		if(this.loadIndicator != null && frame != null) {
			var fPos = frame.positionedOffset();
			this.loadIndicator.show();
			this.loadIndicator.setStyle({ "left": (fPos.left+this.width-40) + "px"});// "top": (fPos.top) + "px" });
		}
		this.nestedObject.each(function(aObject) {
			aObject.value.resizeEnd();
		});
		this.InResizeEvent = false;
	},
	sizeWidth: function(Amount) {
		if(this.theObjectIsDead) return;
		var frame = this.getElementObject();
		var iframe = $(this.elementUniqueID + '_Object_To_Fit_To_Panel');
		var minWidth = 0;
		this.width += Amount;
		this.width = ((this.width > minWidth) ? this.width : minWidth);
		if(!this.InResizeEvent) {
			if(this.loadIndicator == null)
				this.loadIndicator = $('loadIndicator_' + this.elementUniqueID);
			if(this.loadIndicator != null)
				this.loadIndicator.setStyle({ "left": (frame.positionedOffset().left+this.width-40) + "px" });
		}
		if (frame != null)
			frame.setStyle({ "width": this.width + "px" });
		if (iframe != null) 
			iframe.setStyle({ "width": this.width + "px" });
		this.nestedObject.each(function(aObject) {
			aObject.value.sizeWidth(Amount);
		});
		return this.width;
	},

	sizeHeight: function(Amount) {
		if(this.theObjectIsDead) return;
		var frame = this.getElementObject();
		var iframe = $(this.elementUniqueID + '_Object_To_Fit_To_Panel');
		
		var offsetHeight = this.showAddressBar();
		this.height += Amount;
		this.height = ((this.height > offsetHeight) ? this.height : offsetHeight);
		if(!this.InResizeEvent) {
			if(this.loadIndicator == null)
				this.loadIndicator = $('loadIndicator_' + this.elementUniqueID);
			if(this.loadIndicator != null)
				this.loadIndicator.setStyle({ "top": (frame.positionedOffset().top) + "px" });
		}
		if (frame != null)
			frame.setStyle({ "height": (this.height - offsetHeight) + "px" });
		if (iframe != null)
			iframe.setStyle({ "height": (this.height - offsetHeight) + "px" });
		this.nestedObject.each(function(aObject) {
			aObject.value.sizeHeight(Amount);
		});
		return this.height;
	},
	
	setWidth: function(Amount) {
		if(this.theObjectIsDead) return;
		var frame = this.getElementObject();
		this.width = Amount;
		this.width = ((this.width > 0) ? this.width : 0);
		if(!this.InResizeEvent) {
			if(this.loadIndicator == null)
				this.loadIndicator = $('loadIndicator_' + this.elementUniqueID);
			if(this.loadIndicator != null)
				this.loadIndicator.setStyle({ "left": (frame.positionedOffset().left + this.width-40) + "px" });
		}
		if (frame != null)
			frame.setStyle({ "width": this.width + "px" });
		else {
			var iframe = $(this.elementUniqueID + '_Object_To_Fit_To_Panel');
			if (iframe != null)
				iframe.setStyle({ "width": this.width + "px" });
		}
		this.nestedObject.each(function(aObject) {
			aObject.value.setWidth(Amount);
		});
		return this.width;
	},
	setHeight: function(Amount) {
		if(this.theObjectIsDead) return;
		var frame = this.getElementObject();
		var offsetHeight = this.showAddressBar();
		this.height = Amount;
		this.height = ((this.height > offsetHeight) ? this.height : offsetHeight);
		if(!this.InResizeEvent) {
			if(this.loadIndicator == null)
				this.loadIndicator = $('loadIndicator_' + this.elementUniqueID);
			if(this.loadIndicator != null)
				this.loadIndicator.setStyle({ "top": (frame.positionedOffset().top) + "px" });
		}
		if (frame != null)
			frame.setStyle({ "height": (this.height - offsetHeight) + "px" });
		else {
			var iframe = $(this.elementUniqueID + '_Object_To_Fit_To_Panel');
			if (iframe != null)
				iframe.setStyle({ "height": (this.height - offsetHeight) + "px" });
		}
		Amount = this.height - offsetHeight;
		this.nestedObject.each(function(aObject) {
			aObject.value.setHeight(Amount);
		});
		return this.height;
	},
	
	show_hide_contents: function() {
		BarItemClick(this.parentStageID, this.parentWindowID + "_" + this.elementName);
	},
	
	moveLeft: function(Amount) {
		this.nestedObject.each(function(aObject) {
			aObject.value.moveLeft(Amount);
		});
	},
	
	moveTop: function(Amount) {
		this.nestedObject.each(function(aObject) {
			aObject.value.moveTop(Amount);
		});
	},
	
	destroy: function($super) {
		this.theObjectIsDead = true;
		var test = this.nestedObject.toArray();
		var parentWindow = getWindow(this.parentStageID, this.parentWindowID);
		if(this.localLayoutContainer != null) {
			parentWindow.WindowContainers.unset(this.localLayoutContainer.elementName);
			this.localLayoutContainer.destroy();
		}
		if(this.loadIndicatorTimer != null) {
			clearTimeout(this.loadIndicatorTimer);
			this.loadIndicatorTimer = null;	
		}
		if(this.refreshCallBackTimer != null) {
			clearTimeout(this.refreshCallBackTimer);
			this.refreshCallBackTimer = null;	
		}
		this.nestedObject.each(function(pair) {
			if (pair.value != null) {
				if(pair.value.elementType != null && parentWindow != null)
					parentWindow.WindowContainers.unset(pair.value.elementName);
				pair.value.destroy();
			}
		});
		this.nestedObject = $H();
		if(this.panelTitleBar == null)
			this.panelTitleBar = $("AddyBar_" + this.elementUniqueID);
		var rootnode = $(this.elementUniqueID);
		if(this.panelTitleBar != null) {
			this.panelTitleBar.remove();
			this.panelTitleBar = null;
		}	
		if(rootnode != null)
			rootnode.remove();
		$super();
	},
	
	hideAddressBar: function() {
		if(this.panelTitleBar == null)
			this.panelTitleBar = $("AddyBar_" + this.elementUniqueID);
		if (this.panelTitleBar != null)
			this.panelTitleBar.hide();
	},
	
	showAddressBar: function() {
		var panelHeight = 0;
		if(this.panelTitleBar == null)
			this.panelTitleBar = $("AddyBar_" + this.elementUniqueID);
		if (this.panelTitleBar != null) {
			this.panelTitleBar.show();
			panelHeight = this.panelTitleBar.getHeight();
			if(panelHeight < 4) {
				panelHeight = 0;
				this.panelTitleBar.hide();
			}
		}
		return panelHeight;
	},
	
	buildRawTitleBarLayout: function() {
		this.rawTitleBarLayout = "<table id=\"AddyBarTable_" + this.elementUniqueID + "\" cellpadding=\"0\" cellspacing=\"0\" style=\"height:0px;width:100%;min-height:0px;max-height:0px;\">\n"
								+ "<tr style=\"height:0px;width:100%;min-height:0px;max-height:0px;\"><td align=leftstyle='width:0px;min-height:0px;max-height:0px;' id='panelMenuLeft_" + this.elementUniqueID + "'>\n"
								+ "</td><td style='width:100%;padding-left:10px;min-height:0px;max-height:0px;'><NOBR id='panelTitle_" + this.elementUniqueID + "'>"
								+ "</NOBR></td><td align=right style='width:0px;min-height:0px;max-height:0px;' id='panelMenuRight_" + this.elementUniqueID + "'>"
								+ "</td><td align=right style='width:0px;min-height:0px;max-height:0px;' class='pageWindowPageMenu' id='timingMenu_" + this.elementUniqueID + "'>";
		if (this.pageHeaders != null && this.reloadScope != "inherit") {
			if (this.pageHeaders.refreshEnabled) {
				var timeVisible = true;
				var timeOptions = [1, 5, 15, 30, 60, 120, 300, 600];
				var countdownVisible = true;
				var displayTimeInfo = "";
				if (this.pageHeaders.autoRefreshControls != null) {
					if (this.pageHeaders.autoRefreshControls.timeVisible != null && this.pageHeaders.autoRefreshControls.timeVisible != "")
						timeVisible = this.pageHeaders.autoRefreshControls.timeVisible;
					if (this.pageHeaders.autoRefreshControls.timeOptions != null && this.pageHeaders.autoRefreshControls.timeOptions != "") {
						timeOptions = this.pageHeaders.autoRefreshControls.timeOptions;
						if(Object.isString(timeOptions))
							timeOptions = eval("(" + timeOptions + ")");
					}
					if (this.pageHeaders.autoRefreshControls.countdownVisible != null && this.pageHeaders.autoRefreshControls.countdownVisible != "")
						countdownVisible = this.pageHeaders.autoRefreshControls.countdownVisible;
				}
				if(timeOptions.indexOf(-1) == -1)
					timeOptions.unshift(-1);
				if(timeOptions.indexOf(-1) == this.refreshTimeOut)
					timeOptions.unshift(this.refreshTimeOut);	
				if (this.pageHeaders.showRefreshControl == true || timeVisible) {
					displayTimeInfo += "<table cellpadding='0' cellspacing='0'><tr>";
					if (timeVisible) {
						displayTimeInfo += "<td><nobr>&nbsp;&nbsp;Refresh Time</nobr></td><td><select id='" + this.elementUniqueID + "_timeOptionValue' onchange='" + this.callBackText + ".updateReloadTime(this.value);'>";
						var timeOptionLength = timeOptions.length;
						for (i = 0; i < timeOptionLength; i++) {
							displayTimeInfo += "<option value='" + timeOptions[i] + "' ";
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
						displayTimeInfo += "</select></td>";
					}
					if (this.pageHeaders.showRefreshControl) 
						displayTimeInfo += "<td><img onclick='" + this.callBackText + ".doReload()' src='./images/icon-link-refresh.gif'/></td>";
					displayTimeInfo += "</tr></table>";
				}

				var window = getWindow(this.parentStageID, this.parentWindowID);
				if (window != null) {
					if (this.PrimaryContainer && window.windowOptionType != NO_NAV_BAR) {
						if (window.pageHeaders == null) 
							$('rightInformationMenu_' + window.elementUniqueID).update(displayTimeInfo);
						else
							this.reloadScope = "inherit";
					} else
						this.rawTitleBarLayout += displayTimeInfo;
				} else
					this.rawTitleBarLayout += displayTimeInfo;
				this.autoReloadUpdate();
			}
		}
		this.rawTitleBarLayout += "</td></tr>\n";
		this.rawTitleBarLayout += "</table>\n";		
	},

	draw: function() {
		this.elementObject = null;
		this.loadIndicator = null;
		this.panelTitleBar = null;
		this.elementUniqueID = this.parentStageID + "_" + this.parentWindowID + "_" + this.elementName;
		output = "<div id=\"AddyBar_" + this.elementUniqueID + "\" onmouseover=\"setActivePanel('" + this.parentStageID + "','" + this.parentWindowID + "','" + this.elementName + "');\" onMouseDown=\"RaiseToTop('" + this.parentStageID + "','" + this.parentWindowID + "')\" class='panelTitleBar' style=\"display:none;width:100%;\" >\n";
		
		this.buildRawTitleBarLayout();
		
		output += this.rawTitleBarLayout
				+ "</div>\n"
				+ "<div class=\"panel\" id=\"" + this.elementUniqueID + "\" ";
		if(IS_TOUCH_SYSTEM)
			output += " ontouchstart='" + this.callBackText + ".touchStart(event)' ontouchend='" + this.callBackText + ".touchEnd(event)' ontouchmove='" + this.callBackText + ".touchMove(event)'";
		output += " onmouseover=\"setActivePanel('" + this.parentStageID + "','" + this.parentWindowID + "','" + this.elementName + "');\" onMouseDown=\"RaiseToTop('" + this.parentStageID + "','" + this.parentWindowID + "')\" style=\"position:relative;width:" + this.width + "px; height:" + this.height + "px;overflow:" + this.overflow + ";\" >";
		if (this.TYPE == "RAW")
			output += this.DATA;
		output += "</div>\n"
				+ "<div id='loadIndicator_" + this.elementUniqueID + "' align='right' style='width:40px;top:-10px;left:-10px;position:absolute;display:none;'>"
				+ "</div>\n";
		return output;
	},

	startServerLoadIndicator: function() {
		var time = new Date();
		if(this.loadIndicator == null)
			this.loadIndicator = $('loadIndicator_' + this.elementUniqueID);
		if(this.loadIndicatorTimer != null)
			clearTimeout(this.loadIndicatorTimer);
		if(this.loadIndicator == null)  return;
		this.loadIndicatorElapsedTime = time.getTime();
		this.loadIndicator.show();
		this.loadIndicator.update("<img style='padding:5px;float:none;' src='./images/indicator/green_o33.png'/>");
		this.loadIndicatorTimer = setTimeout(this.callBackText + ".updateServerLoadIndicator();", 500);
	},
	
	updateServerLoadIndicator: function() {
		var time = new Date();
		if(this.loadIndicator == null)
			this.loadIndicator = $('loadIndicator_' + this.elementUniqueID);
		if(this.loadIndicatorTimer != null)
			clearTimeout(this.loadIndicatorTimer);
		time = Math.floor((time.getTime()-this.loadIndicatorElapsedTime)/1000.0);
		if(time <= 1)
			this.loadIndicator.update("<img style='padding:5px;float:none;' src='./images/indicator/green_o66.png'/>");
		else if(time <=2)
			this.loadIndicator.update("<img style='padding:5px;float:none;' src='./images/indicator/green.png'/>");
		else
			this.loadIndicator.update("<table cellpadding='0' cellspacing='0'><tr><td><font style='border-color:#ddd;-webkit-border-radius:5px;-moz-border-radius:5px;-webkit-box-shadow: 0 1px 2px rgba(0,0,0,.2);padding-left:5px;padding-right:5px;color:white;background-color:rgba(254,0,0,.5);'>" + Math.round(time) + "</font></td><td><img style='padding:5px;float:none;' src='./images/indicator/green.png'/></td></tr></table>");
		this.loadIndicatorTimer = setTimeout(this.callBackText + ".updateServerLoadIndicator();", 500);
	},

	setClientLoadIndicator: function() {
		if(this.loadIndicator == null)
			this.loadIndicator = $('loadIndicator_' + this.elementUniqueID);
		if(this.loadIndicatorTimer != null)
			clearTimeout(this.loadIndicatorTimer);
		if(this.loadIndicator == null)
			return;
		this.loadIndicator.update("<img style='padding:5px;float:none;' src='./images/indicator/blue_o33.png'/>");
		this.loadIndicatorTimer = setTimeout(this.callBackText + ".updateClientLoadIndicator();", 500);
	},

	updateClientLoadIndicator: function() {
		var time = new Date();
		if(this.loadIndicator == null)
			this.loadIndicator = $('loadIndicator_' + this.elementUniqueID);
		if(this.loadIndicatorTimer != null)
			clearTimeout(this.loadIndicatorTimer);
		if(this.loadIndicator == null) return;
		time = (time.getTime()-this.loadIndicatorElapsedTime)/1000.0;
		if(time <= 1)
			this.loadIndicator.update("<img style='padding:5px;float:none;' src='./images/indicator/blue_o66.png'/>");
		else if(time <=2)
			this.loadIndicator.update("<img style='padding:5px;float:none;' src='./images/indicator/blue.png'/>");
		else
			this.loadIndicator.update("<table cellpadding='0' cellspacing='0'><tr><td><font style='border-color:#ddd;-webkit-border-radius:5px;-moz-border-radius:5px;-webkit-box-shadow: 0 1px 2px rgba(0,0,0,.2);padding-left:5px;padding-right:5px;color:white;background-color:rgba(254,0,0,.5);'>" + Math.round(time) + "</font></td><td><img style='padding:5px;float:none;' src='./images/indicator/blue.png'/></td></tr></table>");
		this.loadIndicatorTimer = setTimeout(this.callBackText + ".updateClientLoadIndicator();", 500);
	},

	clearLoadIndicator: function() {
		if(this.loadIndicator == null)
			this.loadIndicator = $('loadIndicator_' + this.elementUniqueID);
		if(this.loadIndicatorTimer != null)
			clearTimeout(this.loadIndicatorTimer);
		if(this.loadIndicator == null) return;
		this.loadIndicator.update("");
		this.loadIndicator.hide();	
	},
	
	reloadIfRequired: function() {
		if (this.reloadOnConnectionChange)
			this.reloadPage();
	},

	touchStart: function(event) {
		this.Current_Mouse_X = 0;
		this.Current_Mouse_Y = 0;
		this.touchMoveEnabled = false;
		if( event.touches && event.touches.length) { 
			this.touchMoveEnabled = true;
			this.Current_Mouse_X = event.touches[0].clientX;
			this.Current_Mouse_Y = event.touches[0].clientY;
		} else { 
			this.touchMoveEnabled = true;
			this.Current_Mouse_X = event.clientX;
			this.Current_Mouse_Y = event.clientY;
		}
	},

	touchMove: function(event) {
		if(this.touchMoveEnabled && event.touches.length == 1 && event.processed == null) {
			var panel = this.getElementObject();
			if(panel != null) {
				var local_Mouse_X = 0;
				var local_Mouse_Y = 0;
				if( event.touches && event.touches.length) { 
					local_Mouse_X = event.touches[0].clientX;
					local_Mouse_Y = event.touches[0].clientY;
				} else {
					local_Mouse_X = event.clientX;
					local_Mouse_Y = event.clientY;
				}
				
				panel.scrollLeft += this.Current_Mouse_X - local_Mouse_X;
				panel.scrollTop += this.Current_Mouse_Y - local_Mouse_Y;
				
				this.Current_Mouse_X = local_Mouse_X;
				this.Current_Mouse_Y = local_Mouse_Y;
				
				event.preventDefault();
				return false;
			}
		}
	},
	
	touchEnd: function(event) {
		this.touchMoveEnabled = false;
	}
});
