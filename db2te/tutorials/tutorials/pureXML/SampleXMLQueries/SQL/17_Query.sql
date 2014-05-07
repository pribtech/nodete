XQUERY
    for
        $customer
    in
        db2-fn:xmlcolumn("?SCHEMA?.XMLCUSTOMER.INFO")/customerinfo
    where
        $customer/addr/city = 'Markham' or
        $customer/addr/city = 'San Jose'
    order by
        $customer/name
    return
        ($customer/name, $customer/addr);
