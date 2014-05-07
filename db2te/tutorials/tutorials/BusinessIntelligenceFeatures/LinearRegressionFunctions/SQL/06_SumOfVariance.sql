SELECT

    DEC(REGR_SXX(y,x),15,2) AS "Sum of X Variance",
    DEC(REGR_SYY(y,x),15,2) AS "Sum of Y Variance",
    DEC(REGR_SXY(y,x),15,2) AS "Sum of XY Covariance"

FROM ?SCHEMA?.xycoords
