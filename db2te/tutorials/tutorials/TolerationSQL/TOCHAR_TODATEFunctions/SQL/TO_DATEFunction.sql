VALUES
  ('DD Day of month','29',TO_DATE('29','DD')), 
  ('DDD Day of year','156',TO_DATE('156','DDD')),
  ('FF[n] Fractional seconds','2009000',TO_DATE('209000','FF')),
  ('HH HH behaves the same as HH12','11',TO_DATE('11','HH')),
  ('HH12 Hour of the day','09',TO_DATE('09','HH12')),
  ('HH24 Hour of the day','13',TO_DATE('13','HH24')),  
  ('J Julian day','2454342',TO_DATE('2454342','J')),
  ('MI Minute','31',TO_DATE('31','MI')),
  ('MM Month','08',TO_DATE('08','MM')),
  ('NNNNNN Microseconds','209000',TO_DATE('209000','NNNNNN')),
  ('RR same as YY','07',TO_DATE('07','RR')),
  ('RRRR same as YYYY','2007',TO_DATE('2007','RRRR')),
  ('SS Seconds (00-59)','42',TO_DATE('42','SS')),
  ('SSSSS Seconds','410',TO_DATE('410','SSSSS')),
  ('Y Last digit of the year','7',TO_DATE('7','Y')),
  ('YY Last two digits of the year','07',TO_DATE('07','YY')),
  ('YYY Last three digits of the year','007',TO_DATE('007','YYY')),
  ('YYYY 4-digit year','2007',TO_DATE('2007','YYYY'))