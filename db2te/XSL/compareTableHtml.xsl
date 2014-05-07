<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<!--
  Author: Peter Prib
  
  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2010 All rights reserved.

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
	<xsl:apply-templates select="differences"/>
</xsl:template>
<xsl:template match="differences">
	<table border='1' cellspacing='1px' cellpadding='1px' align='center' valign='center'>
	<tbody>
	<xsl:variable name="header" select="header"/> 
	<xsl:call-template name="header"/>
	<xsl:apply-templates select="row"/>
	</tbody>
	</table>
</xsl:template>
<xsl:template  name="header">
	<tr><th>Action</th><xsl:for-each select="columns/column"><td><xsl:value-of select="@name"/><xsl:if test="@match='y'">(M)</xsl:if></td></xsl:for-each></tr>
</xsl:template>
<xsl:template match="row">
	<xsl:variable name="row" select="."/> 
	<xsl:variable name="action" select="@action"/> 
  	<tr><td><xsl:value-of select="$action"/></td><xsl:for-each select="../columns/column"><td>
		<xsl:variable name="name" select="@name"/> 
		<xsl:choose>
			<xsl:when test="@match='y'"><xsl:value-of select="$row/key[@name=$name]/text()"/></xsl:when>
			<xsl:otherwise>
				<xsl:variable name="data" select="$row/data[@name=$name]"/> 
				<xsl:choose>
					<xsl:when test="count($data)=0"></xsl:when>
 	 				<xsl:when test="$action = 'update'"><table  border='1' cellspacing='1px' cellpadding='1px' ><tr><td>old</td><td><xsl:value-of select="$data/text()"/></td></tr><tr><td>new</td><td><xsl:apply-templates select="$data/new/text()"/></td></tr></table></xsl:when>
 	 				<xsl:when test="$action = 'insert'"><xsl:apply-templates select="$data/new/text()"/></xsl:when>
 					<xsl:otherwise><xsl:value-of select="$data/text()"/></xsl:otherwise>
				</xsl:choose>
			</xsl:otherwise>
		</xsl:choose>
		
		</td>
	</xsl:for-each></tr>
</xsl:template>
<xsl:template match="new">
	<xsl:value-of select="text()"/>
</xsl:template>
</xsl:stylesheet>
