/* Alter table order_details to add primary key and foreign key */
ALTER TABLE order_details ADD CONSTRAINT FK_ORDER FOREIGN KEY ( order_id ) REFERENCES orders ( order_id ) ON DELETE CASCADE;
ALTER TABLE order_details ADD CONSTRAINT FK_PRODUCT FOREIGN KEY ( product_id ) REFERENCES product ( product_id );