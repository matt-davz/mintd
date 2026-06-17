CREATE TABLE item_order (
  item_id uuid PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  display_order integer NOT NULL
);

ALTER TABLE item_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY "item_order_public_read" ON item_order
  FOR SELECT USING (true);

CREATE POLICY "item_order_anon_write" ON item_order
  FOR ALL USING (true) WITH CHECK (true);
