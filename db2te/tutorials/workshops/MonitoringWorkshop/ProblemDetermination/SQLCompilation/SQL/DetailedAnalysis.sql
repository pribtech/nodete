SELECT SUM(TOTAL_COMPILATIONS) TOTAL_COMPILATIONS,
       SUM(PKG_CACHE_INSERTS) PKG_CACHE_INSERTS,
	   SUM(PKG_CACHE_LOOKUPS) PKG_CACHE_LOOKUPS
	FROM TABLE(MON_GET_SERVICE_SUBCLASS('','',-2)) as t;
