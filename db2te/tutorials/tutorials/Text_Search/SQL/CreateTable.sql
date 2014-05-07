CREATE TABLE books ( isbn     VARCHAR(18) NOT NULL PRIMARY KEY
                   , author   VARCHAR(30)
                   , title    VARCHAR(128)
                   , year     INTEGER
                   , bookinfo XML )
;	

INSERT INTO books VALUES 
     ( '123-014014014'
     , 'Joe Climber'
     , 'Climber''s Mountain Tops'
     , 1995
     , XMLPARSE ( DOCUMENT '<bookinfo> <author>Joe Climber</author> <title>Climber''s Mountain Tops</title><story>This vivid description of Joe Climber''s experiences when tackling the mountains of his native Mountainland lets you hold your breath when you follow Joe on his adventures in the regions where the air is thin and the weather is treacherous. Includes beautiful color photos of Mountainland''s mountain ranges.</story> <year>1995</year> <price>16.00</price><pages>176</pages></bookinfo>' ) )
,    ( '678-014014078'
     , 'Joe Smith'
     , 'The Range'
     , 1991
     , XMLPARSE ( DOCUMENT '<bookinfo> <author>Joe Smith</author> <title>The Range</title><story>All you need to know about your kitchen range. A pictured description how to maintain and fix your kitchen range.</story> <year>1991</year> <price>6.00</price><pages>76</pages></bookinfo>' ) )
,    ( '111-223334444'
     , 'Sam Climber'
     , 'Top of the Mountain: Mountain Lore'
     , 1966
     , XMLPARSE(DOCUMENT '<bookinfo> <author>Sam Climber</author> <title>Top of the Mountain: Mountain Lore</title><story>Sam Climber has traveled through the world to gather stories about mountains. This compendium includes the best stories and is beautifully illustrated.</story> <year>1966</year> <price>20.00</price><pages>449</pages></bookinfo>' ) )
,    ( '777-010101010'
     , 'Samantha  Smitt'
     , 'The Database Compendium'
     , 2001
     , XMLPARSE(DOCUMENT '<bookinfo> <author>Samantha Smitt</author> <title>The Database Compendium</title><story>Follow Samantha into the world of database management. Covers a wide range of the most popular database architectures.</story> <year>2001</year> <price>19.00</price><pages>222</pages></bookinfo>' ) )
;
