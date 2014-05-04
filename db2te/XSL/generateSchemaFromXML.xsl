<?xml version="1.0" encoding="UTF-8"?>
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
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

&lt;xsd:schema  xmlns:xsd="http://www.w3.org/2001/XMLSchema"&gt;
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

&lt;xsd:annotation&gt;
    &lt;xsd:documentation&gt;
    &lt;/xsd:documentation&gt;
&lt;/xsd:annotation&gt;
	<xsl:template match="/">
		<xsl:apply-templates select="node()"/>
	</xsl:template>
&lt;/xsd:schema&gt;

  <xsl:template match="node()">
	&lt;xsd:element name="<xsl:value-of select="local-name()"/>" type="xs:string" minOccurs="1" maxOccurs="1" &gt;
		&lt;xsd:complexType&gt;
       		<xsl:apply-templates select="@*"/>
            &lt;xsd:sequence&gt;
		        <xsl:apply-templates select="node()"/>
            &lt;/xsd:sequence&gt;
		&lt;/xsd:complexType&gt;
	&lt;/xsd:element&gt;
  </xsl:template>

  <xsl:template match="@*">
	&lt;xsd:attribute name="<xsl:value-of select="local-name()"/>" type="xsd:string" use="required" default="" /&gt;
  </xsl:template>

</xsl:stylesheet>
