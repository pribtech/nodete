<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="2.0" 
xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
xmlns:fo="http://www.w3.org/1999/XSL/Format"
xmlns:xs="http://www.w3.org/2001/XMLSchema"
xmlns:fn="http://www.w3.org/2005/xpath-functions"
xmlns:xdt="http://www.w3.org/2005/xpath-datatypes"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
>
<xsl:output method="text"/>

 <!--
  Author: Peter Prib
  
  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2012 All rights reserved.

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
<xsl:param name="outputType">default</xsl:param>
<xsl:param name="delimiter">@</xsl:param>
<xsl:param name="tab"><xsl:text>&#9;</xsl:text></xsl:param>
<xsl:param name="newLine"><xsl:text>&#xa;</xsl:text></xsl:param>

<xsl:template match="/">
-- generated script output: <xsl:value-of select="$outputType"/>
	<xsl:apply-templates select="table"/>
</xsl:template>

<xsl:template match="table">
SELECT
<xsl:apply-templates select="columns"/>
FROM "<xsl:value-of select="@TABSCHEMA"/>"."<xsl:value-of select="@TABNAME"/>"
</xsl:template>

<xsl:template match="columns">
	<xsl:choose>
		<xsl:when test="$outputType = 'rowset'">
			XMLGROUP(
				<xsl:apply-templates select="column"/>
			)
		</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates select="column"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="column">
<xsl:text>   </xsl:text>
	<xsl:choose>
		<xsl:when test="position()>1">,</xsl:when>
		<xsl:otherwise><xsl:text> </xsl:text></xsl:otherwise>	
	</xsl:choose>"<xsl:value-of select="@COLNAME"/>" 
</xsl:template>

</xsl:stylesheet>