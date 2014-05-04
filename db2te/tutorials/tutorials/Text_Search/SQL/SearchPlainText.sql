-- Basic syntax for text search
SELECT author, year, substr(title,1,30)
  FROM books
 WHERE CONTAINS(title, 'mountain') = 1
;

-- Use of default Boolean operator
SELECT author, year, substr(title,1,30)
  FROM books
 WHERE CONTAINS(title, 'mountain top') = 1
;

-- Find an exact match
SELECT author, year, substr(title,1,30)
  FROM books
 WHERE CONTAINS(title, '"mountain tops"') = 1
;

-- Search with wildcards
SELECT author, year, substr(title,1,30)
  FROM books
 WHERE CONTAINS(title, 'comp*') = 1
;

-- Limit number of documents to be returned
SELECT author, year, substr(title,1,30)
  FROM books
 WHERE CONTAINS(title, 'mountain', 'RESULTLIMIT=1') = 1
;

-- Get the relevance of documents
SELECT title
  FROM books
 WHERE CONTAINS(title, 'mountain') = 1
 ORDER BY SCORE(title, 'mountain') DESC
;

