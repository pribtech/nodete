SELECT dec(stddev(x),15,2) as "Standard Deviation X",
       dec(stddev(y),15,2) as "Standard Deviation Y"
       FROM ?SCHEMA?.stats;