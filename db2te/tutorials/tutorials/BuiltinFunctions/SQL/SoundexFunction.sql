select firstnme, lastname from ?SCHEMA?.employee
  where soundex(lastname) = soundex('smyth')