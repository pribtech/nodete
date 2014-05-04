<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="text"/>
<!--
  Author: Peter Prib
  
  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2011 All rights reserved.

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
<xsl:param name="newLine"><xsl:text>&#xa;</xsl:text></xsl:param>
<xsl:param name="options">highLevelWaterMark</xsl:param>
<xsl:param name="database">&lt;database&gt;</xsl:param>
<xsl:template match="/">
-- generated SQL Text: <xsl:value-of select="count(differences/row)"/> tables  
	<xsl:apply-templates select="differences"/>
-- end generated script
</xsl:template>
 
<xsl:template match="differences">
	<xsl:apply-templates select="row"/>
</xsl:template>

<xsl:template match="row">
db2dart <xsl:value-of select="$database"/> /tsi <xsl:value-of select="data[@name='TBSP_ID']/text()"/> /lhwm /np 0 
</xsl:template>

</xsl:stylesheet>
