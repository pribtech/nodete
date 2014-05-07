SELECT DEC(REGR_AVGX(y,x),15,2) AS "Average X value", DEC(REGR_AVGY(y,x),15,2) AS "Average Y value" FROM ?SCHEMA?.xycoords
