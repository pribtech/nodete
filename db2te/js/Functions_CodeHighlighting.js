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
var ADD_HIGHLIGHT_START = "<font class='sourceAdd'>";
var ADD_HIGHLIGHT_END = "</font>";
var CHANGE_HIGHLIGHT_START = "<font class='sourceChange'>";
var CHANGE_HIGHLIGHT_END = "</font>";
var REMOVE_HIGHLIGHT_START = "<font class='sourceRemove'>";
var REMOVE_HIGHLIGHT_END = "</font>";
var COPIED_HIGHLIGHT_START = "<font class='sourceCopiedFrom'>";
var COPIED_HIGHLIGHT_END = "</font>";
var FUNCTION_BLOCK_COMMENT_HIGHLIGHT_START = "<font class='sourceComment'>";
var FUNCTION_BLOCK_COMMENT_HIGHLIGHT_END = "</font>";
var FUNCTION_BLOCK_STRING_HIGHLIGHT_START = "<font class='sourceString'>";
var FUNCTION_BLOCK_STRING_HIGHLIGHT_END = "</font>";
var FUNCTION_BLOCK_OTHER_HIGHLIGHT_START = "<font class='sourceOtherBlock'>";
var FUNCTION_BLOCK_OTHER_HIGHLIGHT_END = "</font>";
var NUMBERS_HIGHLIGHT_START = "<font class='sourceNumbers'>";
var NUMBERS_HIGHLIGHT_END = "</font>";
var SYMBOLS_HIGHLIGHT_START = "<font class='sourceSymbols'>";
var SYMBOLS_HIGHLIGHT_END = "</font>";
var TYPES_HIGHLIGHT_START = "<font class='sourceTypes'>";
var TYPES_HIGHLIGHT_END = "</font>";
var KEYWORDS_HIGHLIGHT_START = "<font class='sourceKeywords'>";
var KEYWORDS_HIGHLIGHT_END = "</font>";
var FUNCTIONS_HIGHLIGHT_START = "<font class='sourceFunctions'>";
var FUNCTIONS_HIGHLIGHT_END = "</font>";
var CODE_LANGUAGE_BASE_FOLDER = "./definitions/languages/";

var languageFiles = [];

function codeHighlight(language, codeToHighlight, addedHighlightText, changedHighlightText, removedHighlightText, copiedHighlightText)
{
	var mainCodeTree = [];
	var treeStart = [];
	treeStart['type'] = 's';
	treeStart['data'] = codeToHighlight;
	mainCodeTree.push(treeStart);
	var LanguageBase = languageFiles[language] != null ? languageFiles[language] : languageFiles['DB2_SQL'];
	if(	LanguageBase == null)
		return null;
	if(addedHighlightText != null)
	{
		mainCodeTree = codeHightlight_Token_regex(mainCodeTree, codeHighlightProcessArray(addedHighlightText), 's', ADD_HIGHLIGHT_START, ADD_HIGHLIGHT_END);
	}
	if(changedHighlightText != null)
	{
		mainCodeTree = codeHightlight_Token_regex(mainCodeTree, codeHighlightProcessArray(changedHighlightText), 's', CHANGE_HIGHLIGHT_START, CHANGE_HIGHLIGHT_END);
	}
	if(removedHighlightText != null)
	{
		mainCodeTree = codeHightlight_Token_regex(mainCodeTree, codeHighlightProcessArray(removedHighlightText), 's', REMOVE_HIGHLIGHT_START, REMOVE_HIGHLIGHT_END);
	}
	if(copiedHighlightText != null)
	{
		mainCodeTree = codeHightlight_Token_regex(mainCodeTree, codeHighlightProcessArray(copiedHighlightText), 's', COPIED_HIGHLIGHT_START, COPIED_HIGHLIGHT_END);
	}
	if(LanguageBase['textBlock'] !== null)
	{
		var i = 0;
		var blockLength = LanguageBase['textBlock'].length;
		for(i = 0; i < blockLength; i++)
		{
			var blockObject = LanguageBase['textBlock'][i];
			if(blockObject['start'] != null && blockObject != null)
			{
				mainCodeTree = codeHightlight_Block(mainCodeTree, blockObject, 'b');
			}
		}
	}
	if(LanguageBase['number'] != null)
	{
		mainCodeTree = codeHightlight_Token_regex(mainCodeTree, LanguageBase['number'], 't', NUMBERS_HIGHLIGHT_START, NUMBERS_HIGHLIGHT_END);
	}
	if(LanguageBase['symbols'] != null)
	{
		mainCodeTree = codeHightlight_Token_regex(mainCodeTree, LanguageBase['symbols'], 'sym', SYMBOLS_HIGHLIGHT_START, SYMBOLS_HIGHLIGHT_END);
	}
	if(LanguageBase['functionBlock'] != null)
	{
		mainCodeTree = codeHightlight_Token_regex(mainCodeTree, codeHighlightProcessArray(LanguageBase['functionBlock']), 't', FUNCTIONS_HIGHLIGHT_START, FUNCTIONS_HIGHLIGHT_END);
	}
	if(LanguageBase['types'] != null)
	{
		mainCodeTree = codeHightlight_Token_regex(mainCodeTree, codeHighlightProcessArray(LanguageBase['types']), 't', TYPES_HIGHLIGHT_START, TYPES_HIGHLIGHT_END);
	}
	if(LanguageBase['keywords'] != null)
	{
		mainCodeTree = codeHightlight_Token_regex(mainCodeTree, codeHighlightProcessArray(LanguageBase['keywords']), 't', KEYWORDS_HIGHLIGHT_START, KEYWORDS_HIGHLIGHT_END);
	}
	if(LanguageBase['functions'] != null)
	{
		mainCodeTree = codeHightlight_Token_regex(mainCodeTree, codeHighlightProcessArray(LanguageBase['functions']), 't', FUNCTIONS_HIGHLIGHT_START, FUNCTIONS_HIGHLIGHT_END);
	}
	var ouputStr = "";
	mainCodeTree.each(function(item)
	{
		if(item['type'] == "hs" || item['type'] == "he")
			ouputStr += item['data'];
		else
			ouputStr += item['data'].escapeHTML();
	});
	return ouputStr;
}
function codeHighlightProcessArray(ItemsToMatch)
{
	ItemsToMatch = ItemsToMatch.sort(codeHighlightSortByLength);
	var ItemsToMatchSize = ItemsToMatch.length;
	var firstItem = true;
	var returnString = "";
	if(ItemsToMatchSize > 0)
	{
		for(i=0; i<ItemsToMatchSize; i++)
		{
			if(ItemsToMatch[i] == null)
				continue;
			if(ItemsToMatch[i].replace(/(^\s*)|(\s*$)/g, '').length == 0)
				continue;
			if(!firstItem) returnString += "|";
			firstItem = false;
			returnString += "(?:" + ItemsToMatch[i] + ")";
		}
		if(returnString.replace(/(^\s*)|(\s*$)/g, '').length == 0)
			return null;
		return new RegExp(returnString, "i");
	}
	return null;
}
function codeHighlightSortByLength(a,b)
{
	return b.length - a.length;
}
function codeHightlight_Token_regex(codeTree, localToken, localType, highlightStart, highlightEnd)
{
	var tempBlock = null;
	if(localToken == null)
		return codeTree;
	newCodeTree = [];
	while( codeTree.length > 0)
	{
		var item = codeTree.shift();
		if(item['type'] == 's')
		{
			var matches = [];
			//LOOK AT THIS
			
			item['data'].scan(localToken, function(match){ matches.push(match[0]); });
			if(matches.length > 0)
			{
				var tokens = stringSplit(item['data'], localToken);
				while( tokens.length > 0 && matches.length > 0)
				{
					var currentTokenString = tokens.shift();
					var match = matches.shift();
					var startChar = " ";
					if(currentTokenString.length > 0)
					{
						startChar = currentTokenString.substr(currentTokenString.length-1);
					}
					var endChar = " ";
					if(tokens.length > 0)
					{
						if(tokens[0].length > 0)
							endChar = tokens[0].substr(0, 1);
						else if(matches.length > 0)
							if(matches[0].length > 0)
								endChar = matches[0].substr(0, 1);
					}
					if("sym" == localType || (startChar.match( /[^\w\d]/ ) != null && endChar.match( /[^\w\d]/ ) != null))
					{
						tempBlock = [];
						tempBlock['data'] = currentTokenString;
						tempBlock['type'] = tempBlock['data'].replace(/^\s+|\s+$/g, '') == "" ? "w" : "s";
						newCodeTree.push(tempBlock);
						tempBlock = [];
						tempBlock['data'] = highlightStart;
						tempBlock['type'] ="hs";
						newCodeTree.push(tempBlock);
						tempBlock = [];
						tempBlock['data'] = match;
						tempBlock['type'] = localType;
						newCodeTree.push(tempBlock);
						tempBlock = [];
						tempBlock['data'] = highlightEnd;
						tempBlock['type'] ="he";
						newCodeTree.push(tempBlock);
					}
					else
					{
						if(tokens.length > 0)
						{
							tokens[0] = currentTokenString + match + tokens[0];
						}
						else
						{
							tempBlock = [];
							tempBlock['data'] = currentTokenString + match;
							tempBlock['type'] = tempBlock['data'].replace(/^\s+|\s+$/g, '') == "" ? "w" : "s";
							newCodeTree.push(tempBlock);
						}
					}
				}
				if(tokens.length > 0)
				{
					var endString = "";
					while(tokens.length > 0)
					{
						endString += tokens.shift();
					}
					tempBlock = [];
					tempBlock['data'] = endString;
					tempBlock['type'] = tempBlock['data'].replace(/^\s+|\s+$/g, '') == "" ? "w" : "s";
					newCodeTree.push(tempBlock);
				}
			}
			else
			{
				newCodeTree.push(item);
			}
		}
		else
		{
			newCodeTree.push(item);
		}
	}
	return newCodeTree;
}
function codeHightlight_Block(codeTree, blockObject, localType)
{
	if(blockObject['start'] == null)
	{
		return codeTree;
	}
	var startBlockString = blockObject['start'];
	var startBlockStringSize = startBlockString.length;
	var endBlockString = blockObject['end'] != null ? blockObject['end'] : "\n";
	var endBlockStringSize = endBlockString.length;
	var escapeStrings = blockObject['escape'];
	var highlightStart = FUNCTION_BLOCK_OTHER_HIGHLIGHT_START;
	var highlightEnd = FUNCTION_BLOCK_OTHER_HIGHLIGHT_END;
	if(blockObject['blockClass'] != null)
	{
		var blockClass = blockObject['blockClass'].toUpperCase();
		if(blockClass == "STRING")
		{
				highlightStart = FUNCTION_BLOCK_STRING_HIGHLIGHT_START;
				highlightEnd = FUNCTION_BLOCK_STRING_HIGHLIGHT_END;
		}
		else if(blockClass == "COMMENT")
		{
				highlightStart = FUNCTION_BLOCK_COMMENT_HIGHLIGHT_START;
				highlightEnd = FUNCTION_BLOCK_COMMENT_HIGHLIGHT_END;
		}
	}
	var newCodeTree = [];
	var checkforescape = true;
	var localToken = startBlockString;
	var localTokenSize = startBlockStringSize;
	var lookingForStart = true;
	var tempBlock = null;
	while(codeTree.length > 0)
	{
		var item = codeTree.shift();
		if(item['type'] == 's')
		{
			var startPosTemp = 0;
			var startPos = 0;
			var pos = item['data'].indexOf(localToken, startPosTemp);
			var itemLength = item['data'].length;
			while(pos !== -1)
			{
				startPosTemp = pos + localTokenSize;
				if(checkforescape)
				{
					if(pos !=startPos)
					{
						tempBlock = [];
						tempBlock['data'] = item['data'].substr(startPos, pos - startPos);
						if(lookingForStart)
							tempBlock['type'] = tempBlock['data'].replace(/^\s+|\s+$/g, '') == "" ? "w" : "s";
						else
							tempBlock['type'] = localType;
						newCodeTree.push(tempBlock);
					}
					if(lookingForStart)
					{
						tempBlock = [];
						tempBlock['data'] = highlightStart;
						tempBlock['type'] ="hs";
						newCodeTree.push(tempBlock);
						tempBlock = [];
						tempBlock['data'] = item['data'].substr(pos, localTokenSize);
						tempBlock['type'] = localType;
						newCodeTree.push(tempBlock);
						localToken = endBlockString;
						localTokenSize = endBlockStringSize;
						lookingForStart = false;
					}
					else
					{
						tempBlock = [];
						tempBlock['data'] = item['data'].substr(pos, localTokenSize);
						tempBlock['type'] = localType;
						newCodeTree.push(tempBlock);
						tempBlock = [];
						tempBlock['data'] = highlightEnd;
						tempBlock['type'] ="he";
						newCodeTree.push(tempBlock);
						localToken = startBlockString;
						localTokenSize = startBlockStringSize;
						lookingForStart = true;
					}
					startPos = startPosTemp;
				}
				pos = item['data'].indexOf(localToken, startPosTemp);
			}
			tempBlock = [];
			tempBlock['data'] = item['data'].substr(startPos);
			if(lookingForStart)
				tempBlock['type'] = tempBlock['data'].replace(/^\s+|\s+$/g, '') == "" ? "w" : "s";
			else
				tempBlock['type'] = localType;
			newCodeTree.push(tempBlock);
		}
		else if(item['type'] == 'hs')
		{
			if(!lookingForStart)
			{
				tempBlock = [];
				tempBlock['data'] = highlightEnd;
				tempBlock['type'] ="he";
				newCodeTree.push(tempBlock);
				newCodeTree.push(item);
				tempBlock = [];
				tempBlock['data'] = highlightStart;
				tempBlock['type'] ="hs";
				newCodeTree.push(tempBlock);
			}
			else
			{
				newCodeTree.push(item);
			}
		}
		else if(item['type'] == 'he')
		{
			if(!lookingForStart)
			{
				tempBlock = [];
				tempBlock['data'] = highlightEnd;
				tempBlock['type'] ="he";
				newCodeTree.push(tempBlock);
				newCodeTree.push(item);
				tempBlock = [];
				tempBlock['data'] = highlightStart;
				tempBlock['type'] ="hs";
				newCodeTree.push(tempBlock);
			}
			else
			{
				newCodeTree.push(item);
			}
		}
		else
		{
			newCodeTree.push(item);
		}
	}
	if(!lookingForStart)
	{
		tempBlock = [];
		tempBlock['data'] = highlightEnd;
		tempBlock['type'] ="he";
		newCodeTree.push(tempBlock);
	}
	return newCodeTree;
}