<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:param name="connection"></xsl:param>
<xsl:param name="database"></xsl:param>
<xsl:param name="databaseDBMS"></xsl:param>
<xsl:param name="databaseDriver"></xsl:param>
<xsl:param name="databaseVersion"></xsl:param>
<xsl:param name="databaseFixpak"></xsl:param>
<xsl:param name="databaseFeatures"></xsl:param>
<xsl:param name="context"></xsl:param>
  <xsl:template match="node()">
  	<xsl:variable name="include">
	    <xsl:if test="count(@context) != 0 and @context != ''">
		    <xsl:if test="not(contains(concat(',',concat(@context,',')),concat(',',concat($context,','))))">false</xsl:if> 
	    </xsl:if> 
	    <xsl:if test="count(@notContext) != 0 and @notContext != ''">
		    <xsl:if test="contains(concat(',',concat(@notContext,',')),concat(',',concat($context,',')))">false</xsl:if> 
	    </xsl:if> 
	    <xsl:if test="count(@database) != 0 and @database != '' and @database != $database">false</xsl:if> 
    	<xsl:if test="count(@connection) != 0 and @connection != '' and @connection != $connection">false</xsl:if> 
    	<xsl:if test="count(@feature) != 0 and @feature != ''">
    		<xsl:choose>
    			<xsl:when test="$databaseFeatures = '' ">false</xsl:when>
    			<xsl:when test="contains(concat(',',concat($databaseFeatures,',')),concat(',',concat(@feature,',')))"></xsl:when>
    			<xsl:otherwise>false</xsl:otherwise>
    		</xsl:choose>
    	</xsl:if>
    	<xsl:if test="count(@noFeature) != 0 and @noFeature != ''">
    		<xsl:choose>
    			<xsl:when test="$databaseFeatures = '' "/>
    			<xsl:when test="contains(concat(',',concat($databaseFeatures,',')),concat(',',concat(@noFeature,',')))">false</xsl:when>
    		</xsl:choose>
    	</xsl:if>
    	<xsl:if test="count(@DBMS) != 0">
	    	<xsl:choose>
	    		<xsl:when test="@DBMS = 'ALL'"/>
 	   			<xsl:when test="@DBMS = ''"/>
    			<xsl:when test="@DBMS = $databaseDBMS"/>
    			<xsl:otherwise>false</xsl:otherwise>
    		</xsl:choose>
    	</xsl:if>
    	<xsl:if test="count(@maxVersion) != 0">
	    	<xsl:choose>
				<xsl:when test="@maxVersion = 0"/>
				<xsl:when test="@maxVersion = ''"/>
				<xsl:when test="$databaseVersion &gt; @maxVersion">false</xsl:when>
				<xsl:when test="$databaseVersion = @maxVersion">
					<xsl:choose>
						<xsl:when test="count(@maxFixPack) = 0"/>
						<xsl:when test="@maxFixPack = 0"/>
						<xsl:when test="@maxFixPack = ''"/>
						<xsl:when test="$databaseFixpak &gt; @maxFixPack">false</xsl:when>
					</xsl:choose>
				</xsl:when>
			</xsl:choose>
    	</xsl:if>
    	<xsl:if test="count(@minVersion) != 0">
	    	<xsl:choose>
				<xsl:when test="@minVersion = 0"/>
				<xsl:when test="@minVersion = ''"/>
				<xsl:when test="$databaseVersion  &lt; @minVersion">false</xsl:when>
				<xsl:when test="$databaseVersion= @minVersion">
					<xsl:choose>
						<xsl:when test="count(@minFixPack) = 0"/>
						<xsl:when test="@minFixPack = 0"/>
						<xsl:when test="@minFixPack = ''"/>
						<xsl:when test="$databaseFixpak &lt; @minFixPack">false</xsl:when>
					</xsl:choose>
				</xsl:when>
			</xsl:choose>
  		</xsl:if>
    </xsl:variable>
    <xsl:if test="normalize-space($include) =''">
      <xsl:copy><xsl:apply-templates select="@*|node()"/></xsl:copy>
    </xsl:if>
  </xsl:template>

  <xsl:template match="@*">
    <xsl:if test=". != ''">
      <xsl:copy/>
    </xsl:if>
  </xsl:template>

</xsl:stylesheet>