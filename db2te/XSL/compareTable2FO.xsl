<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"  xmlns:fo="http://www.w3.org/1999/XSL/Format">
<!--
  Author: Peter Prib
  
  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2013 All rights reserved.

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
<xsl:template match="/">

	<fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format">
		<fo:layout-master-set>
			<fo:simple-page-master master-name="first"
                           page-height="29.7cm"
                           page-width="21cm"
                           margin-top="1cm"
                           margin-bottom="2cm"
                           margin-left="2.5cm"
                           margin-right="2.5cm">
				<fo:region-body margin-top="3cm"/>
				<fo:region-before extent="3cm"/>
				<fo:region-after extent="1.5cm"/>
			</fo:simple-page-master>
		</fo:layout-master-set>
		<fo:page-sequence master-reference="first">
			<fo:flow flow-name="xsl-region-body">
      			<!-- this defines a title level 1-->
		    	<fo:block font-size="18pt"
            			font-family="sans-serif"
            			line-height="24pt"
            			space-after.optimum="15pt"
            			background-color="blue"
            			color="white"
            			text-align="center"
            			padding-top="3pt">
        DB2 TE
				</fo:block>
 			    <!-- this defines a title level 2-->
				<fo:block font-size="16pt"
            		font-family="sans-serif"
            		space-after.optimum="15pt"
            		text-align="center">
        Table
				</fo:block>
				<!-- normal text -->
				<fo:block text-align="start">
		Extraction from db2te
				</fo:block>

				<xsl:apply-templates select="differences"/>

	 		</fo:flow>
		</fo:page-sequence>
	</fo:root>
</xsl:template>

<xsl:template match="differences">
	<fo:table table-layout="fixed" width="100%" border-collapse="separate">
		<xsl:for-each select="columns/column">
			<fo:table-column column-width="50mm"/>
		</xsl:for-each>
		<xsl:variable name="header" select="header"/> 
		<xsl:call-template name="header"/>
		<fo:table-body>
			<xsl:apply-templates select="row"/>
		</fo:table-body>
	</fo:table>
</xsl:template>

<xsl:template  name="header">
	<fo:table-header>
		<fo:table-row>
			<xsl:for-each select="columns/column">
				<fo:table-cell>
					<fo:block text-align="center"  font-weight="bold">
						<xsl:value-of select="@name"/>
					</fo:block>
				</fo:table-cell>
			</xsl:for-each>
		</fo:table-row>
	</fo:table-header>
</xsl:template>

<xsl:template match="row">
	<xsl:variable name="row" select="."/> 
	<xsl:variable name="action" select="@action"/>
	<fo:table-row>
	  	<xsl:for-each select="../columns/column">
	  		<fo:table-cell>
        		<fo:block text-align="center">
					<xsl:variable name="name" select="@name"/> 
					<xsl:choose>
						<xsl:when test="@match='y'"><xsl:value-of select="$row/key[@name=$name]/text()"/></xsl:when>
						<xsl:otherwise>
							<xsl:variable name="data" select="$row/data[@name=$name]"/> 
							<xsl:choose>
								<xsl:when test="count($data)=0"></xsl:when>
 								<xsl:otherwise><xsl:value-of select="$data/text()"/></xsl:otherwise>
							</xsl:choose>
						</xsl:otherwise>
					</xsl:choose>
		        </fo:block>
			</fo:table-cell>
		</xsl:for-each>
	</fo:table-row>
</xsl:template>

</xsl:stylesheet>
