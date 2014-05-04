<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="xml"/>

 <!--
  Author: Peter Prib
  
  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2009 All rights reserved.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  
-->

<xsl:template match="operator">

 		<operator
 		__ID="{@ID}" 
 		Type="{@TYPE}"
 		TOTAL_COST="{@TOTAL_COST}"
 		IO_Cost="{@IO_COST}"
 		CPU_Cost="{@CPU_COST}"
 		FIRST_ROW_COST="{@FIRST_ROW_COST}"
 		RE_TOTAL_COST="{@RE_TOTAL_COST}"
 		RE_IO_COST="{@RE_IO_COST}"
 		RE_CPU_COST="{@RE_CPU_COST}"
 		Comm_Cost="{@COMM_COST}"
 		FIRST_COMM_COST="{@FIRST_COMM_COST}"
 		Buffers="{@BUFFERS}"
 		REMOTE_TOTAL_COST="{@REMOTE_TOTAL_COST}"
 		REMOTE_COMM_COST="{@REMOTE_COMM_COST}"
 		>
 		<xsl:apply-templates select="stream"/>
 		</operator>
 </xsl:template>
 
 <xsl:template match="stream">
	<xsl:variable name="COLUMN_NAMES" select="translate(@COLUMN_NAMES,'+',' ')"/>
 	<stream
 	  		STREAM_COUNT="{@STREAM_COUNT}"
   			COLUMN_COUNT="{@COLUMN_COUNT}"
   			COLUMN_NAMES="{$COLUMN_NAMES}"
   			PMID="{@PMID}"
 		>
 		<xsl:apply-templates select="operator"/>
 		<xsl:apply-templates select="object"/>
 		</stream>
 </xsl:template>
 
 <xsl:template match="object">
 		<xsl:choose>
    	    	<xsl:when test="@TYPE = 'TA'">
     	     	<table
 					Schema="{@SCHEMA}"
 					Name="{@NAME}"
 					CREATE_TIME="{@CREATE_TIME}"
 					STATISTICS_TIME="{@STATISTICS_TIME}"
 					COLUMN_COUNT="{@title}"
 					ROW_COUNT="{@ROW_COUNT}"
 					WIDTH="{@WIDTH}"
 					PAGES="{@PAGES}"
 					DISTINCT="{@DISTINCT}"
 					TABLESPACE_NAME="{@TABLESPACE_NAME}"
 					OVERHEAD="{@OVERHEAD}"
 					TRANSFER_RATE="{@TRANSFER_RATE}"
 					PREFETCHSIZE="{@PREFETCHSIZE}"
 					EXTENTSIZE="{@EXTENTSIZE}"
 					OVERFLOW="{@OVERFLOW}"
 					SEQUENTIAL_PAGES="{@SEQUENTIAL_PAGES}"
 					STATS_SRC="{@STATS_SRC}"
 					NUM_DATA_PARTS="{@NUM_DATA_PARTS}"
     	     	/>
        		</xsl:when>
        		<xsl:when test="@TYPE = 'IX'">
 				<index
 			Schema="{@SCHEMA}"
 			Name="{@NAME}"
 			CREATE_TIME="{@CREATE_TIME}"
 			STATISTICS_TIME="{@STATISTICS_TIME}"
 			COLUMN_COUNT="{@title}"
 			ROW_COUNT="{@ROW_COUNT}"
 			PAGES="{@PAGES}"
 			DISTINCT="{@DISTINCT}"
 			TABLESPACE_NAME="{@TABLESPACE_NAME}"
 			OVERHEAD="{@OVERHEAD}"
 			TRANSFER_RATE="{@TRANSFER_RATE}"
 			PREFETCHSIZE="{@PREFETCHSIZE}"
 			EXTENTSIZE="{@EXTENTSIZE}"
 			CLUSTER="{@CLUSTER}"
 			NLEAF="{@NLEAF}"
 			NLEVELS="{@NLEVELS}"
 			FULLKEYCARD="{@FULLKEYCARD}"
 			OVERFLOW="{@OVERFLOW}"
 			FIRSTKEYCARD="{@FIRSTKEYCARD}"
 			FIRST2KEYCARD="{@FIRST2KEYCARD}"
 			FIRST3KEYCARD="{@FIRST3KEYCARD}"
 			FIRST4KEYCARD="{@FIRST4KEYCARD}"
 			SEQUENTIAL_PAGES="{@SEQUENTIAL_PAGES}"
 			DENSITY="{@DENSITY}"
 			STATS_SRC="{@STATS_SRC}"
 			AVERAGE_SEQUENCE_GAP="{@AVERAGE_SEQUENCE_GAP}"
 			AVERAGE_SEQUENCE_FETCH_GAP="{@AVERAGE_SEQUENCE_FETCH_GAP}"
 			AVERAGE_SEQUENCE_PAGES="{@AVERAGE_SEQUENCE_PAGES}"
 			AVERAGE_SEQUENCE_FETCH_PAGES="{@AVERAGE_SEQUENCE_FETCH_PAGES}"
 			AVERAGE_RANDOM_PAGES="{@AVERAGE_RANDOM_PAGES}"
 			AVERAGE_RANDOM_FETCH_PAGES="{@AVERAGE_RANDOM_FETCH_PAGES}"
 			NUMRIDS="{@NUMRIDS}"
 			NUMRIDS_DELETED="{@NUMRIDS_DELETED}"
 			NUM_EMPTY_LEAFS="{@NUM_EMPTY_LEAFS}"
 			ACTIVE_BLOCKS="{@ACTIVE_BLOCKS}"
 			NUM_DATA_PARTS="{@NUM_DATA_PARTS}"
 				/>
        	 	</xsl:when>
        	 	<xsl:otherwise>
 	<object 
 		TYPE="{@TYPE}"
 			Schema="{@SCHEMA}"
 			Name="{@NAME}"
 			CREATE_TIME="{@CREATE_TIME}"
 			STATISTICS_TIME="{@STATISTICS_TIME}"
 			COLUMN_COUNT="{@title}"
 			ROW_COUNT="{@ROW_COUNT}"
 			WIDTH="{@WIDTH}"
 			PAGES="{@PAGES}"
 			DISTINCT="{@DISTINCT}"
 			TABLESPACE_NAME="{@TABLESPACE_NAME}"
 			OVERHEAD="{@OVERHEAD}"
 			TRANSFER_RATE="{@TRANSFER_RATE}"
 			PREFETCHSIZE="{@PREFETCHSIZE}"
 			EXTENTSIZE="{@EXTENTSIZE}"
 			CLUSTER="{@CLUSTER}"
 			NLEAF="{@NLEAF}"
 			NLEVELS="{@NLEVELS}"
 			FULLKEYCARD="{@FULLKEYCARD}"
 			OVERFLOW="{@OVERFLOW}"
 			FIRSTKEYCARD="{@FIRSTKEYCARD}"
 			FIRST2KEYCARD="{@FIRST2KEYCARD}"
 			FIRST3KEYCARD="{@FIRST3KEYCARD}"
 			FIRST4KEYCARD="{@FIRST4KEYCARD}"
 			SEQUENTIAL_PAGES="{@SEQUENTIAL_PAGES}"
 			DENSITY="{@DENSITY}"
 			STATS_SRC="{@STATS_SRC}"
 			AVERAGE_SEQUENCE_GAP="{@AVERAGE_SEQUENCE_GAP}"
 			AVERAGE_SEQUENCE_FETCH_GAP="{@AVERAGE_SEQUENCE_FETCH_GAP}"
 			AVERAGE_SEQUENCE_PAGES="{@AVERAGE_SEQUENCE_PAGES}"
 			AVERAGE_SEQUENCE_FETCH_PAGES="{@AVERAGE_SEQUENCE_FETCH_PAGES}"
 			AVERAGE_RANDOM_PAGES="{@AVERAGE_RANDOM_PAGES}"
 			AVERAGE_RANDOM_FETCH_PAGES="{@AVERAGE_RANDOM_FETCH_PAGES}"
 			NUMRIDS="{@NUMRIDS}"
 			NUMRIDS_DELETED="{@NUMRIDS_DELETED}"
 			NUM_EMPTY_LEAFS="{@NUM_EMPTY_LEAFS}"
 			ACTIVE_BLOCKS="{@ACTIVE_BLOCKS}"
 			NUM_DATA_PARTS="{@NUM_DATA_PARTS}"
 		/>
        		</xsl:otherwise>
 		</xsl:choose>
 </xsl:template>
 </xsl:stylesheet>
