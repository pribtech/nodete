SELECT xmlquery('$bi//author' passing bookinfo as "bi")
  FROM books 
 WHERE CONTAINS(bookinfo, 'range') = 1
;

xquery db2-fn:xmlcolumn-contains('?SCHEMA?.BOOKS.BOOKINFO', 'range')/bookinfo/author
;

SELECT author, year, substr(title,1,30)
  FROM books
 WHERE CONTAINS(bookinfo, '@xpath:''/bookinfo/story [.contains("range")]''') = 1
; 

xquery db2-fn:xmlcolumn-contains('?SCHEMA?.BOOKS.BOOKINFO', '@xpath:''/bookinfo/story[.contains("range")]''')/bookinfo/author
;
