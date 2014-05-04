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

function buttonSupport_registerButton(ButtonID) {
	var button = $(ButtonID);
	if(button == null)
	{
		alert("Unable to register button '" + ButtonID + "'. Element ID does not exist!");
		return false; 
	}
	else
	{
		var state = buttonSupport_extractButtonState(button.src);

		if(state == false) return false;
		
		if(state != "active" && state != "inActive")
		{
			alert("Button contains a invalid start state! '" + state + "'");
			return false;
		}
		
		button.observe('mouseout', buttonSupport_onMouseOut);

		button.observe('mouseover', buttonSupport_onMouseOver);

		button.observe('mousedown', buttonSupport_onMouseDown);

		button.observe('mouseup', buttonSupport_onMouseUp);

	}
	return true;
}

function buttonSupport_onMouseOut(event){
	var element = Event.element(event);
	var state = buttonSupport_extractButtonState(element.src);
	if(state != "inActive")
	{
		element.src = element.src.replace("_" + state + ".", (IS_TOUCH_SYSTEM ? "_active_touch." : "_active."));
	}
}

function buttonSupport_onMouseOver(event){
	var element = Event.element(event);
	var state = buttonSupport_extractButtonState(element.src);
	if(state != "inActive")
	{
		element.src = element.src.replace("_" + state + ".", (IS_TOUCH_SYSTEM ? "_mouseOver_touch." : "_mouseOver."));
	}
}

function buttonSupport_onMouseDown(event){
	var element = Event.element(event);
	var state = buttonSupport_extractButtonState(element.src);
	if(state != "inActive")
	{
		element.src = element.src.replace("_" + state + ".", (IS_TOUCH_SYSTEM ? "_mouseDown_touch." : "_mouseDown."));
	}
}

function buttonSupport_onMouseUp(event){
	var element = Event.element(event);
	var state = buttonSupport_extractButtonState(element.src);
	if(state != "inActive")
	{
		element.src = element.src.replace("_" + state + ".", (IS_TOUCH_SYSTEM ? "_active_touch." : "_active."));
	}
}

function buttonSupport_extractButtonState(imageName){
		var temp = new Array();
		var name = imageName.split('_');
		
		if(name.length <= 1)
		{
			alert("Button does not contain a valid image set name!");
			return false; 
		}
		temp = name[name.length-1].split('.');
		if(IS_TOUCH_SYSTEM)
		{
			if(temp[0] == "touch")
				temp = [name[name.length-2],""];
			
		}
		
		if(temp.length <= 1)
		{
			alert("Button does not contain a valid image name!");
			return false; 
		}
		return temp[0];
}