<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:xs="http://www.w3.org/2001/XMLSchema">

<!-- ======================================================================= -->
<!-- Stylesheet : DB2SchemaAnnotation.xsl                                    -->
<!-- Description: This style sheet will read any xml schema file             -->
<!--              and extract all <xs:documentation> regarding               -->
<!--              elements and attributes contained in the schema            -->
<!--              file and create a table view within a browser.             -->
<!--                                                                         -->
<!-- To use this stylesheet add the following line to your XSD               -->
<!-- schema file after the version line:                                     -->
<!--                                                                         -->
<!-- <?xml-stylesheet type="text/xsl" href="DB2SchemaAnnotation.xsl"?>       -->
<!--                                                                         -->
<!-- Open your .xsd file in any browser. Make sure the .xsl file is          -->
<!-- in the same directory as your .xsd file.                                -->
<!--                                                                         -->
<!-- ======================================================================= -->

<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

<!-- ======================================================================= -->
<!-- Template:    Main                                                       -->
<!-- Description: Main template to process the XML schema document           -->
<!-- ======================================================================= -->
<xsl:template match="/">
  <html>
     <head>
       <STYLE TYPE="text/css">
        .indent
        {
          padding-left: 30pt;
          padding-right: 0pt;
        }
       </STYLE>
       <title><xsl:value-of select="//xs:annotation/xs:documentation/."/></title>
     </head>

     <body>

       <h1><center><xsl:value-of select="//xs:annotation/xs:documentation/." /></center></h1>

       <xsl:for-each select="/*/*">
         <xsl:apply-templates select="." mode="root"/>
       </xsl:for-each>

     </body>
 </html>
</xsl:template>

<!-- ======================================================================= -->
<!-- Template:    Match all root nodes only                                  -->
<!-- Description: Main template to process the XML schema document           -->
<!-- ======================================================================= -->
<xsl:template match="*" mode="root">

  <xsl:if test="boolean(@name)">
    <xsl:variable name="link"><xsl:value-of select="@name"/> </xsl:variable>
    <h2><u><a name="{$link}"><xsl:value-of select="@name"/></a></u></h2>
    <p><xsl:value-of select="xs:annotation/xs:documentation/." /></p>

    <xsl:apply-templates select="." mode="attributes" />
    <xsl:choose> 
      <xsl:when test="boolean(descendant-or-self::xs:sequence)">
         <xsl:apply-templates select="." mode="sequence" />
      </xsl:when>
      <xsl:otherwise>
         <xsl:apply-templates select="." mode="elements" />
      </xsl:otherwise>
    </xsl:choose>
    <xsl:apply-templates select="." mode="simplecontent" />

  </xsl:if>
</xsl:template>

<!-- ======================================================================= -->
<!-- Template:    Match all nodes containing xs:attribute elements           -->
<!-- ======================================================================= -->
<xsl:template match="*" mode="attributes" >
  <xsl:if test="boolean(descendant-or-self::xs:attribute)">
    <p class="indent">
      <h3>Attributes</h3>
      <table border="1" cellpadding="3">
        <tr bgcolor="silver">
          <th align="left" valign="top">Name</th>
          <th align="left" valign="top">Data Type</th>
          <th align="left" valign="top">Use</th>
          <th align="left" valign="top">Description</th>
        </tr>
  
        <xsl:for-each select="descendant-or-self::xs:attribute">
          <tr>
            <td align="left" valign="top"><xsl:value-of select="@name"/></td>
            <xsl:apply-templates select="." mode="type" />
            <td align="left" valign="top"><xsl:value-of select="@use"/></td>
            <td align="left" valign="top"><xsl:value-of select="xs:annotation/xs:documentation/."/></td>
          </tr>
        </xsl:for-each>
      </table>
   </p>
  </xsl:if>
</xsl:template>

<!-- ======================================================================= -->
<!-- Template:    Match all nodes containing xs:sequence elements            -->
<!-- ======================================================================= -->
<xsl:template match="*" mode="sequence" >
  <xsl:if test="boolean(descendant-or-self::xs:element)">
    <p class="indent">
       <h3>Elements</h3>
    </p>
    <xsl:for-each select="descendant-or-self::xs:sequence" >
      <p class="indent"><xsl:value-of select="xs:annotation/xs:documentation/."/></p>
      <xsl:apply-templates select="." mode="elements" />
    </xsl:for-each>
  </xsl:if>
</xsl:template>

<!-- ======================================================================= -->
<!-- Template:    Match all nodes containing xs:element elements            -->
<!-- ======================================================================= -->
<xsl:template match="*" mode="elements" >
  <xsl:if test="boolean(descendant-or-self::xs:element)">
    <p class="indent">
      <table border="1" cellpadding="3">
        <tr bgcolor="silver">
          <th align="left" valign="top">Name</th>
          <th align="left" valign="top">Data Type</th>
          <th align="left" valign="top">Min Occur</th>
          <th align="left" valign="top">Max Occur</th>
          <th align="left" valign="top">Description</th>
        </tr>
        <xsl:for-each select="descendant-or-self::xs:element">
          <tr>
            <td align="left" valign="top"><xsl:value-of select="@name"/></td>
            <xsl:apply-templates select="." mode="type" />
            <td align="left" valign="top"><xsl:value-of select="@minOccurs"/></td>
            <td align="left" valign="top"><xsl:value-of select="@maxOccurs"/></td>
            <td align="left" valign="top"><xsl:value-of select="xs:annotation/xs:documentation/."/></td>
          </tr>
        </xsl:for-each>
      </table>
    </p>
  </xsl:if>
</xsl:template>

<!-- ======================================================================= -->
<!-- Template:    Match all nodes containing xs:simpleContent elements       -->
<!-- ======================================================================= -->
<xsl:template match="*" mode="simplecontent" >
  <xsl:if test="boolean(descendant-or-self::xs:simpleContent)">
    <xsl:variable name="ref"> <xsl:value-of select="xs:simpleContent/xs:extension/@base"/> </xsl:variable>
    <p class="indent">
      <xsl:choose>
         <xsl:when test="starts-with(xs:simpleContent/xs:extension/@base,'xs:')">
         Base is an extension of <u><b><xsl:value-of select="xs:simpleContent/xs:extension/@base"/></b></u>
         </xsl:when>
         <xsl:otherwise>
         Base is an extension of <a href="#{$ref}"><xsl:value-of select="xs:simpleContent/xs:extension/@base"/></a>
         </xsl:otherwise>
      </xsl:choose>
   </p>
   <p class="indent">
     <xsl:value-of select="xs:simpleContent/xs:extension/xs:annotation/xs:documentation/." />
   </p>
  </xsl:if>
</xsl:template>

<!-- ======================================================================= -->
<!-- Template: Print element type                                            -->
<!-- ======================================================================= -->
<xsl:template match="*" mode="type">
 <xsl:choose>
   <xsl:when test="boolean(@type)">
   <xsl:variable name="ref"> <xsl:value-of select="@type"/> </xsl:variable>
   <xsl:choose>
      <xsl:when test="starts-with(@type,'xs:')">
         <td align="left" valign="top">
             <xsl:value-of select="@type"/>
         </td>
      </xsl:when>
      <xsl:otherwise>
         <td align="left" valign="top">
             <a href="#{$ref}"><xsl:value-of select="@type"/></a>
         </td>
      </xsl:otherwise>
   </xsl:choose>
   </xsl:when>
   <xsl:when test="boolean(xs:simpleType/xs:restriction/@base)">
     <td align="left" valign="top">
        <xsl:value-of select="xs:simpleType/xs:restriction/@base"/>
     </td>
   </xsl:when>
   <xsl:when test="boolean(xs:simpleContent/xs:extension/@base)">
      <td align="left" valign="top">
        <xsl:value-of select="xs:simpleType/xs:extension/@base"/>
      </td>
   </xsl:when>
   <xsl:otherwise>
      <td align="left" valign="top">.</td>
   </xsl:otherwise>
 </xsl:choose>
</xsl:template>

</xsl:stylesheet>
