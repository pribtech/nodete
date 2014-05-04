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

CORE_CLIENT_ACTIONS.set("tutorial", Class.create(AD_HOC_BASE_CONTROLER,{
	initialize: function($super, callParameters) {
		$super(callParameters.uniqueID + "_tutorial", "TUTORIAL");

		this.parentStageID = callParameters.stageID;
		this.parentWindowID = callParameters.windowID;
		this.parentPanelID = callParameters.panelID;
		this.parentPageID = callParameters.uniqueID;
		this.parentPanel = getPanel(this.parentStageID, this.parentWindowID,this.parentPanelID);
		
		this.tutorialName = callParameters.tutorialName;
		this.currentMenuLocation = callParameters.CurrentMenuLocation;
		this.script = callParameters.script;
		this.startAtPage = callParameters.startAtPage;
		this.startAtPage = callParameters.startAtPage == null ? 0 : callParameters.startAtPage;
		this.usingSharedSchema = false;
		this.dropSchema = true;
		this.Script = callParameters.Script;
		this.EndScroll = true;
		this.scrollAcceleration = 0;
		this.currentPageNumber = -1;
		this.currentPage = null;
		this.forwardMostVistedPage = 0;
		this.SetAdHocTextLoop = null;
		this.SetAdHocOptionsLoop = null;
		this.localTutorialConstants = $H();
		this.localTutorialResultsSets = $H();
		this.WMDConfig = null;
		this.DGConfig = null;
		this.isMaximized = false;  // tutorialBodySplitPane is maximized by tutorial script
		this.lastSplitRatio = null; // the last tutorialBodySplitPane's split ratio set by users
		this.splitPercent=0.333;
		this.splitChanged4Page=false;
		this.playing = null;
		this.adhocPlayResultsFinished=true;
		this.setHeight();
		this.setWidth();
		this.draw();
	},
	
	draw: function() {
			var layout = ({
					type:"splitPane",
					direction:"",
					maxSize:25,
					allowResize:false,
					showSplitSpacer:true,
					splitSpacerWidth:1,
					styleOverride:"background-color:#A0A0A0;",
					panelA: {
						type:"panel",
						name:"TUTORIAL_TITLE_PANEL",
						PrimaryContainer:false,
						overflow:"hidden",
						ContentType:"RAW",
						data:'<table class="contextRootBase" width="100%" cellpadding="0" cellspacing="0">' +
							'<tr><td><table cellpadding="0" cellspacing="0"><tr>' +
							'<td align="left" style="padding-left:2px;">' +
							'<img id="' + this.elementUniqueID + '_PreviousPage" onClick="' + this.callBackText + '.displayPreviousPage();" src="images/windownav/BWArrow_inActive.gif"/>' +
							'</td>' +
							'<td align="left" style="padding-left:2px;" class="contextRootLILink" >' +
							'<img id="' + this.elementUniqueID + '_NextPage" onClick="' + this.callBackText + '.displayNextPage();" class="inlineimage" src="images/windownav/FWArrow_inActive.gif"/>' +
							'</td>' +
							'<td align="left" style="padding-left:2px;" id="' + this.elementUniqueID + '_options">' +
							'<a style="padding-top:2px;padding-bottom:2px;" onmousedown="FLOATINGPANEL_activeFloatingPanels.get(\'' + this.elementUniqueID + '_PagePanel\').show_and_size();" id="' + this.elementUniqueID + '_Current_Page" onmouseout="if(menuWaitingToOpen != null){clearTimeout(menuWaitingToOpen);} mouseIsOverContextBase=false;" onmouseover="mouseIsOverContextBase=true;">0&nbsp;of&nbsp;0</a>' +
							'</td>' +
							'<td align="left"><nobr id="' + this.elementUniqueID + '_topTutorialTitle" class="tutorialTitleBarTitle"></nobr>' +
							'<td align="left" style="padding-left:2px; visibility:hidden;" class="contextRootLILink" >' +
												'<img  height="20px" width="20px" id="' + this.elementUniqueID + '_play" onClick="' + this.callBackText + '.playToogle();" class="inlineimage" src="images/play.png"/>'  +
							'</td></tr></table></td>' +
							'<td align="right" style="width:10px;valign:center;"><div id="' + this.elementUniqueID + '_devResources"></div></td></tr></table>'
					},
					panelB: {
						type:"splitPane",
						direction:"v",
						name:"TUTORIAL_BODY_SPLITPANE",
						splitPercent:this.splitPercent,
						allowResize:true,
						panelA: {
							type:"panel",
							name:"TUTORIAL_TEXT_PANEL",
							PrimaryContainer:false,
							overflow:"hidden",
							ContentType:"RAW",
							data:'<table style="width:100%; height:100%;" cellpadding="0" cellspacing="0" align="left">' +
								'<tr style="height:100%;">' +
								'<td align="left" valign="top" style="padding:0px;" id="' + this.elementUniqueID + '_Body_container" class="tutorial_content">' +
								'<div class="tutorialCSS" style="position:relative;padding-left:10px; padding-right:10px; padding-top:10px; width:50px; height:50px; overflow:auto;" id="' + this.elementUniqueID + '_Body" >' +
								'</div></td></tr></table>'
						},
						panelB: {
							type				: "stage",
							name				: this.elementUniqueID + "_stage",
							HasMenuBarContainer : TOP_TAB_TASK_BAR, 
							top				 : 0, 
							botton			: 0, 
							left				: 0,
							right			 : 0,
							titleBarType		: NO_TITLE_BAR,
							windowOptionType	: NO_NAV_BAR, 
							windowControlTypes: NO_TITLE_BAR_OPTIONS,
							sizable			 : WINDOW_IS_FULL
						}		
			}});
			
		this.parentPanel.loadLayout(layout);	
		getPanel(this.parentStageID, this.parentWindowID, "TUTORIAL_TEXT_PANEL").registerNestedObject(this.elementUniqueID, this);
		buttonSupport_registerButton(this.elementUniqueID + '_PreviousPage');
		buttonSupport_registerButton(this.elementUniqueID + '_NextPage');
		
		var TutorailPages = new floatingPanel(this.elementUniqueID + '_PagePanel', 'RAW', '<ul id="' + this.elementUniqueID + '_PageList" class="embeddedMenu" align="left"></ul>', this.elementUniqueID + '_Current_Page', true);
		this.parentPanel.registerNestedObject(TutorailPages);
		TutorailPages.draw();
		
		if(ALLOW_DISPLAY_OF_XML || ALLOW_DEVELOPER_VIEW) {
			var menuItems = [];
			
			if(ALLOW_DISPLAY_OF_XML) {
					menuItems.push({
						nodeType : "leaf",
						elementID : "viewXML",
						elementValue : "XML",
						elementAction : 'onClick="openURLonDefaultStageInIframe(\'' + location.href.replace('index.php', '') + (this.currentMenuLocation + "/" + this.tutorialName + "/tutorialScript.xml").replace(/[\/]+/g, "/") + '\');"',
						elementSubNodes : null,
						elementSubNodeDirection : null
					});
			}

			if(ALLOW_DEVELOPER_VIEW) {
				menuItems.push({
						nodeType : "leaf",
						elementID : "viewFiles",
						elementValue : "Directory",
						elementAction : 'onClick="openURLonDefaultStageInIframe(\'' + location.href.replace('index.php', '') + (this.currentMenuLocation + "/" + this.tutorialName).replace(/[\/]+/g, "/") + '\');"',
						elementSubNodes : null,
						elementSubNodeDirection : null
					});
			}
		
			createContextMenu(this.elementUniqueID + '_devResources', [
				{
						nodeType : "branch",
						elementID : "branch",
						elementValue : "View",
						elementAction : '',
						elementSubNodes : menuItems,
						elementSubNodeDirection : HORIZONTAL
				}
			], HORIZONTAL, this.parentStageID, this.parentWindowID, this.parentPanelID);

		}
		this.loadTutorialScript();
	},
	
	loadTutorialScript: function() {
		if(this.script==null)
			if(!(this.Script==undefined || this.Script==null)) {
				this.processScript();
				return;
			}
		
		var elementUniqueID = this.elementUniqueID;
		var thisObject = this;
		
		POSTDATA = new Object();
		POSTDATA.uniqueID 				= this.elementUniqueID;
		POSTDATA.stageID 				= this.parentStageID;
		POSTDATA.windowID 				= this.parentWindowID;
		POSTDATA.panelID 				= this.parentPanelID;
		POSTDATA.returntype 			= 'JSON';
		POSTDATA.tutorialName 			= this.tutorialName;
		POSTDATA.currentMenuLocation 	= this.currentMenuLocation;
		POSTDATA.script				 	= this.script;
		POSTDATA.action				 	= "getTutorialScript";
		getWindow(this.parentStageID, this.parentWindowID).setWindowTitle(this.tutorialName);
		new Ajax.Request(ACTION_PROCESSOR, {
					'parameters': POSTDATA,
					'method': 'post',
					'onCreate': function() {
						var contentArea = $(elementUniqueID + '_Body');
						if (contentArea != null)
							contentArea.update("<table width='100%' height='100%'cellspacing='0' cellpadding='0' align='center' valign='center'>" +
												"<tr height='200px'><td align='center' id='" + elementUniqueID + "_LoadingIconArea'><img style='float:none;' src='images/loadingpage.gif'/></td></tr>" +
												"<tr height='30px'><td><span><h1 id='" + elementUniqueID + "_LoadingTitleArea'>Loading tutorial script</h1></span></td></tr>" +
												"<tr><td id='" + elementUniqueID + "_LoadingInformationArea'></td></tr>" +
												"</table>");
					},
					'onSuccess': function(transport) {
						var TutorialScript = transport.responseJSON;
						var LoadingInformationArea = $(elementUniqueID + "_LoadingInformationArea");
						var LoadingIconArea = $(elementUniqueID + "_LoadingIconArea");
						var LoadingTitleArea = $(elementUniqueID + "_LoadingTitleArea");
						
						if(LoadingTitleArea != null)
							LoadingTitleArea.update("Finished Loading Script");
						if(LoadingIconArea != null)
							LoadingIconArea.update("");
						
						if(TutorialScript == null) {
							if(LoadingInformationArea != null)
								LoadingInformationArea.update("Tutorial JSON encoding error");
							return;
						}
						if(TutorialScript.returnCode == false || TutorialScript.returnCode == "false" )	{
							if(LoadingTitleArea != null)
								LoadingTitleArea.update("Error Loading Script");
							if(LoadingInformationArea != null)
								LoadingInformationArea.update(decodeURI(TutorialScript.returnValue));
							return;
						}
						if(Object.isArray(TutorialScript.returnValue)) {
							if(LoadingInformationArea != null)
								LoadingInformationArea.update("Tutorial script is empty");
							return;
						}
						thisObject.Script = TutorialScript.returnValue;
						thisObject.processScript();
					},
					'onFailure': function(transport) {
						var window = getWindow(thisObject.parentStageID, thisObject.parentWindowID);
						if (window != null)
							window.setDoneLoading(thisObject.myID);
						var LoadingInformationArea = $(elementUniqueID + "_LoadingInformationArea");
						if(LoadingInformationArea != null)
							LoadingInformationArea.update(transport.responseText);
						else
							openModalAlert("Error loading tutorial: "+transport.responseText);
					}
			});
	},
	
	processScript: function() {
		try{
			this.processScriptDetail();
		} catch (e) {
			LoadingInformationArea.update(e);
		}
	},
	
	processScriptDetail: function() {
		this.Script.sourceDOM=getDOMParsed(this.Script.sourceXML);

		var schemaHasBeenSet = false
			,parentStageObject = getStage(this.parentStageID);
		if(parentStageObject != null) {
			var schema = parentStageObject.LOCAL_STAGE_VARIABLES.get('SCHEMA');
			if(schema != null) {
				this.tutorialSchema = schema;
				this.localTutorialConstants.set("SCHEMA", schema);
				this.localTutorialConstants.set("SHARED_SCHEMA", "true");
				this.usingSharedSchema = true;
				schemaHasBeenSet = true;
			}
		}

		if(!this.Script.disableSetSchema && !schemaHasBeenSet) {
			this.tutorialSchema = this.Script.tutorialSchema;
			this.localTutorialConstants.set("SCHEMA", this.Script.tutorialSchema);
			this.localTutorialConstants.set("SHARED_SCHEMA", "false");
		}
		this.dropSchema=!(this.Script.dropSchema=='false');
		if(this.Script.name != null && this.Script.name != "")
			getWindow(this.parentStageID, this.parentWindowID).setWindowTitle(this.Script.name);
					
		this.pageFlow = TUTORIAL_FLOW_FREE;
		if(this.Script.flowRestriction != null) {
			switch(this.Script.flowRestriction.toLowerCase()) {
				case "freewithchecks":
					this.pageFlow = TUTORIAL_FREE_WITH_CHECKS;
					break;
				case "forwardsequential":
					this.pageFlow = TUTORIAL_FLOW_FORWARD_SEQUENTIAL;
					break;
				case "strictsequential":
					this.pageFlow = TUTORIAL_FLOW_STRICT_SEQUENTIAL;
					break;
				case "forwardexploration":
					this.pageFlow = TUTORIAL_FLOW_FORWARD_EXPLORATION;
					break;
			}
		}
		this.localTutorialConstants.set("TUTORIAL_STAGE", this.elementUniqueID + "_stage");
		this.localTutorialConstants.set("TUTORIAL_CALLBACK", this.callBackText);
		this.localTutorialConstants.set("TUTORIAL_PARAMETERS", this.callBackText + ".Script.tutorialParameters");
		this.localTutorialConstants.set("TUTORIAL_NAME", this.Script.name);
		this.localTutorialConstants.set("BASE_DIRECTORY", this.Script.contentFolder);
		this.localTutorialConstants.set("TUTORIAL_TYPE", this.elementType);
		this.localTutorialConstants.set("TUTORIAL_ID", this.GUID);
		this.WMDConfig = this.Script.WMDConfig;
		this.DGConfig = this.Script.DGConfig;

		if(this.Script.splitRatio != "") {
			this.splitPercent=this.Script.splitRatio;
			getPanel(this.parentStageID, this.parentWindowID, "TUTORIAL_BODY_SPLITPANE").setSplitAmount(this.Script.splitRatio);
		}

		if(this.Script.leftContentPanelSize != null)
			getPanel(this.parentStageID, this.parentWindowID, "TUTORIAL_BODY_SPLITPANE").setFixedPanelSize(this.Script.leftContentPanelSize);
					
		if(this.Script.defaultLayout != null) {
			this.Script.defaultLayout.windowStage = this.elementUniqueID + "_stage";
			this.Script.defaultLayout.windowType = CAN_NOT_CLOSE;
			loadNewPageLayout(encodeObject(this.Script.defaultLayout, this.localTutorialConstants));
		} else if(!this.Script.disableAdHoc) {
			var layout = ({
				target	: "TutorialSQL",
				raiseToTop: "",
				windowStage : this.elementUniqueID + "_stage",
				windowType: CAN_NOT_CLOSE,
				content	 : {
							type:"panel",
							name:"SQLBasePanel",
							PrimaryContainer:true,
							overflow:"hidden",
							ContentType:"LINK",
							data:{
								type:"ACTION",
								data:{
									parameters:{
										action:"ADHOC",
										controlerType:this.elementType,
										controlerID:this.GUID,
										AdHocLong:this.Script.useLongAcHoc
									}	
								}
											
							}
				}
			});
			loadNewPageLayout(layout);
		}
		if ( isNaN(this.startAtPage) ) 
			for (var i=0;i<this.Script.pageList.numIntroPages;i++)
				if(this.Script.pageList.introPages[i].name==this.startAtPage)
					this.startAtPage = i;
		if ( isNaN(this.startAtPage) ) 
			for (var i=0;i<this.Script.pageList.numGeneralPages;i++)
				if(this.Script.pageList.generalPages[i].name==this.startAtPage)
					this.startAtPage = this.Script.pageList.numIntroPages+i;
		if ( isNaN(this.startAtPage) ) 
			for (var i=0;i<this.Script.pageList.numLastPages;i++)
				if(this.Script.pageList.lastPages[i].name==this.startAtPage)
					this.startAtPage = this.Script.pageList.numIntroPages+this.Script.pageList.numGeneralPages+i;
		if ( isNaN(this.startAtPage) ) i= 0;
		if(this.Script.openAction != null)
			this.callActionScript(this.Script.openAction, "", this.callBackText + ".goToPage(" + this.startAtPage + ");");
		else
			this.goToPage(this.startAtPage);
		var prerequisitesNode=getNodeByXPath(this.Script.sourceDOM,this.Script.sourceDOM,'//tutorial/prerequisites');
		if(prerequisitesNode!=null)
			this.checkPrerequisites(prerequisitesNode.xml);
		if(this.Script.autoPlayTime!=null && this.Script.autoPlayTime!="") {
			var playImage=$(this.elementUniqueID + "_play");
			if(playImage) playImage.parentNode.style.visibility="visible";
		}
	},
	
	checkPrerequisites: function(list) {
		var tempParamObject = $H();
		tempParamObject.set('list',list);
		runTEScript(this.elementName + "_prerequisites", GLOBAL_TE_SCRIPT_STORE.get('checkPrerequisites'), null, null, tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
//		runTEScript(this.elementName + "_prerequisites", GLOBAL_TE_SCRIPT_STORE.get('checkPrerequisites'), null, null, this.callBackText+".checkPrerequisitesCallback" ,tempParamObject, this.parentStageID, this.parentWindowID, this.parentPanelID, this.elementName);
	},
	
	checkPrerequisitesCallback: function(returnStack) {
		if(returnStack.actionReturnValue != "true") return;
	},
	
	callActionScript: function(script, varStore, callBack) {
		if(script != "" && script != null) {
			var TEScriptMain = new actionScript(this.parentPageID + script.name, script, this.localTutorialConstants, this.parentStageID, this.parentWindowID, this.parentPanelID, this.parentPageID, null, this.localTutorialResultsSets);
			TEScriptMain.callAction('', '', callBack, varStore);
		}
		return true;
	},
	
	clearPagesInRightStage: function() {
		getStage(this.elementUniqueID + '_stage').closeAllWindows();
	},
	
	destroy: function($super) {
		if(this.SetAdHocTextLoop != null) {
			clearTimeout(this.SetAdHocTextLoop);
			this.SetAdHocTextLoop = null;
		}
		if(this.SetAdHocOptionsLoop != null) {
			clearTimeout(this.SetAdHocOptionsLoop);
			this.SetAdHocOptionsLoop = null;
		}
		if(this.Script != null)
			if(this.Script.closeAction != "" && this.Script.closeAction != null)
				this.callActionScript(this.Script.closeAction, "", "");

		this.wmdCleanup();
		
		if(!this.usingSharedSchema && this.dropSchema) {
			var localCloseScript = GLOBAL_TE_SCRIPT_STORE.get('TUTORIAL_CLOSE_SCRIPT');
			if(localCloseScript != "" && localCloseScript != null ) {
				var TEScriptMain = new actionScript(this.parentPageID + localCloseScript.name, localCloseScript, this.localTutorialConstants, null, null, null, this.parentPageID, null, this.localTutorialResultsSets);
				TEScriptMain.callAction('', '', null, null);
			}
		}
		$super();
	},

	wmdCleanup: function() {
		var thisObject = this;
		if(this.WMDConfig == null) return;
		if(this.WMDConfig['load'] == null) return;
		if(this.WMDConfig['load']['workload'] == null) return;
		var wmdConfig = $H(this.WMDConfig['load']['workload']);
		wmdConfig.each(function(keyValuePair) {
				var parameters = {		
					"USE_CONNECTION" : getActiveDatabaseConnection(),
					"action" : "WMDproxy",
					"returntype" : 'JSON',
					"WMDSystemName" : thisObject.WMDConfig.workloadSystem,
					"WMDMethod" : "DELETE",
					"WMDAction" : "workload/" + thisObject.tutorialSchema + "_" + keyValuePair.key + "@" + thisObject.WMDConfig.workloadUser
				};
		
				new Ajax.Request( ACTION_PROCESSOR, {
						'method': 'POST',
						'parameters': parameters,	
						'onSuccess': function(transport) {
						},
						'onComplete': function(transport) {
						}
				});
			});
		
	},

	goToPage: function(PagNum) {
		if(this.Script.pageList == null) return;
		if(PagNum >= this.Script.pageList.totalPages && PagNum < 0)
			return;
		this.displayPage(PagNum);
	},
	
	displayNextPage: function() {
		if(this.Script.pageList == null) return;
		if((this.currentPageNumber + 1) >= this.Script.pageList.totalPages)
			return;
		this.displayPage((this.currentPageNumber + 1));
	},
	
	displayPreviousPage: function() {
		if((this.currentPageNumber - 1) < 0)
			return;
		this.displayPage((this.currentPageNumber - 1));
	},
	
	displayPage: function(ThePageNumber) {
		if(ThePageNumber == this.currentPageNumber)
			return;
		this.beginPageTransitions( ThePageNumber, this.getPageObject(ThePageNumber));
	},
	
	getPageObject: function(ThePageNumber) {
		if(this.Script.pageList.numIntroPages > ThePageNumber)
			return this.Script.pageList.introPages[ThePageNumber];
		ThePageNumber -= this.Script.pageList.numIntroPages ;
		if(this.Script.pageList.numGeneralPages > ThePageNumber)
			return this.Script.pageList.generalPages[ThePageNumber];
		ThePageNumber -= this.Script.pageList.numGeneralPages ;
		return this.Script.pageList.lastPages[ThePageNumber];
	},

	processPageDetail : function(thePage,pageNumber,passVar) {
		if(this.currentPage.exitAction != "" && this.currentPage.exitAction != null)
			this.callActionScript(this.currentPage.exitAction, passVar, this.callBackText + ".exitActionCallBack");
		else if(thePage.entryAction != "" && thePage.entryAction != null)
			this.callActionScript(thePage.entryAction, passVar, this.callBackText + ".entryActionCallBack");
		else
			this.showPage(pageNumber, thePage);
	},
	
	beginPageTransitions : function( pageNumber, thePage) {
		closeOpenFloatingObject();
		$(this.elementUniqueID + "_PreviousPage").hide();
		$(this.elementUniqueID + "_NextPage").hide();
		$(this.elementUniqueID + "_Current_Page").hide();
		var elementUniqueID = this.elementUniqueID;
		if($(elementUniqueID + '_Body') != null) {
			this.oldContent = $(elementUniqueID + '_Body').innerHTML;
			$(elementUniqueID + '_Body').update("<table width='100%' height='100%'cellspacing='0' cellpadding='0' align='center' valign='center'>" +
												"<tr height='200px'><td align='center'><img style='float:none;' src='images/loadingpage.gif'/></td></tr>" +
												"<tr height='30px'><td><span><h1>Loading Page " + (parseInt(pageNumber)+1) + ": " + thePage.name + "</h1></span></td></tr>" +
												"<tr><td>" + thePage.pageTransitionsDescription + "</td></tr>" +
												"</table>");
		}
		if(this.currentPage == null)
			this.showPage(pageNumber, thePage);
		else {
			var passVar = {
				"pageNumber" : pageNumber,
				"thePage" : thePage
			};
			if(TUTORIAL_FREE_WITH_CHECKS == this.pageFlow) {
				this.processPageDetail(thePage,pageNumber,passVar);
				return;
			} else if(TUTORIAL_FLOW_FREE == this.pageFlow) {
				this.showPage(pageNumber, thePage);
				return;
			}
			var pageChangeScale = pageNumber - this.currentPageNumber;
			if(this.currentPageNumber == this.forwardMostVistedPage) {
				if(pageChangeScale == 1) {
					this.processPageDetail(thePage,pageNumber,passVar);
					return;
				} else if(pageChangeScale == -1) {
					switch(this.pageFlow) {
						case TUTORIAL_FLOW_STRICT_SEQUENTIAL:
							this.processPageDetail(thePage,pageNumber,passVar);
							break;
						default:
							this.showPage(pageNumber, thePage);
							break;
					}
					return;
				} else if(pageChangeScale > 1) {
					if(this.pageFlow == TUTORIAL_FLOW_FORWARD_EXPLORATION)
						this.showPage(pageNumber, thePage);
					return;
				} else if(pageChangeScale < -1) {
					switch(this.pageFlow) {
						case TUTORIAL_FLOW_FORWARD_SEQUENTIAL:
						case TUTORIAL_FLOW_FORWARD_EXPLORATION:
							this.showPage(pageNumber, thePage);
							break;
					}
					return;
				}
			} else {
				if(pageChangeScale == 1) {
					switch(this.pageFlow) {
						case TUTORIAL_FLOW_FORWARD_EXPLORATION:
							this.showPage(pageNumber, thePage);
							return;
						default:
							this.processPageDetail(thePage,pageNumber,passVar);
							return;
					}
				} else if(pageChangeScale == -1) {
					switch(this.pageFlow) {
						case TUTORIAL_FLOW_STRICT_SEQUENTIAL:
							this.processPageDetail(thePage,pageNumber,passVar);
							return;
						default:
							this.showPage(pageNumber, thePage);
							return;
					}
				} else if(pageChangeScale < -1) {
					switch(this.pageFlow) {
						case TUTORIAL_FLOW_FORWARD_SEQUENTIAL:
						case TUTORIAL_FLOW_FORWARD_EXPLORATION:
							this.showPage(pageNumber, thePage);
					}
					return;
				} else if(pageNumber <= this.forwardMostVistedPage) {
					if(this.pageFlow == TUTORIAL_FLOW_FORWARD_EXPLORATION)
							this.showPage(pageNumber, thePage);
					return;
				} else if(pageNumber = this.forwardMostVistedPage + 1) {
					if(this.pageFlow == TUTORIAL_FLOW_FORWARD_EXPLORATION) 
						this.processPageDetail(thePage,pageNumber,passVar);
					return;
				}
			}
		}
	},

	exitActionCallBack: function(returnStack) {
		var elementUniqueID = this.elementUniqueID;
		if("true" != String(returnStack.actionReturnValue).toLowerCase()) {
			if($(elementUniqueID + '_Body') != null)
				$(elementUniqueID + '_Body').update(this.oldContent);
			this.displayPageNumber();
			return false;
		}
		if(returnStack.localVariables.thePage.entryAction != "" && returnStack.localVariables.thePage.entryAction != null)
			this.callActionScript(returnStack.localVariables.thePage.entryAction, returnStack.localVariables, this.callBackText + ".entryActionCallBack");
		else
			this.showPage(returnStack.localVariables.pageNumber, returnStack.localVariables.thePage);
	},
	entryActionCallBack : function(returnStack) {
		var elementUniqueID = this.elementUniqueID;
		if("true" != String(returnStack.actionReturnValue).toLowerCase()) {
			if($(elementUniqueID + '_Body') != null)
				$(elementUniqueID + '_Body').update(this.oldContent);
			this.displayPageNumber();
			return false;
		}
		this.showPage(returnStack.localVariables.pageNumber, returnStack.localVariables.thePage);
	},
	
	runPreAdHocScript: function(callBack,adHocSQLText,adHocSQLOptions) {
		var pageObject = this.getPageObject(this.currentPageNumber);
		if(pageObject == undefined? false : pageObject.preAdhocRunAction != null) {
			this.callActionScript(pageObject.preAdhocRunAction, {"callBack":callBack,"adHocSQLText":adHocSQLText,"adHocSQLOptions":adHocSQLOptions}, this.callBackText + ".runPreAdHocScriptCallback");
			return;
		}
		if(callBack != null && callBack != "")
			eval(callBack);
	},
	runPreAdHocScriptCallback: function(returnStack) {
		if("true" != String(returnStack.actionReturnValue).toLowerCase()) 
			return;
		for (key in returnStack.localVariables)
			eval(key+"=returnStack.localVariables."+key);
		eval(callBack);
	},
	
	setAdhocPlayResultsFinished: function() {
		this.adhocPlayResultsFinished=true;
	},
	
	setAdhocRunState: function(stmts,errors,warnings) {
		this.adhocRun=true;
		this.adhocRunStmts=stmts;
		this.adhocRunErrors=errors;
		this.adhocRunWarnings=warnings;
		if(this.playing)
			if(errors!=0 || this.currentPageNumber+1 >= this.Script.pageList.totalPages) 
				this.playStop();
	},
	
	runPostAdhocScript: function(callBack) {
		var pageObject = this.getPageObject(this.currentPageNumber);
		if(pageObject == undefined? false : pageObject.postAdhocRunAction != null)
			this.callActionScript(pageObject.postAdhocRunAction , null, callBack);
		else if(callBack != null && callBack != "")
			eval(callBack);
	},
	
	showPage: function(pageNumber, thePage) {
		this.adhocRunStmts=0;
		this.adhocRunErrors=0;
		this.adhocRunWarnings=0;
		this.adhocRunScript=((thePage.SQLText != "" && thePage.SQLText != null) || (thePage.SQLText != "" && thePage.SQLText != null));
		this.adhocRun=!this.adhocRunScript;

		
    	var tutorialBodySplitPane = getPanel(this.parentStageID, this.parentWindowID, "TUTORIAL_BODY_SPLITPANE");
    	
		if(thePage.splitRatio == "" ) {
			if(this.splitChanged4Page) {
//				tutorialBodySplitPane.setSplitAmount(this.splitPercent);
//				tutorialBodySplitPane.minimizedPanelSplitRatio=this.splitPercent;
//				tutorialBodySplitPane.minimizeFrame(true);
				tutorialBodySplitPane.calculateSplit(this.splitPercent);
				tutorialBodySplitPane.setWidhtBarSnapIcons();
				tutorialBodySplitPane.setSize();
				this.splitChanged4Page=false;
			}
		} else {
//			tutorialBodySplitPane.setSplitAmount(thePage.splitRatio);
//			tutorialBodySplitPane.minimizedPanelSplitRatio=thePage.splitRatio;
//			tutorialBodySplitPane.minimizeFrame(true);
			
			tutorialBodySplitPane.calculateSplit(thePage.splitRatio);
			tutorialBodySplitPane.setWidhtBarSnapIcons();
			tutorialBodySplitPane.setSize();
			this.splitChanged4Page=true;
		}
    	
		var maximizeToRight = thePage.maximizeTo == "right" ? true : thePage.maximizeTo == "left" ? false : "";
		if(maximizeToRight !== ""){
			tutorialBodySplitPane.minimizedPanelSplitRatio = null;	
			tutorialBodySplitPane.minimizeFrame(maximizeToRight);
			if(this.isMaximized == false)
	            tutorialBodySplitPane.lastSplitRatio = tutorialBodySplitPane.minimizedPanelSplitRatio;
			this.isMaximized = true;
	   } else {
			if(this.isMaximized == true) {
			    tutorialBodySplitPane.minimizedPanelSplitRatio = tutorialBodySplitPane.lastSplitRatio;
				tutorialBodySplitPane.minimizeFrame(true);
				this.isMaximized = false;
			}
		}
	   
		if(this.SetAdHocTextLoop != null) {
			clearTimeout(this.SetAdHocTextLoop);
			this.SetAdHocTextLoop = null;
		}
		if(this.SetAdHocOptionsLoop != null) {
			clearTimeout(this.SetAdHocOptionsLoop);
			this.SetAdHocOptionsLoop = null;
		}
		if(this.forwardMostVistedPage < pageNumber || this.pageFlow == TUTORIAL_FLOW_FORWARD_SEQUENTIAL)
			this.forwardMostVistedPage = parseInt(pageNumber);
		this.currentPageNumber =parseInt( pageNumber);
		var oldContent = "";
		var elementUniqueID = this.elementUniqueID;
		var localTutorialConstants = this.localTutorialConstants;
		var thisObject = this;
		this.currentPage = thePage;
		this.insertAllPages();
		if((this.Script.autoCloseWindowsInRightStage == true && thePage.closeWindowsInRightStage == null) || (thePage.closeWindowsInRightStage == true))
			this.clearPagesInRightStage();
		if((this.Script.autoClearAdhocResults == true && thePage.clearAdhocResults == null) || (thePage.clearAdhocResults == true))
			try {
				if(this.attached_AdHoc != null)
					this.attached_AdHoc.clearResults();
			}
			catch(e){}
		if((this.Script.autoClearAdhocText == true && thePage.clearAdhocText == null) || (thePage.clearAdhocText == true))
			thisObject.updateSQLText( encodeURIandNormaMessage("", localTutorialConstants), pageNumber);
		if(thePage.SQLFile != "" && thePage.SQLFile != null) {
			var localTutorialConstants = this.localTutorialConstants;
			new Ajax.Request(this.Script.contentFolder + '/SQL/' + thePage.SQLFile, {
				'onSuccess': function(transport) {
					thisObject.updateSQLText(escape(encodeURIandNormaMessage(transport.responseText, localTutorialConstants)), pageNumber);
				}
			});
			RaiseToTop(elementUniqueID + '_stage', "TutorialSQL");
		}
		else if(thePage.SQLText != "" && thePage.SQLText != null)
			thisObject.updateSQLText( encodeURIandNormaMessage(thePage.SQLText, localTutorialConstants), pageNumber);
		if(thePage.loadActionScriptFile != "" && thePage.loadActionScriptFile != null) {
			var baseFolder = this.Script.contentFolder;
			var layout = ({
			target	: pageNumber + "_ActionPanel",
			raiseToTop: "y",
			windowStage :elementUniqueID + '_stage',
			content	 : {
							type:"panel",
							name:"titleBar",
							PrimaryContainer:true,
							ContentType:"URL",
							overflow:"hidden",
							data: ACTION_PROCESSOR + "?action=loadActionPanel&actionFile=" + encodeURIComponent( baseFolder + "/actionScript/" + thePage.loadActionScriptFile) + "&actionLocalConstant=" + encodeURIComponent(this.callBackText + '.localTutorialConstants') + '&actionSharedResultSets=' + encodeURIComponent(this.callBackText + '.localTutorialResultsSets')
						}
			});
			loadNewPageLayout(layout);
		}
		this.setSQLOptions(pageNumber);
		if(thePage.autoLoadLink != "" && thePage.autoLoadLink != null) 
			for(var i=0;i<thePage.autoLoadLink.length;i++) {
				var pageWindows = cloneObject(thePage.autoLoadLink[i].PageWindows);
				var linkList = cloneObject(thePage.autoLoadLink[i].LinkList);
				var pageLayout = encodeObject(pageWindows[0], this.localTutorialConstants);
				pageLayout.windowStage = elementUniqueID + '_stage';
				loadPage(pageLayout, encodeObject(linkList, this.localTutorialConstants));
			}
		$(this.elementUniqueID + '_topTutorialTitle').update(thePage.name);
		if(thePage.contentFile != "" && thePage.contentFile != null)
			new Ajax.Request(this.Script.contentFolder + '/HTML/' + thePage.contentFile, {
					'onSuccess': function(transport) {
						if($(elementUniqueID + '_Body') != null)
							$(elementUniqueID + '_Body').update(encodeMessage(transport.responseText, localTutorialConstants));
					},
					'onFailure': function(transport) {
						if($(elementUniqueID + '_Body') != null)
							$(elementUniqueID + '_Body').update(encodeMessage(transport.responseText, localTutorialConstants));
					}
			});
		else if(thePage.contentUrl != "")
			$(this.elementUniqueID + '_Body').update('<iframe src="' + encodeMessage(thePage.contentUrl, localTutorialConstants) + '" height="100%" width="100%" frameborder="0" scrolling="auto"></iframe>');
		else
			$(this.elementUniqueID + '_Body').update(unescape(encodeURIandNormaMessage(thePage.contentText)));
		this.displayPageNumber();
		if(thePage.focusOnWindow!=null && thePage.focusOnWindow!="")
			RaiseToTop(elementUniqueID + '_stage', thePage.focusOnWindow);
		if(this.playing) 
			switch (coalesce(nullif(thePage.autoPlay,''),'true')) {
				case 'true':
					this.playPages();
					break;
				case 'stop':
					this.playPages();
				default:
					this.playStop();
			}
		return true;
	},
	
	updateSQLText: function(SQLText, pageNumber) {
		if(this.SetAdHocTextLoop != null) {
			clearTimeout(this.SetAdHocTextLoop);
			this.SetAdHocTextLoop = null;
		}
		if(this.Script.disableAdHoc) return;
		var SQLHighlightOptions = this.getPageObject(pageNumber).codeHighlightOptions;
		if(this.attached_AdHoc != null) {
			SQLText = unescape(SQLText);
			var Highlight = false;
			var sendHighlightOptions = null;
			if(this.Script.globalCodeHighlightOptions != null) {
				if(this.Script.globalCodeHighlightOptions.highlightCode != null)
					Highlight = this.Script.globalCodeHighlightOptions.highlightCode;
			}
			if(SQLHighlightOptions != null) {
				if(SQLHighlightOptions.highlightCode != null)
					Highlight = SQLHighlightOptions.highlightCode == true ? true : false;
				if(this.Script.globalCodeHighlightOptions != null) {
					sendHighlightOptions = {
							addedHighlightTokens:  this.Script.globalCodeHighlightOptions.addedHighlightTokens.concat(SQLHighlightOptions.addedHighlightTokens),
							changedHighlightTokens: this.Script.globalCodeHighlightOptions.changedHighlightTokens.concat(SQLHighlightOptions.changedHighlightTokens),
							removedHighlightTokens: this.Script.globalCodeHighlightOptions.removedHighlightTokens.concat(SQLHighlightOptions.removedHighlightTokens), 
							copiedHighlightTokens:  this.Script.globalCodeHighlightOptions.copiedHighlightTokens.concat(SQLHighlightOptions.copiedHighlightTokens)
					};
				} else {
					sendHighlightOptions = {
							addedHighlightTokens:  SQLHighlightOptions.addedHighlightTokens,
							changedHighlightTokens: SQLHighlightOptions.changedHighlightTokens,
							removedHighlightTokens: SQLHighlightOptions.removedHighlightTokens, 
							copiedHighlightTokens:  SQLHighlightOptions.copiedHighlightTokens
					};
				}
			} else {
				if(this.Script.globalCodeHighlightOptions != null) {
					sendHighlightOptions = {
								addedHighlightTokens:  this.Script.globalCodeHighlightOptions.addedHighlightTokens,
								changedHighlightTokens: this.Script.globalCodeHighlightOptions.changedHighlightTokens,
								removedHighlightTokens: this.Script.globalCodeHighlightOptions.removedHighlightTokens, 
								copiedHighlightTokens:  this.Script.globalCodeHighlightOptions.copiedHighlightTokens
						};
				}
			}
			var highlightedCode = "";
			this.attached_AdHoc.setAdHocText(SQLText, Highlight, sendHighlightOptions);
		}
		else
			this.SetAdHocTextLoop = setTimeout(this.callBackText + '.updateSQLText("' + SQLText + '",' + pageNumber + ");", 500);
	},

	setSQLOptions: function(pageNumber) {
		if(this.SetAdHocOptionsLoop != null) {
			clearTimeout(this.SetAdHocOptionsLoop);
			this.SetAdHocOptionsLoop = null;
		}
		if(this.Script.disableAdHoc) return;
		try {
			var SQLOptions = this.getPageObject(pageNumber).SQLOptions;
			if(this.attached_AdHoc == null) {
				this.SetAdHocOptionsLoop = setTimeout(this.callBackText + ".setSQLOptions(" + pageNumber + ");", 500);
				return;
			}

			this.attached_AdHoc.updateAdHocOptions('XML', SQLOptions.displayXML);
			this.attached_AdHoc.updateAdHocOptions('XMLinline', SQLOptions.displayXMLinline);
			this.attached_AdHoc.updateAdHocOptions('CLOB', SQLOptions.displayCLOB);
			this.attached_AdHoc.updateAdHocOptions('CLOBinline', SQLOptions.displayCLOBinline);
			this.attached_AdHoc.updateAdHocOptions('BLOB', SQLOptions.displayBLOB);
			this.attached_AdHoc.updateAdHocOptions('BDCLOB', SQLOptions.displayDBClob);
			this.attached_AdHoc.updateAdHocOptions('Commit', SQLOptions.commitPerStmt);
			this.attached_AdHoc.updateAdHocOptions('CommentOnDoubleSlash', SQLOptions.commentOnDoubleSlash);
			this.attached_AdHoc.updateAdHocOptions('TermChar', SQLOptions.termChar);
			this.attached_AdHoc.updateAdHocOptions('Rows', SQLOptions.numRowReturn);
			this.attached_AdHoc.updateAdHocOptions('MaxExecutionTime', SQLOptions.maxExecutionTime);
			this.attached_AdHoc.updateAdHocOptions('MaxRunTime', SQLOptions.shellMaxRunTime);
			this.attached_AdHoc.updateAdHocOptions('ShellTermChar', SQLOptions.shellTermChar);
			this.attached_AdHoc.updateAdHocOptions('PlayResultSetTime', this.Script.autoPlayTime);
			if(!this.Script.disableSetSchema)
				this.attached_AdHoc.updateAdHocOptions('DefaultSchema', this.localTutorialConstants.get("SCHEMA"));

			this.attached_AdHoc.changeScriptMode(SQLOptions.scriptMode);
			this.attached_AdHoc.resultSetStorageHolder = this.localTutorialResultsSets;
			if(SQLOptions.saveResultIn != null && SQLOptions.saveResultIn != "")
				this.attached_AdHoc.resultSetStorageName = this.parentPageID + "_" + SQLOptions.saveResultIn;
			else
				this.attached_AdHoc.resultSetStorageName = null;
		} catch(e) { }
	},

	displayPageNumber: function() {
		var pageNum = (parseInt(this.currentPageNumber) + 1);
		$(this.elementUniqueID + "_Current_Page").show();
		$(this.elementUniqueID + "_Current_Page").update("&nbsp;&nbsp;" + pageNum + "&nbsp;of&nbsp;" + this.Script.pageList.totalPages + "&nbsp;&nbsp;<img class='inlineimage' src='images/icon-down-on.gif'/>");
		$(this.elementUniqueID + "_PreviousPage").show();
		$(this.elementUniqueID + "_NextPage").show();
		if(this.currentPageNumber == 0) {
			$(this.elementUniqueID + "_PreviousPage").src = "./images/windownav/BWArrow_inActive.gif";
			$(this.elementUniqueID + "_NextPage").src = "./images/windownav/FWArrow_active.gif";
		} else if(this.currentPageNumber == (this.Script.pageList.numIntroPages + this.Script.pageList.numGeneralPages + this.Script.pageList.numLastPages - 1)) {
			$(this.elementUniqueID + "_PreviousPage").src = "./images/windownav/BWArrow_active.gif";
			$(this.elementUniqueID + "_NextPage").src = "./images/windownav/FWArrow_inActive.gif";
		} else {
			$(this.elementUniqueID + "_PreviousPage").src = "./images/windownav/BWArrow_active.gif";
			$(this.elementUniqueID + "_NextPage").src = "./images/windownav/FWArrow_active.gif";
		}
	},

	insertAllPages: function() {
		var PageNumber = 0;
		var thisTutorial = this;
		var inserterFirstArrow = false;
		var NodeArray = [];
		var elementUniqueID = this.elementUniqueID;
		var currentPageNumber = this.currentPageNumber;
		var thisObject = this;
		var navigablePages = new Array();
		for(i=0; i < this.Script.pageList.totalPages; i++)
			navigablePages[i] = false;
		var rangeStart=0
			,rangeEnd=this.Script.pageList.totalPages;
		switch(this.pageFlow) {
			case TUTORIAL_FLOW_FORWARD_SEQUENTIAL:
			case TUTORIAL_FLOW_FORWARD_EXPLORATION:
				rangeEnd=this.forwardMostVistedPage+1;
			case TUTORIAL_FREE_WITH_CHECKS:
			case TUTORIAL_FLOW_FREE:
				break;
			case TUTORIAL_FLOW_STRICT_SEQUENTIAL:
				rangeStart=this.currentPageNumber-1;
				rangeEnd = this.currentPageNumber+1;
				break;
		}
		for(i=rangeStart; i < rangeEnd; i++)
			navigablePages[i] = true;
		var makeLink = function(Page) {
			if(PageNumber == currentPageNumber)
				$(elementUniqueID + '_PageList').insert('<li style="text-align:left;padding-left:10px;padding-right:10px;"><NOBR><b>'+ (PageNumber + 1) + ": " + Page.name.replace(" ", "&nbsp;") + "</b></NOBR></li>");
			else if(navigablePages[PageNumber])
				$(elementUniqueID + '_PageList').insert('<li style="text-align:left;padding-left:10px;padding-right:10px;"><NOBR><a onClick="' + thisObject.callBackText + '.goToPage(' + PageNumber + ');">'+ (PageNumber + 1) + ": " + Page.name.replace(" ", "&nbsp;") + "</a></NOBR></li>");
			else
				$(elementUniqueID + '_PageList').insert('<li style="text-align:left;padding-left:10px;padding-right:10px;"><NOBR>'+ (PageNumber + 1) + ": " + Page.name.replace(" ", "&nbsp;") + "</NOBR></li>");
			PageNumber++;
		};
		$(elementUniqueID + '_PageList').update("");
		this.Script.pageList.introPages.each(makeLink);
		this.Script.pageList.generalPages.each(makeLink);
		this.Script.pageList.lastPages.each(makeLink);
	},

	sizeWidth: function(Amount) {
		this.setWidth(0);
	},

	sizeHeight: function(Amount) {
		this.setHeight(0);
	},

	setWidth: function(Amount) {
		var thewidth = 0;
		if ($(this.parentStageID + "_" + this.parentWindowID + "_TUTORIAL_TEXT_PANEL") != null)
			thewidth = $(this.parentStageID + "_" + this.parentWindowID + "_TUTORIAL_TEXT_PANEL").getWidth();
		if ($(this.elementUniqueID + "_Body") != null && $(this.elementUniqueID + "_Body_container") != null) 
			$(this.elementUniqueID + "_Body").setStyle({ "width": (thewidth - 20) + "px" });
	},

	setHeight: function(Amount) {
		var theheight = 0;
		if ($(this.parentStageID + "_" + this.parentWindowID + "_TUTORIAL_TEXT_PANEL") != null)
			theheight = $(this.parentStageID + "_" + this.parentWindowID + "_TUTORIAL_TEXT_PANEL").getHeight();
		if ($(this.elementUniqueID + "_Body") != null)
			$(this.elementUniqueID + "_Body").setStyle({ "height": (theheight-10) + "px" });
	},

	playToogle: function() {
		if(this.Script.autoPlayTime==null) return;
		if(this.playing) this.playStop();
		else this.playPages();
	},

	playStop: function() {
		clearTimeout(this.playing);
		this.parentPanel.clearLoadIndicator();
		$(this.elementUniqueID + "_play").src="images/play.png";
		this.playing=null;
	},

	playPages: function() {
		$(this.elementUniqueID + "_play").src="images/stop.png";
		this.parentPanel.startServerLoadIndicator();
		if(this.adhocRunScript) 
			if(this.attached_AdHoc != null) {
				this.adhocPlayResultsFinished=false;
				this.attached_AdHoc.play();
			}
		if(!this.playing)
			clearTimeout(this.playing);
		if(this.currentPageNumber+1 >= this.Script.pageList.totalPages) {
			this.playStop();
			return;
		}
		this.playing=setTimeout(this.callBackText + ".playNextPage();", 1000*this.Script.autoPlayTime);
	},

	playNextPage: function() {
		if(this.currentPageNumber+1 >= this.Script.pageList.totalPages) {
			this.playStop();
			return;
		}
		if(!this.adhocRun || !this.adhocPlayResultsFinished) {
			this.playing=setTimeout(this.callBackText + ".playNextPage();", 2000);
			return;
		}
		if(this.adhocRunErrors==0) {
			this.displayNextPage();
			return;
		}
		this.playToogle();
	}
}));
