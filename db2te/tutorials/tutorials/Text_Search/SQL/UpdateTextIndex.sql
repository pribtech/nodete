-- Insert a row into BOOKS
INSERT INTO books 
VALUES ( '456-456456456'
       , 'John Doe'
       , 'The Database Book'
       , 2005
       , XMLPARSE(DOCUMENT '<bookinfo> <author>John Doe</author> <title>The Database Book</title><story>The ultimate book about contemporary databases. </story> <year>2005</year> <price>55.00</price><pages>176</pages></bookinfo>'))
;

-- Update the text indexes
CALL SYSTS_UPDATE('?SCHEMA?', 'MYTITLEIDX', '', 'en_US', ?);
CALL SYSTS_UPDATE('?SCHEMA?', 'MYXMLIDX'  , '', 'en_US', ?);

-- Text search with XPath expression
SELECT author, year, substr(title,1,30)
  FROM books
 WHERE CONTAINS(bookinfo, '@xpath:''/bookinfo/story [. contains("database")]''') = 1
; 