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

TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.set("DELTA", {
	
	currentDataReturn : "?dynamic_name?_DELTA || ' / ' || ?dynamic_name?_TIME || ' s'",
	
	dataHistoryRetrieval : "?dynamic_name? BIGINT PATH '@?dynamic_ID?', ?dynamic_name?_DELTA varchar(256) PATH '@?dynamic_ID?D'," +
			"?dynamic_name?_TIME varchar(256) PATH '@?dynamic_ID?T'",
	
	dataToArchive : "cast(coalesce(?column_SQL? - ?dynamic_name?,0) as BIGINT) as ?dynamic_ID?D, " +
			"?time_diff? as ?dynamic_ID?T, " +
			"?column_SQL? as ?dynamic_ID?",
	
	firstArchiveReturn : "CAST(null as double) as ?dynamic_name?, CAST(null as double) as ?dynamic_name?_DELTA, CAST(null as double) as ?dynamic_name?_TIME",
	
	inlineFunctionProcessor : function(tableObject, rowToRender, columnObject, accessPoint) {
		var pastValue = columnObject.getStoredValue(tableObject, rowToRender, columnObject, accessPoint);
		columnObject.setStoredValue(tableObject, rowToRender, columnObject, accessPoint, rowToRender[columnObject.columnIndex]);
		if(pastValue == null)
			return "0 / 0s";
		else 
			return rowToRender[columnObject.columnIndex] - pastValue + " / " + columnObject.timeSinceLast.toFixed(1) + " s";
	}
	
});


TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.set("DELTA_NORMALIZED", {
	
	currentDataReturn : "?dynamic_name?_DELTA_N",
	
	dataHistoryRetrieval : "?dynamic_name?_DELTA_N double PATH '@?dynamic_ID?DN', ?dynamic_name? double PATH '@?dynamic_ID?'",
	
	dataToArchive : "(?column_SQL? - ?dynamic_name?)/nullif(?time_diff?,0) as ?dynamic_ID?DN, " +
			"CAST(?column_SQL? as double) as ?dynamic_ID?",

	firstArchiveReturn : "CAST(null as double) as ?dynamic_name?, CAST(null as double) as ?dynamic_name?_DELTA_N",
	
	inlineFunctionProcessor : function(tableObject, rowToRender, columnObject, accessPoint) {
		var pastValue = columnObject.getStoredValue(tableObject, rowToRender, columnObject, accessPoint);
		columnObject.setStoredValue(tableObject, rowToRender, columnObject, accessPoint,rowToRender[columnObject.columnIndex]);
		if(pastValue == null)
			return "0";
		else
			return (rowToRender[columnObject.columnIndex] - pastValue)/(columnObject.timeSinceLast/columnObject.interval);
	}
	
});

TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.set("DELTA_NORMALIZED_RATIO", {
	

	inlineFunctionProcessor : function(tableObject, rowToRender, columnObject, accessPoint) {
		var pastValue = columnObject.getStoredValue(tableObject, rowToRender, columnObject, accessPoint);
		
		var newValues = {
			columnA:rowToRender[columnObject.columnIndex],
			columnB:rowToRender[columnObject.columnSecondaryIndex]
		}
		
		columnObject.setStoredValue(tableObject, rowToRender, columnObject, accessPoint,newValues);
		if(pastValue == null)
			return "0";
		else {
			var columnA = (rowToRender[columnObject.columnIndex] - pastValue.columnA)/(columnObject.timeSinceLast/columnObject.interval);
			var columnB = (rowToRender[columnObject.columnSecondaryIndex] - pastValue.columnB)/(columnObject.timeSinceLast/columnObject.interval);
			if(columnA+columnB == 0)
				return 50;
			return (columnA/(columnA+columnB))*100;
		}
	}
	
});

TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.set("AVR_DELTA_NORMALIZED", {
	
	currentDataReturn : "?dynamic_name?_AVR",
	
	dataHistoryRetrieval : "?dynamic_name?_COUNT BIGINT PATH '@?dynamic_ID?C', ?dynamic_name?_AVR double PATH '@?dynamic_ID?A', " +
			"?dynamic_name? double PATH '@?dynamic_ID?'",
	
	dataToArchive : "CASE WHEN ?dynamic_name? is null THEN 0 " +
			"ELSE (?dynamic_name?_COUNT +1) END as ?dynamic_ID?C, " +
			"CASE WHEN ?dynamic_name? is null THEN 0 " +
			"ELSE (?dynamic_name?_AVR*?dynamic_name?_COUNT + (?column_SQL? - ?dynamic_name?) / nullif(?time_diff?,0) / nullif(?dynamic_interval?,0))/nullif(?dynamic_name?_COUNT +1,0)  END as ?dynamic_ID?A, " +
			"?column_SQL? as ?dynamic_ID?",
	
	firstArchiveReturn : "CAST(0 as BIGINT) as ?dynamic_name?_COUNT, CAST(0 as double) as ?dynamic_name?_AVR, CAST(null as double) as ?dynamic_name?",
	
	inlineFunctionProcessor : function(tableObject, rowToRender, columnObject, accessPoint) {
		
		var pastValue = columnObject.getStoredValue(tableObject, rowToRender, columnObject, accessPoint);

		if(pastValue == null) 
			pastValue = {value:0,last_value:rowToRender[columnObject.columnIndex], points:0};
		else {
			pastValue.value = ((pastValue.value*pastValue.points)+(rowToRender[columnObject.columnIndex] - pastValue.last_value)/(columnObject.timeSinceLast/columnObject.interval))/(pastValue.points+1);
			pastValue.points++;
			pastValue.last_value = rowToRender[columnObject.columnIndex];
		}
		columnObject.setStoredValue(tableObject, rowToRender, columnObject, accessPoint, pastValue);
		return pastValue.value;
	}

});

TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.set("AVR", {
	
	currentDataReturn : "?dynamic_name?",
	
	dataHistoryRetrieval : "?dynamic_name?_COUNT BIGINT PATH '@?dynamic_ID?C', ?dynamic_name? double PATH '@?dynamic_ID?'",
	
	dataToArchive : "?dynamic_name?_COUNT +1 as ?dynamic_ID?C, " +
			"((?dynamic_name?*?dynamic_name?_COUNT + ?column_SQL?)/ nullif(?dynamic_name?_COUNT +1,0)) as ?dynamic_ID?",
	
	firstArchiveReturn : "0 as ?dynamic_name?_COUNT, 0 as ?dynamic_name?",
	
	inlineFunctionProcessor : function(tableObject, rowToRender, columnObject, accessPoint) {
		
		var pastValue = columnObject.getStoredValue(tableObject, rowToRender, columnObject, accessPoint);

		if(pastValue == null) 
			pastValue = {value:rowToRender[columnObject.columnIndex], points:0};
		else {
			pastValue.value = ((pastValue.value*pastValue.points)+rowToRender[columnObject.columnIndex])/(pastValue.points+1);
			pastValue.points++;
		}
		columnObject.setStoredValue(tableObject, rowToRender, columnObject, accessPoint, pastValue);
		return pastValue.value;
	}
});

TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.set("MAX", {
	
	currentDataReturn : "?dynamic_name?",
	
	dataHistoryRetrieval : "?dynamic_name? BIGINT PATH '@?dynamic_ID?'",
	
	dataToArchive : "CASE WHEN ?dynamic_name? is null THEN ?column_SQL? WHEN ?column_SQL? > ?dynamic_name? THEN ?column_SQL? " +
			"ELSE ?dynamic_name? END as ?dynamic_ID?",
	
	firstArchiveReturn : "cast(null as BIGINT) as ?dynamic_name?"
});

TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.set("MAX_DELTA_NORMALIZED", {
	
	currentDataReturn : "?dynamic_name?_MAX",
	
	dataHistoryRetrieval : "?dynamic_name?_MAX double PATH '@?dynamic_ID?M', ?dynamic_name? double PATH '@?dynamic_ID?'",
	
	dataToArchive : "CASE WHEN ?dynamic_name? is null THEN null " +
			"WHEN ?dynamic_name?_MAX is null " +
				"THEN CAST((?column_SQL? - ?dynamic_name?)/nullif(?time_diff?,0)/nullif(?dynamic_interval?,0) as BIGINT) " +
			"WHEN ((?column_SQL? - ?dynamic_name?)/(nullif(?time_diff?,0)/nullif(?dynamic_interval?,0))) > ?dynamic_name?_MAX " +
				"THEN CAST((?column_SQL? - ?dynamic_name?)/(nullif(?time_diff?,0)/nullif(?dynamic_interval?,0) as BIGINT)" +
			"ELSE ?dynamic_name?_MAX END as ?dynamic_ID?M, " +
			"?column_SQL? as ?dynamic_ID?",
	
	firstArchiveReturn : "cast(null as double) as ?dynamic_name?, cast(null as double) as ?dynamic_name?_MAX"
	
});

TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.set("MIN", {
	
	currentDataReturn : "?dynamic_name?",
	
	dataHistoryRetrieval : "?dynamic_name? double PATH '@?dynamic_ID?'",
	
	dataToArchive : "CASE WHEN ?dynamic_name? is null THEN ?column_SQL? WHEN ?column_SQL? < ?dynamic_name? THEN ?column_SQL? " +
			"ELSE ?dynamic_name? END as ?dynamic_ID?",
	
	firstArchiveReturn : "cast(null as double) as ?dynamic_name?"
});

TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.set("MIN_DELTA_NORMALIZED", {
	
	currentDataReturn : "?dynamic_name?_MIN",
	
	dataHistoryRetrieval : "?dynamic_name?_MIN double PATH '@?dynamic_ID?M', ?dynamic_name? double PATH '@?dynamic_ID?'",
	
	dataToArchive : "CASE WHEN ?dynamic_name? is null THEN null " +
			"WHEN ?dynamic_name?_MIN is null " +
				"THEN CAST(   (?column_SQL? - ?dynamic_name?)/(nullif(?time_diff?,0)/nullif(?dynamic_interval?,0) as BIGINT) " +
			"WHEN ((?column_SQL? - ?dynamic_name?)/nullif(?time_diff?,0)/nullif(?dynamic_interval?,0))  < ?dynamic_name?_MIN " +
				"THEN CAST((?column_SQL? - ?dynamic_name?) / nullif(?time_diff?,0) / nullif(?dynamic_interval?,0) as BIGINT)" +
			"ELSE ?dynamic_name?_MIN END as ?dynamic_ID?M, " +
			"?column_SQL? as ?dynamic_ID?",
	
	firstArchiveReturn : "cast(null as double) as ?dynamic_name?, cast(null as double) as ?dynamic_name?_MIN"
});

TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.set("FROM_POINT", {
	
	currentDataReturn : "CASE WHEN ?dynamic_name? is null THEN 0 ELSE (?column_SQL? - ?dynamic_name?) END",
	
	dataHistoryRetrieval : "?dynamic_name? double PATH '@?dynamic_ID?'",
	
	dataToArchive : "CASE WHEN ?dynamic_name? is null THEN ?column_SQL? ELSE ?dynamic_name? END as ?dynamic_ID?",
	
	firstArchiveReturn : "cast(null as double) as ?dynamic_name?"
});

TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.set("SUM", {
	
	currentDataReturn : "?dynamic_name?",
	
	dataHistoryRetrieval : "?dynamic_name? ?TYPE? PATH '@?dynamic_ID?'",
	
	dataToArchive : "?column_SQL? + ?dynamic_name? as ?dynamic_ID?",
	
	firstArchiveReturn : "0 as ?dynamic_name?"
});

TABLE_COLUMN_RENDERING_MODULES_DYNAMIC_COLUMN_TYPE_DEF.set("TIME_INTERVAL", {
	
	currentDataReturn : "cast(?dynamic_name? as double)",
	
	dataHistoryRetrieval : "?dynamic_name? double PATH '@?dynamic_ID?'",
	
	dataToArchive : "?time_diff?/nullif(?dynamic_interval?,0) as ?dynamic_ID?",
	
	firstArchiveReturn : "0 as ?dynamic_name?"
});
