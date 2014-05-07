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
var splitPane = Class.create(basePageElement, {
  initialize: function($super, myID, VerticalSplit, splitPercent, maxSize, allowResize, showSplitSpacer, splitSpacerWidth, styleOverride) {
  	$super(myID, "SPLITPANE");
  	this.elementUniqueID = myID + this.GUID;
	this.containerA = null;
	this.containerB = null;
	this.frameMinimizeA = null;
	this.frameMinimizeB = null;
	this.VerticalSplit = VerticalSplit;
	this.FixedPanelSize = maxSize; // positive for A neg for B
	this.allowResize = true;
	if(allowResize != null)
		this.allowResize = allowResize;
	this.showSplitSpacer = showSplitSpacer != null ? showSplitSpacer : (allowResize ? true : false);
	this.splitSpacerWidth = splitSpacerWidth != null ? splitSpacerWidth : (this.allowResize ? 6 : 0);
	this.styleOverride = styleOverride != null ? styleOverride : "" ;
    this.width  = 1000;
    this.height = 1000;
    this.contentPanelA = null;
    this.contentPanelA_table = null;
    this.contentPanelB = null;
    this.contentPanelA_table = null;
    this.defaultSplit = 0.30;
    if(splitPercent != null)
    	this.defaultSplit = splitPercent;
    this.calculateSplit(this.defaultSplit);
    this.minimizedPanelSplitRatio = null;
    this.currentSplitAmount = 0;
  },
  setFixedPanelSize: function(newSize) {
  	this.FixedPanelSize = newSize;
  	this.sizeHeight(0);
  	this.sizeWidth(0);
  	
  },
	resizeStart: function() {
		if(this.containerA != null)
			this.containerA.resizeStart();
		if(this.containerB != null)
			this.containerB.resizeStart();
	},
	resizeEnd: function() {
		if(this.containerA != null)
			this.containerA.resizeEnd();
		if(this.containerB != null)
			this.containerB.resizeEnd();
	},
  
  calculateSplit: function(splitRatio) {
  	if(this.theObjectIsDead) return;
  	splitRatio = splitRatio == null ? this.defaultSplit : splitRatio;
  	splitRatio = splitRatio > 1 ? this.defaultSplit : splitRatio;
	this.height_B = this.height;
	this.height_A = this.height;
	this.width_A = this.width;
	this.width_B = this.width;
	var size = 0;
    if(this.VerticalSplit)
    {
    	if(this.FixedPanelSize == null)
    	{
	    	this.width_A  = Math.floor(this.width * splitRatio);
	    	if(this.width_A > this.width - this.splitSpacerWidth)
	  			this.width_A = this.width - this.splitSpacerWidth;
	  		this.width_B = this.width - (this.width_A + this.splitSpacerWidth);
    	}
    	else if(this.FixedPanelSize >= 0)
    	{
    		if(this.FixedPanelSize < (this.width+this.splitSpacerWidth))
    		{
				this.width_A = this.FixedPanelSize;
				this.width_B = this.width-(this.FixedPanelSize+this.splitSpacerWidth);
    		}
    		else
    		{
				this.width_A = this.width-this.splitSpacerWidth;
				if(this.width_A < 0)
					this.width_A = 0;
				this.width_B = 0;
    		}
    	}
    	else
    	{
    		size = -1 * this.FixedPanelSize;
    		if(size < (this.width+this.splitSpacerWidth))
    		{
				this.width_B = size;
				this.width_A = this.width-(size+this.splitSpacerWidth);
    		}
    		else
    		{
				this.width_B = this.width-this.splitSpacerWidth;
				if(this.width_B < 0)
					this.width_B = 0;
				this.width_A = 0;
    		}
    	}
    }
    else
    {
    	if(this.FixedPanelSize == null)
    	{
	    	this.height_A  = Math.floor(this.height * (1-splitRatio));
			if(this.height_A > this.height - this.splitSpacerWidth)
	  			this.height_A = this.height - this.splitSpacerWidth;
	  		this.height_B = this.height - (this.height_A + this.splitSpacerWidth);
    	}
    	else if(this.FixedPanelSize >= 0)
    	{
    		if(this.FixedPanelSize < (this.height+this.splitSpacerWidth))
    		{
				this.height_A = this.FixedPanelSize;
				this.height_B = this.height-(this.FixedPanelSize+this.splitSpacerWidth);
    		}
    		else
    		{
				this.height_A = this.height-this.splitSpacerWidth;
				if(this.height_A < 0)
					this.height_A = 0;
				this.height_B = 0;
    		}
    	}
    	else
    	{
    		size = -1 * this.FixedPanelSize;
    		if(size < (this.height+this.splitSpacerWidth))
    		{
				this.height_B = size;
				this.height_A = this.height-(size+this.splitSpacerWidth);
    		}
    		else
    		{
				this.height_B = this.height-this.splitSpacerWidth;
				if(this.height_B < 0)
					this.height_B = 0;
				this.height_A = 0;
    		}
    	}
    }
  },
  setSplitAmount: function(Value) {
  	if(this.theObjectIsDead) return;
  	if(Value > 1 || Value < 0)
  		return;
    this.calculateSplit(Value);
  	if(this.containerA != null)
  	{
	  	this.containerA.setSize(this.width_A, this.height_A);
  	}
  	if(this.containerB != null)
  	{
	  	this.containerB.setSize(this.width_B, this.height_B);
  	}
  },
  setWidth: function(Value) {
  	if(this.theObjectIsDead) return;
  	this.getContentPanels();
	if(Value < 0)
		Value = 0;
	if(this.VerticalSplit)
  	{
		this.width_B += this.splitSpacerWidth;
		if(this.width != 0)
	  		this.currentSplitAmount = this.width_A / (this.width_B + this.width_A);
  		this.width = Value;
   		this.calculateSplit(this.currentSplitAmount);
   		this.setWidhtBarSnapIcons();
  	}
  	else
  	{
  		this.width = Value;
   		this.width_A = this.width;
  		this.width_B = this.width;
		var split = $("Split_" + this.elementUniqueID);
  		if(split!=null)
  			split.setStyle({"width": this.width + "px"});
  		var splitAutoSize = $("SplitAutoSize_" + this.elementUniqueID);
  		if(splitAutoSize!=null)
  			splitAutoSize.setStyle({"left": ((this.width/2)-20) + "px"});
  	}
  	this.width_A = this.width_A == 0 ? 1 : this.width_A;
	if(this.contentPanelA != null)
		this.contentPanelA.setStyle({"width": this.width_A + "px"});
	if(this.contentPanelA_table != null)
		this.contentPanelA_table.setStyle({"width": this.width_A + "px"});
	this.width_B = this.width_B == 0 ? 1 : this.width_B;
	if(this.contentPanelB != null)
		this.contentPanelB.setStyle({"width": this.width_B + "px"});
	if(this.contentPanelB_table != null)
		this.contentPanelB_table.setStyle({"width": this.width_B + "px"});
	if(this.containerA != null)
		this.containerA.setWidth(this.width_A);
	if(this.containerB != null)
		this.containerB.setWidth(this.width_B);
  	return this.width;
  },
  setHeight: function(Value) {
  	if(this.theObjectIsDead) return;
  	this.getContentPanels();
	if(Value < 0)
		Value = 0;
	if(this.VerticalSplit)
  	{
  		this.height = Value;
   		this.height_A = this.height;
  		this.height_B = this.height;
  		var split = $("Split_" + this.elementUniqueID);
  		if(split!=null)
  			split.setStyle({"height": this.height + "px"});
  		var splitAutoSize = $("SplitAutoSize_" + this.elementUniqueID);
  		if(splitAutoSize!=null)
  			splitAutoSize.setStyle({"top": ((this.height/2)-20) + "px"});
  	}
  	else
  	{
  		this.height_B += this.splitSpacerWidth;
  		if(this.height != 0)
			this.currentSplitAmount = this.height_B / (this.height_B + this.height_A);
  		this.height = Value;
	    this.calculateSplit(this.currentSplitAmount);
	    this.setHeightBarSnapIcons();
  	}
  	this.height_A = this.height_A == 0 ? 1 : this.height_A;
	if(this.contentPanelA != null)
		this.contentPanelA.setStyle({"height": this.height_A + "px"});
	if(this.contentPanelA_table != null)
		this.contentPanelA_table.setStyle({"height": this.height_A + "px"});
	this.height_B = this.height_B == 0 ? 1 : this.height_B;
	if(this.contentPanelB != null)
		this.contentPanelB.setStyle({"height": this.height_B + "px"});
	if(this.contentPanelB_table != null)
		this.contentPanelB_table.setStyle({"height": this.height_B + "px"});
	if(this.containerA != null)
		this.containerA.setHeight(this.height_A);
	if(this.containerB != null)
		this.containerB.setHeight(this.height_B);
  	return this.height;
  },
  sizeWidth: function(Amount) {
  	if(this.theObjectIsDead) return;
  	this.getContentPanels();
  	if(this.VerticalSplit)
  	{
		this.setWidth(this.width+Amount);
  	}
  	else
  	{
  		this.width = this.width == 0 ? 1 : this.width;
  		if(this.contentPanelB != null)
			this.contentPanelB.setStyle({"width": this.width + "px"});
		if(this.contentPanelA != null)
			this.contentPanelA.setStyle({"width": this.width + "px"});
			
		if(this.contentPanelA_table != null)
			this.contentPanelA_table.setStyle({"width": this.width + "px"});
		if(this.contentPanelB_table != null)
			this.contentPanelB_table.setStyle({"width": this.width + "px"});
			
		if(this.containerB != null)
		{
			this.width_B = this.containerB.sizeWidth(Amount);
		}
		if(this.containerA != null)
		{
			this.width_A = this.containerA.sizeWidth(Amount);
		}
  		this.width += Amount;
  		var split = $("Split_" + this.elementUniqueID);
  		if(split!=null)
  			split.setStyle({"width": this.width + "px"});
  		var splitAutoSize = $("SplitAutoSize_" + this.elementUniqueID);
  		if(splitAutoSize!=null)
  			splitAutoSize.setStyle({"left": ((this.width/2)-20) + "px"});
			this.width_A = this.width;
			this.width_B = this.width;
  	}
  	return this.width;
  },
  sizeHeight: function(Amount) {
  	if(this.theObjectIsDead) return;
  	this.getContentPanels();
  	if(this.VerticalSplit)
  	{
  		this.height = this.height == 0 ? 1 : this.height;
		if(this.contentPanelB != null)
			this.contentPanelB.setStyle({"height": this.height + "px"});
		if(this.contentPanelA != null)
			this.contentPanelA.setStyle({"height": this.height + "px"});
			
		if(this.contentPanelA_table != null)
			this.contentPanelA_table.setStyle({"height": this.height + "px"});
		if(this.contentPanelB_table != null)
			this.contentPanelB_table.setStyle({"height": this.height + "px"});
			
  		if(this.containerB != null)
		{
			this.containerB.sizeHeight(Amount);
		}
		if(this.containerA != null)
		{
			this.containerA.sizeHeight(Amount);
		}
		this.height += Amount;
		var split = $("Split_" + this.elementUniqueID);
  		if(split!=null)
  			split.setStyle({"height": this.height + "px"});
  		var splitAutoSize = $("SplitAutoSize_" + this.elementUniqueID);
  		if(splitAutoSize!=null)
  			splitAutoSize.setStyle({"top": ((this.height/2)-20) + "px"});
			this.height_A = this.height;
			this.height_B = this.height;
  	}
  	else
  	{
		this.setHeight(this.height+Amount);
  	}
  	return this.height;
  },
  getContentPanels: function()
  {
  	if(this.contentPanelA == null)
  	{
  		this.contentPanelA = $(this.elementUniqueID + "_A");
  		this.contentPanelA_table = $(this.elementUniqueID + "_A_table");
  	}
  	if(this.contentPanelB == null)
  	{
  		this.contentPanelB = $(this.elementUniqueID + "_B");
  		this.contentPanelB_table = $(this.elementUniqueID + "_B_table");
  	}
  	if(this.frameMinimizeA == null)
  	{
  		this.frameMinimizeA = $(this.elementUniqueID + "_frameMinimizeA");
  	}
  	if(this.frameMinimizeB == null)
  	{
  		this.frameMinimizeB = $(this.elementUniqueID + "_frameMinimizeB");
  	}
  },
  moveLeft: function(Amount) {
  	if(this.theObjectIsDead) return;
  		if(this.containerA != null)
  			this.containerA.moveLeft(Amount);
  		if(this.containerB != null)
			 		this.containerB.moveLeft(Amount);
  },
  moveTop: function(Amount) {
  	if(this.theObjectIsDead) return;
  		if(this.containerA != null)
  			this.containerA.moveTop(Amount);
  		if(this.containerB != null)
			 		this.containerB.moveTop(Amount);
  },
  dividerMove: function(Amount) {
  	if(this.theObjectIsDead) return;
  	if(Amount == 0) return;
  	this.getContentPanels();
  	this.FixedPanelSize = null;
    if(this.VerticalSplit)
  	{
  		var oldWidthA = this.width_A;
  		var oldWidthB = this.width_B;
		if(this.containerB != null && this.containerA != null)
		{
			if(Amount > 0)
			{
				this.width_B = this.containerB.sizeWidth(-Amount);
				this.width_A = this.containerA.sizeWidth(oldWidthB - this.width_B);
			}
			else
			{
				this.width_A = this.containerA.sizeWidth(Amount);
				this.width_B = this.containerB.sizeWidth(oldWidthA - this.width_A);
			}
		}
		else if(this.containerB == null && this.containerA != null)
		{
			if(Amount > 0)
			{
				this.width_B = ((this.width_B - Amount > 0)? this.width_B - Amount : 0);
				this.width_A = this.containerA.sizeWidth(oldWidthB - this.width_B);
			}
			else
			{
				this.width_A = this.containerA.sizeWidth(Amount);
				this.width_B += (oldWidthA - this.width_A);
			}
		}
		else if(this.containerB != null && this.containerA == null)
		{
			if(Amount > 0)
			{
				this.width_B = this.containerB.sizeWidth(-Amount);
				this.width_A += (oldWidthB - this.width_B);
			}
			else
			{
			  this.width_A = ((this.width_A + Amount > 0)? this.width_A + Amount : 0);
				this.width_B = this.containerB.sizeWidth(oldWidthA - this.width_A);
			}
		}
		else
		{
			if(Amount > 0)
			{
				this.width_B = ((this.width_B - Amount > 0)? this.width_B - Amount : 0);
				this.width_A += (oldWidthB - this.width_B);
			}
			else
			{
				this.width_A = ((this.width_A + Amount > 0)? this.width_A + Amount : 0);
				this.width_B += (oldWidthA - this.width_A);
			}
		}
		this.width_A = this.width_A == 0 ? 1 : this.width_A;
		this.width_B = this.width_B == 0 ? 1 : this.width_B;
		this.contentPanelA.setStyle({"width": this.width_A + "px"});
		this.contentPanelB.setStyle({"width": this.width_B + "px"});
		
		if(this.contentPanelA_table != null)
			this.contentPanelA_table.setStyle({"width": this.width_A + "px"});
		if(this.contentPanelB_table != null)
			this.contentPanelB_table.setStyle({"width": this.width_B + "px"});
			
		
  		this.setWidhtBarSnapIcons();
  	}
  	else
  	{
  		var oldHeightA = this.height_A;
  		var oldHeightB = this.height_B;
	  	if(this.containerB != null && this.containerA != null)
		{
			if(Amount > 0)
			{
				this.height_B = this.containerB.sizeHeight(-Amount);
				this.height_A = this.containerA.sizeHeight(oldHeightB - this.height_B);
			}
			else
			{
				this.height_A = this.containerA.sizeHeight(Amount);
				this.height_B = this.containerB.sizeHeight(oldHeightA - this.height_A);
			}
		}
		else if(this.containerB == null && this.containerA != null)
		{
			if(Amount > 0)
			{
				this.height_B = ((this.height_B - Amount > 0)? this.height_B - Amount : 0);
				this.height_A = this.containerA.sizeHeight(oldHeightB - this.height_B);
			}
			else
			{
				this.height_A = this.containerA.sizeHeight(Amount);
				this.height_B += (oldHeightA - this.height_A);
			}
		}
		else if(this.containerB != null && this.containerA == null)
		{
			if(Amount > 0)
			{
				this.height_B = this.containerB.sizeHeight(-Amount);
				this.height_A += (oldHeightB - this.height_B);
			}
			else
			{
			  this.height_A = ((this.height_A + Amount > 0)? this.height_A + Amount : 0);
				this.height_B = this.containerB.sizeHeight(oldHeightA - this.height_A);
			}
		}
		else
		{
			if(Amount > 0)
			{
				this.height_B = ((this.height_B - Amount > 0)? this.height_B - Amount : 0);
				this.height_A += (oldHeightB - this.height_B);
			}
			else
			{
				this.height_A = ((this.height_A + Amount > 0)? this.height_A + Amount : 0);
				this.height_B += (oldHeightA - this.height_A);
			}
		}
		this.height_A = this.height_A == 0 ? 1 : this.height_A;
		this.height_B = this.width_A == 0 ? 1 : this.height_B;
		this.contentPanelA.setStyle({"height": this.height_A + "px"});
		this.contentPanelB.setStyle({"height": this.height_B + "px"});
		
		if(this.contentPanelA_table != null)
			this.contentPanelA_table.setStyle({"height": this.height_A + "px"});
		if(this.contentPanelB_table != null)
			this.contentPanelB_table.setStyle({"height": this.height_B + "px"});
		
		this.setHeightBarSnapIcons();
  	}
  },
	destroy: function($super) {
		this.theObjectIsDead = true;
		this.myParent = null;
		var parentWindow = getWindow(this.parentStageID, this.parentWindowID);
		if(this.containerA != null)
		{
			parentWindow.WindowContainers.unset(this.containerA.elementUniqueID);
			this.containerA.destroy();
		}
		this.containerA = null;
		if(this.containerB != null)
		{
			parentWindow.WindowContainers.unset(this.containerB.elementUniqueID);
			this.containerB.destroy();
		}
		this.containerB = null;
		ThisContainer = $(this.elementUniqueID);
		if(ThisContainer != null)
			ThisContainer.remove();
		$super();
	},
	setContainer: function(container, otherInfo) {
		if(otherInfo)
		{
			this.containerA = container;
			getWindow(this.parentStageID,this.parentWindowID).addWindowContainer(container.elementName, container);
			this.containerA.parentWindowID = this.parentWindowID;
			this.containerA.parentStageID = this.parentStageID;
			this.containerA.setSize(this.width_A, this.height_A);
		}
		else
		{
			this.containerB = container;
			getWindow(this.parentStageID,this.parentWindowID).addWindowContainer(container.elementName, container);
			this.containerB.parentWindowID = this.parentWindowID;
			this.containerB.parentStageID = this.parentStageID;
			this.containerB.setSize(this.width_B, this.height_B);
		}
	},
	reloadPage: function() {
		if(this.containerA != null)
			this.containerA.reloadPage();
		if(this.containerB != null)
			this.containerB.reloadPage();
	},
	draw: function() {
		this.calculateSplit();
		var output = "";
		output += "<table id='" + this.elementUniqueID + "' cellpadding='0' cellspacing='0' style='width:100%;height:100%;position:static;'>";
		output +=  "<tbody>";
		output +=  "<tr><td  valign='top' id='" + this.elementUniqueID + "_A_table' style='width:500px;height:500px;'>";
		output +=  "<div id='" + this.elementUniqueID + "_A' ";
		if(IS_TOUCH_SYSTEM && this.allowResize && this.showSplitSpacer)
			output += " ontouchstart='" + this.callBackText + ".touchStart(event)' ontouchend='" + this.callBackText + ".touchEnd(event)' ontouchmove='" + this.callBackText + ".touchMove(event)'";
		output += " style='width:500px;height:500px;overflow:hidden;display:block;position:static;background-color:white'>";
		if(this.containerA != null)
		{
			output += this.containerA.draw();
		}
		output +=  "</div>";
		output +=  "</td>";
		if(this.VerticalSplit)
		{
			if(this.allowResize && this.showSplitSpacer)
			{
				output +=  "<td  valign='top'>";
				output +=  "<div class='FrameBarV' style='" + (this.splitSpacerWidth != null ? "width:" + this.splitSpacerWidth + "px;max-width:" + this.splitSpacerWidth + "px;": "" ) + this.styleOverride + "' id='Split_" + this.elementUniqueID + "' onMouseDown=\"frameResize(" + this.callBackText + ", event)\">";
				output +=  "<div style='position:relative;top:45%;height:80px;" + (this.splitSpacerWidth != null ? "height:" + this.splitSpacerWidth + "px;max-height:" + this.splitSpacerWidth + "px;": "" ) + this.styleOverride + "'><table cellspacing='0' cellpadding='0'><tr><td>";
				if(!IS_TOUCH_SYSTEM)
				{
					output +=  "<img id='" + this.elementUniqueID + "_frameMinimizeA' onclick=\"" + this.callBackText + ".minimizeFrame(true);\" style='cursor:pointer;width:" + this.splitSpacerWidth + "px;' src='./images/splitpane/ver_right.gif'/></td></tr><tr><td>";
					output +=  "<img id='" + this.elementUniqueID + "_frameMinimizeB' onclick=\"" + this.callBackText + ".minimizeFrame(false);\" style='cursor:pointer;width:" + this.splitSpacerWidth + "px;' src='./images/splitpane/ver_left.gif'/>";
				}
				output +=  "</td></tr></table></div>";
				output +=  "</div>";
				output +=  "</td>";
			}
			else if(this.showSplitSpacer)
			{
				output +=  "<td  valign='top'>";
				output +=  "<div class='FrameBarVnoSize' id='Split_" + this.elementUniqueID + "' style='" + (this.splitSpacerWidth != null ? "width:" + this.splitSpacerWidth + "px;max-width:" + this.splitSpacerWidth + "px;": "" ) + this.styleOverride + "'/>";
				output +=  "</td>";
			}
		}
		else
		{
			output +=  "</tr>";
			if(this.allowResize && this.showSplitSpacer)
			{
				output +=  "<tr><td valign='top'>";
				output +=  "<div class='FrameBarH' style='" + (this.splitSpacerWidth != null ? "height:" + this.splitSpacerWidth + "px;max-height:" + this.splitSpacerWidth + "px;": "" ) + this.styleOverride + "' id='Split_" + this.elementUniqueID + "' onMouseDown=\"frameResize(" + this.callBackText + ", event)\">";
				output +=  "<div style='position:relative;left:45%;width:80px;" + (this.splitSpacerWidth != null ? "height:" + this.splitSpacerWidth + "px;max-height:" + this.splitSpacerWidth + "px;": "" ) + this.styleOverride + "'><table  cellspacing='0' cellpadding='0'><tr><td>";
				if(!IS_TOUCH_SYSTEM)
				{
					output +=  "<img id='" + this.elementUniqueID + "_frameMinimizeA' onclick=\"" + this.callBackText + ".minimizeFrame(false);\" style='cursor:pointer;height:" + this.splitSpacerWidth + "px;' src='./images/splitpane/hor_up.gif'/></td<td>";
					output +=  "<img id='" + this.elementUniqueID + "_frameMinimizeB' onclick=\"" + this.callBackText + ".minimizeFrame(true);\" style='cursor:pointer;height:" + this.splitSpacerWidth + "px;' src='./images/splitpane/hor_down.gif'/>";
				}
				output +=  "</td></tr></table></div>";
				output +=  "</div>";
				output +=  "</td></tr>";
			}
			else if(this.showSplitSpacer)
			{
				output +=  "<tr><td valign='top'>";
				output +=  "<div class='FrameBarHnoSize' id='Split_" + this.elementUniqueID + "' style='" + (this.splitSpacerWidth != null ? "height:" + this.splitSpacerWidth + "px;max-height:" + this.splitSpacerWidth + "px;": "" ) + this.styleOverride + "'/>";
				output +=  "</td></tr>";
			}
			output +=  "<tr>";
		}
		output +=  "<td valign='top' id='" + this.elementUniqueID + "_B_table' style='width:500px;height:500px;'>";
		output +=  "<div id='" + this.elementUniqueID + "_B' ";
		if(IS_TOUCH_SYSTEM && this.allowResize && this.showSplitSpacer)
			output += " ontouchstart='" + this.callBackText + ".touchStart(event)' ontouchend='" + this.callBackText + ".touchEnd(event)' ontouchmove='" + this.callBackText + ".touchMove(event)'";
		output +=  " style='width:500px;height:500px;overflow:hidden;display:block;position:static;background-color:white'>";
		if(this.containerB != null)
		{
			output += this.containerB.draw();
		}
		output +=  "</div>";
		output +=  "</td></tr>";
		output +=  "</tbody>";
		output +=  "</table>";
		return output;
	},
	minimizeFrame: function(shrinkDirection) {
		$(this.elementUniqueID + "_A").show();
		$(this.elementUniqueID + "_B").show();
	    if(this.VerticalSplit)
	  	{
	  		if(this.minimizedPanelSplitRatio == null)
	  		{
	  			this.width_B += this.splitSpacerWidth;
	  			this.minimizedPanelSplitRatio = this.width_A / (this.width_B + this.width_A);
	  			this.currentSplitAmount = this.minimizedPanelSplitRatio;
	  			if(shrinkDirection)
	  			{
	  				this.width_A = this.width - this.splitSpacerWidth;
	  				this.width_B = 0;
	  			}
	  			else
	  			{
					this.width_A = 0;
	  				this.width_B = this.width - this.splitSpacerWidth;
	  			}
	  		}
	  		else
	  		{
		  		this.calculateSplit(this.minimizedPanelSplitRatio);
	  		}
	  		this.setWidhtBarSnapIcons();
	  	}
	  	else
	  	{
	  		if(this.minimizedPanelSplitRatio == null)
	  		{
	  			this.height_B += this.splitSpacerWidth;
	  			this.minimizedPanelSplitRatio = this.height_B / (this.height_B + this.height_A);
	  			this.currentSplitAmount = this.minimizedPanelSplitRatio;
	  			if(shrinkDirection)
	  			{
	  				this.height_A = this.height - this.splitSpacerWidth;
	  				this.height_B = 0;
	  			}
	  			else
	  			{
					this.height_A = 0;
	  				this.height_B = this.height - this.splitSpacerWidth;
	  			}
	  		}
	  		else
	  		{
		  		this.calculateSplit(this.minimizedPanelSplitRatio);
	  		}
	  		this.setHeightBarSnapIcons();
	  	}
	  	this.setSize();
	},
	setWidhtBarSnapIcons: function() {
		if(this.width > (200 + this.splitSpacerWidth) && this.allowResize && this.frameMinimizeA != null && this.frameMinimizeB != null)
   		{
   			if(this.width_A < 40)
   			{
   				if(this.minimizedPanelSplitRatio == null)
	   				this.minimizedPanelSplitRatio = this.defaultSplit;
				this.frameMinimizeA.src = "./images/splitpane/ver_min_left_top.gif";
	  			this.frameMinimizeB.src = "./images/splitpane/ver_min_left_bottom.gif";
   			}
   			else if(this.width_B < 40)
   			{
   				if(this.minimizedPanelSplitRatio == null)
	   				this.minimizedPanelSplitRatio = this.defaultSplit;
  				this.frameMinimizeA.src = "./images/splitpane/ver_min_right_top.gif";
  				this.frameMinimizeB.src = "./images/splitpane/ver_min_right_bottom.gif";
   			}
   			else
   			{
	  			this.minimizedPanelSplitRatio = null;
	  			this.frameMinimizeA.src = "./images/splitpane/ver_right.gif";
	  			this.frameMinimizeB.src = "./images/splitpane/ver_left.gif";
   			}
  		}
	},
	setHeightBarSnapIcons: function() {
	   	if(this.height > (200 + this.splitSpacerWidth) && this.allowResize && this.frameMinimizeA != null && this.frameMinimizeB != null)
   		{
   			if(this.height_A < 40)
   			{
   				if(this.minimizedPanelSplitRatio == null)
	   				this.minimizedPanelSplitRatio = this.defaultSplit;
  				this.frameMinimizeA.src = "./images/splitpane/hor_min_top_left.gif";
  				this.frameMinimizeB.src = "./images/splitpane/hor_min_top_right.gif";
   			}
   			else if(this.height_B < 40)
   			{
   				if(this.minimizedPanelSplitRatio == null)
	   				this.minimizedPanelSplitRatio = this.defaultSplit;
  				this.frameMinimizeA.src = "./images/splitpane/hor_min_bottom_left.gif";
  				this.frameMinimizeB.src = "./images/splitpane/hor_min_bottom_right.gif";
   			}
   			else
   			{
	  			this.minimizedPanelSplitRatio = null;
	  			this.frameMinimizeA.src = "./images/splitpane/hor_up.gif";
	  			this.frameMinimizeB.src = "./images/splitpane/hor_down.gif";
   			}
  		}
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
		if(this.touchMoveEnabled && event.touches.length == 2)
		{
			var local_Mouse_X = 0;
			var local_Mouse_Y = 0;
			if( event.touches && event.touches.length == 2) { 
				this.touchMoveEnabled = true;
				local_Mouse_X = event.touches[0].clientX;
				local_Mouse_Y = event.touches[0].clientY;
			} else { 
				this.touchMoveEnabled = true;
				local_Mouse_X = event.clientX;
				local_Mouse_Y = event.clientY;
			}
			if(event.processed == null)
			{
				var move_X = -(this.Current_Mouse_X - local_Mouse_X);
				var move_Y = -(this.Current_Mouse_Y - local_Mouse_Y);
				if(this.VerticalSplit && Math.abs(move_X) >= Math.abs(move_Y))
				{
					this.dividerMove(move_X);
					event.preventDefault();
					event.processed = true;
					this.Current_Mouse_X = local_Mouse_X;
					this.Current_Mouse_Y = local_Mouse_Y;
					return false;
					
				}
				else if(!this.VerticalSplit && Math.abs(move_X) <= Math.abs(move_Y))
				{
					this.dividerMove(move_Y);
					event.preventDefault();
						event.processed = true;
				this.Current_Mouse_X = local_Mouse_X;
				this.Current_Mouse_Y = local_Mouse_Y;
					return false;
				}
			}
			this.Current_Mouse_X = local_Mouse_X;
			this.Current_Mouse_Y = local_Mouse_Y;
		}
	},
	touchEnd: function(event) {
		this.touchMoveEnabled = false;
	}
});