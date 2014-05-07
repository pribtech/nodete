CREATE table ?SCHEMA?.tx_large 
  (
  custno int not null
  ) IN largetablespace;

CREATE table ?SCHEMA?.tx_small
  (
  custno int not null
  ) IN regulartablespace;
