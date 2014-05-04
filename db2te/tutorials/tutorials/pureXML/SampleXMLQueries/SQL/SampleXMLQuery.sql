CREATE TABLE ?SCHEMA?.XMLCUSTOMER
             (
                          CID INT NOT NULL PRIMARY KEY,
                          INFO XML
             );

INSERT
INTO   ?SCHEMA?.XMLCUSTOMER VALUES
       (
              1000,
              XMLPARSE (DOCUMENT '<?xml version="1.0" encoding="UTF-8" ?><customerinfo>
                                    <name>Amir Malik</name>
                                    <addr country="United States">
                                    <street>555 Bailey Ave</street>
                                    <city>San Jose</city>
                                    <prov-state>California</prov-state>
                                    <pcode-zip>95141</pcode-zip>
                                    </addr>
                                    <phone type="work">408-555-1358</phone>
                                    </customerinfo>' PRESERVE WHITESPACE)
       )
       ,
       (
              1001,
              XMLPARSE (DOCUMENT '<?xml version="1.0" encoding="UTF-8" ?><customerinfo>
                                    <name>Kathy Smith</name>
                                    <addr country="Canada">
                                    <street>25 EastCreek</street>
                                    <city>Toronto</city>
                                    <prov-state>Ontario</prov-state>
                                    <pcode-zip>M8X-3T6</pcode-zip>
                                    </addr>
                                    <phone type="work">416-555-1358</phone>
                                    </customerinfo> ' PRESERVE WHITESPACE)
       )
       ,
       (
              1002,
              XMLPARSE (DOCUMENT '<?xml version="1.0" encoding="UTF-8" ?><customerinfo>
                                    <name>Jim Noodle</name>
                                    <addr country="Canada">
                                    <street>25 EastCreek</street>
                                    <city>Markham</city>
                                    <prov-state>Ontario</prov-state>
                                    <pcode-zip>N9C-3T6</pcode-zip>
                                    </addr>
                                    <phone type="work">905-555-7258</phone>
                                    </customerinfo>' PRESERVE WHITESPACE)
       )
       ,
       (
              1003,
              XMLPARSE (DOCUMENT '<?xml version="1.0" encoding="UTF-8" ?><customerinfo>
                                    <name>Anant Jhingran</name>
                                    <addr country="United States">
                                    <street>555 Bailey Ave</street>
                                    <city>San Jose</city>
                                    <prov-state>California</prov-state>
                                    <pcode-zip>95141</pcode-zip>
                                    </addr>
                                    <phone type="work">408-555-7258</phone>
                                    <phone type="home">416-555-2937</phone>
                                    <phone type="cell">905-555-8743</phone>
                                    <phone type="cottage">613-555-3278</phone>
                                    </customerinfo>' PRESERVE WHITESPACE)
       )
       ,
       (
              1004,
              XMLPARSE (DOCUMENT '<?xml version="1.0" encoding="UTF-8" ?><customerinfo>
                                    <name>Bert and Ernie Inc.</name>
                                    <addr country="Canada">
                                    <street>1 Young Strett</street>
                                    <city>Toronto</city>
                                    <prov-state>Ontario</prov-state>
                                    <pcode-zip>M5W-IE6</pcode-zip>
                                    </addr>
                                    <phone type="work">416-555-7845</phone>
                                    </customerinfo>' PRESERVE WHITESPACE)
       );

CREATE TABLE ?SCHEMA?.XMLPRODUCT
             (
                          PID INT NOT NULL PRIMARY KEY,
                          DESCRIPTION XML
             );

INSERT
INTO   ?SCHEMA?.XMLPRODUCT VALUES
       (
              1000,
              XMLPARSE (DOCUMENT '<product pid="100-101-01">
                                      <description>
                                        <name>Sterling Silver Sugar &amp; Creamer by Poole</name>
                                        <details>
                                    Spectacular sugar and creamer set made of heavy, hand chased sterling 
                                    silver by Poole "Old English" with superb details; very ornate; body and 
                                    handles have a repousse and scroll pattern; sugar bowl with a lid
                                        </details>
                                        <price currency="us">350.00</price>
                                        <weight units="lb">1.3</weight>
                                        <size units="inches">
                                    creamer height 4.5, spout to handle width 5; sugar 
                                    height 6, width handle to handle 6 inches 
                                        </size>
                                        <brand>Poole</brand>
                                        <category catx="sterling" caty="">Sugar &amp; Creamer</category>
                                        <images>
                                          <image type="thumbnail" alias="">1a</image>
                                          <image type="full" alias="">1a</image>
                                          <image type="full" alias="">1b</image>
                                          <image type="full" alias="">1c</image>
                                          <image type="full" alias="">1d</image>
                                        </images>
                                      </description>
                                  </product>' PRESERVE WHITESPACE)
       )
       ,
       (
              1001,
              XMLPARSE (DOCUMENT '<product pid="180-131-01">
                                      <description>
                                        <name>Red Lamp</name>
                                        <details>
                                    Lovely Red Lamp.
                                        </details>
                                        <price currency="us">1350.00</price>
                                        <weight units="lb">4.3</weight>
                                        <size units="inches">
                                    12 inches tall
                                        </size>
                                        <brand>Lamparama</brand>
                                        <category catx="lamps" caty="">Lamps</category>
                                        <images>
                                          <image type="thumbnail" alias="">1a</image>
                                          <image type="full" alias="">1a</image>
                                          <image type="full" alias="">1b</image>
                                          <image type="full" alias="">1c</image>
                                          <image type="full" alias="">1d</image>
                                        </images>
                                      </description>
                                  </product>' PRESERVE WHITESPACE)
       )
       ,
       (
              1002,
              XMLPARSE (DOCUMENT '<product pid="100-121-99">
                                      <description>
                                        <name>Baseball Bat</name>
                                        <details>
                                    Heavy baseball bat.
                                        </details>
                                        <price currency="us">10.00</price>
                                        <weight units="lb">9.3</weight>
                                        <size units="inches">
                                    15 inches long
                                        </size>
                                        <brand>Batter</brand>
                                        <category catx="bats" caty="">Bats</category>
                                        <images>
                                          <image type="thumbnail" alias="">1a</image>
                                          <image type="full" alias="">1a</image>
                                          <image type="full" alias="">1b</image>
                                          <image type="full" alias="">1c</image>
                                          <image type="full" alias="">1d</image>
                                        </images>
                                      </description>
                                  </product>' PRESERVE WHITESPACE)
       );
