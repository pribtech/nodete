XQUERY
    for
        $customer
    in
        db2-fn:xmlcolumn("?SCHEMA?.XMLCUSTOMER.INFO")/customerinfo
    return
        $customer/name;
