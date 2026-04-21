-- item_category.item_cat_id has no auto-increment default, so inserting a new
-- category without specifying item_cat_id would fail with a NOT NULL violation.
-- Give it an identity sequence.

DO $$
BEGIN
  IF (
    SELECT column_default IS NULL
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'item_category'
      AND column_name  = 'item_cat_id'
  ) THEN
    CREATE SEQUENCE IF NOT EXISTS item_category_item_cat_id_seq;
    ALTER TABLE item_category
      ALTER COLUMN item_cat_id SET DEFAULT nextval('item_category_item_cat_id_seq');
    ALTER SEQUENCE item_category_item_cat_id_seq
      OWNED BY item_category.item_cat_id;
    PERFORM setval(
      'item_category_item_cat_id_seq'::regclass,
      COALESCE((SELECT MAX(item_cat_id)::bigint FROM item_category), 0) + 1,
      false
    );
  END IF;
END $$;
