<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="2.0" 
xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
xmlns:fo="http://www.w3.org/1999/XSL/Format"
xmlns:xs="http://www.w3.org/2001/XMLSchema"
xmlns:fn="http://www.w3.org/2005/xpath-functions"
xmlns:xdt="http://www.w3.org/2005/xpath-datatypes"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
>

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

<xsl:template match="/">
	<xsl:apply-templates select="select"/>
</xsl:template>

<xsl:template match="select">
	select
	<xsl:choose>
		<xsl:when test='columns'>
			<br/>
			<xsl:apply-templates select="columns/column"/>
		</xsl:when>
		<xsl:otherwise>
			<xsl:for-each select="//table/@id">
				<xsl:value-of select="."/>.*
				<xsl:if test="not(position()=last())">,</xsl:if>
			</xsl:for-each>
		</xsl:otherwise>
	</xsl:choose>
	<br/>
	from  <xsl:apply-templates select="table"/>
	<xsl:apply-templates select="table/join"/>
</xsl:template>

<xsl:template match="columns/column">
	<xsl:value-of select="@tableId"/>."<xsl:value-of select="@name"/>" <xsl:value-of select="@as"/>
	<br/>
	<xsl:if test="not(position()=last())">,</xsl:if>
</xsl:template>

<xsl:template match="table">
	"<xsl:value-of select="@schema"/>"."<xsl:value-of select="@name"/>" as <xsl:value-of select="@id"/> 
	<br/>
</xsl:template>

<xsl:template match="join">
	<xsl:value-of select="@type"/> join
	<xsl:apply-templates select="table"/>
	<xsl:apply-templates select="on"/>
	<xsl:apply-templates select="table/join"/>
</xsl:template>

<xsl:template match="on">
	on
	<xsl:apply-templates select="matchPair"/>
</xsl:template>

<xsl:template match="matchPair">
	<xsl:value-of select="../../../@id"/>.<xsl:value-of select="@parent"/>
	 =
	<xsl:value-of select="../../table/@id"/>.<xsl:value-of select="@child"/>
	<br/>
	<xsl:if test="not(position()=last())"> and </xsl:if>
</xsl:template>

</xsl:stylesheet>							
