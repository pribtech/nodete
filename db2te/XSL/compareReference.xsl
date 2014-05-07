<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="text"/>
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
<xsl:param name="delimiter">@</xsl:param>
<xsl:template match="/">
-- generated script
	<xsl:apply-templates select="differences"/>
-- end generated script
</xsl:template>
 
<xsl:template match="differences">
	<xsl:apply-templates select="row"/>
</xsl:template>

<xsl:template match="row">
alter table "<xsl:value-of select="key[@name ='TABSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='TABNAME']/text()"/>" 
<xsl:choose>
	<xsl:when test="@action = 'insert'"><xsl:call-template name="create"/>
	</xsl:when>
	<xsl:when test="@action = 'delete'"><xsl:call-template name="drop"/>
	</xsl:when>
	<xsl:when test="@action = 'update'"><xsl:call-template name="drop"/>
		<xsl:call-template name="create"/>
  </xsl:when>
	<xsl:otherwise>
-- error <xsl:value-of select="@action"/> table <xsl:apply-templates select="key"/>
	</xsl:otherwise>
</xsl:choose>
</xsl:template>

<xsl:template match="key">
<xsl:value-of select="."/><xsl:if test="not(position()=last())"> , </xsl:if>
</xsl:template>

<xsl:template name="drop">
	drop constraint "<xsl:value-of select="key[@name ='CONSTNAME']/text()"/>" ;
</xsl:template>

<xsl:template name="create">
	add constraint "<xsl:value-of select="key[@name ='CONSTNAME']/text()"/>" foreign key
		(<xsl:value-of select="translate(normalize-space(data[@name ='FK_COLNAMES']/new/text()),' ',',')"/>)
		references "<xsl:value-of select="key[@name ='REFTABSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='REFTABNAME']/text()"/>"
		(<xsl:value-of select="translate(normalize-space(data[@name ='PK_COLNAMES']/new/text()),' ',',')"/>)
	ON DELETE <xsl:call-template name="constraint"><xsl:with-param name="value" select="data[@name ='DELETERULE']/new/text()"/></xsl:call-template>
	ON UPDATE  <xsl:call-template name="constraint"><xsl:with-param name="value" select="data[@name ='UPDATERULE']/new/text()"/></xsl:call-template>
	<xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="constraint">
<xsl:param name="value"/>
<xsl:choose>
	<xsl:when test="$value = 'A'">NO ACTION</xsl:when>
	<xsl:when test="$value = 'C'">CASCADE</xsl:when>
	<xsl:when test="$value = 'N'">SET NULL</xsl:when>
	<xsl:when test="$value = 'R'">RESTRICT</xsl:when>
	<xsl:otherwise><xsl:value-of select="$value"/> unknown ????</xsl:otherwise>
</xsl:choose>
</xsl:template>

</xsl:stylesheet>
