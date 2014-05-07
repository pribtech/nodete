CREATE TABLE ?SCHEMA?.district
  (
  postcode varchar(5),
  customers xml
  ) #

INSERT INTO ?SCHEMA?.district WITH
custrecs(postcode,postal_district) as 
  (
SELECT 
   postcode,
   XML2CLOB(
     XMLELEMENT
       (NAME "district",
         XMLATTRIBUTES(postcode as "postcode"),
         XMLAGG
           (
             (
             XMLELEMENT
               (
               NAME "customer",
               XMLELEMENT(NAME "custno", custno),
               XMLELEMENT(NAME "custname", custname)
               )
             )
             ORDER BY custname
           )
        )
    )
FROM 
  ?SCHEMA?.postaltxs
GROUP BY postcode
  )
SELECT * FROM custrecs;
