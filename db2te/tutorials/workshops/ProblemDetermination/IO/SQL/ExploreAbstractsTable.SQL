SELECT
	bookisbn as ISBN, 
	CAST(bookabstract AS VARCHAR(128)) as Abstract 
FROM abstracts
ORDER BY ISBN;