SELECT DEC(REGR_SLOPE(y,x),5,2) AS SLOPE,DEC(REGR_ICPT(y,x),5,2) AS INTERCEPT
FROM ?SCHEMA?.xycoords;