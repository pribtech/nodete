SELECT * FROM customer_address_without_compression ORDER BY customer_id;

SELECT * FROM customer_address_with_compression ORDER BY customer_id;

SELECT COUNT(*) FROM customer_address_without_compression;

SELECT COUNT(*) FROM customer_address_with_compression;