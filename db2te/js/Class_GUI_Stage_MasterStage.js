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
var windowStage = Class.create(embeddedStage, {
	initialize: function($super, myID, HasMenuBarContainer, fromTop, fromBotton, fromLeft, fromRight, titleBarType, windowOptionType, windowControlTypes, sizable) {
		this.elementType = this.elementType == null ? 'MASTER_STAGE' : this.elementType;
		$super(myID, HasMenuBarContainer, fromTop, fromBotton, fromLeft, fromRight, titleBarType, windowOptionType, windowControlTypes, sizable);
		this.positionType = "absolute";
		this.CoreElementContainer = null;
	},
	sizeContent: function() {
		if(this.theObjectIsDead) return;
		if(WINDOW_IS_FULL != this.sizable || this.theObjectIsDead)
			return;
		if(this.CoreElementContainer == null)
			this.CoreElementContainer = $(this.elementName);
		if(this.CoreElementContainer == null)
			return;
		var pDimensions = this.CoreElementContainer.getDimensions();
		this.contentWidth = pDimensions.width - this.WidthOffset;
		this.contentHeight = pDimensions.height - this.HeightOffset;
		var window = this.PageWindows.get(this.ActiveWindow.windowID);
		if(window != null)
		{
			window.setSize(this.contentWidth, this.contentHeight);
		}
	},
	size: function() {
		if($(this.elementName) == null)
			return;
		var elementParent = $(this.elementName).ancestors();
		var pDimensions = elementParent[0].getDimensions()
		var width =	pDimensions.width;
		var height = pDimensions.height;
		if(elementParent[0].identify() == 'PageBody')
		{
				width = pageWidth;
				height = pageHeight;
		}
		if(this.sizable == WINDOW_IS_FULL)
		{
			$(this.elementName + '_ContentWindow').setStyle({"width" : (width- ( this.fromLeft + this.fromRight) ) + "px"});
			$(this.elementName + '_ContentWindow').setStyle({"height": (height - ( this.fromBotton + this.fromTop + this.HeightOffset) ) + "px"}); //Remove height of menubar
			if($(this.elementName + '_MenuBarWindow') != null)
			{
				$(this.elementName + '_MenuBarWindow').setStyle({"width" : (width- ( this.fromLeft + this.fromRight) ) + "px"});
				$(this.elementName + '_MenuBar').setStyle({"width": (width-(parseInt($(this.elementName + '_MenuBar_Table').getStyle('left'), 10)+40)) + "px"});
			}
			this.sizeContent();
		}
		else
		{
			this.PageWindows.each( function(ID) {
				if(ID != null)
				{
					ID.value.WindowSizeLeft();
					ID.value.WindowSizeTop();
				}
			});
		}
	}
});