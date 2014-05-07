<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="text"/>

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
	<xsl:apply-templates select="*"/>
</xsl:template>

<xsl:template match="*">
	&lt;<xsl:value-of select="name()"/> 
	<xsl:for-each select="@*">
		&#160;<xsl:value-of select="local-name()"/>="<xsl:value-of select="."/>"
	</xsl:for-each>
	&gt;
	&#10;
	<xsl:value-of select="."/>
	<xsl:apply-templates select="node()"/>
	&lt;/<xsl:value-of select="name()"/>&gt;
	&#10;
</xsl:template>

</xsl:stylesheet>
	