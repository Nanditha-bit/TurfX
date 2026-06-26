import psycopg2
import psycopg2.extras

conn = psycopg2.connect(
    host='localhost', port=5432, dbname='turfx_db',
    user='postgres', password='12345678',
    cursor_factory=psycopg2.extras.RealDictCursor
)
cur = conn.cursor()
cur.execute('UPDATE turfs SET price_per_hour = 800 WHERE price_per_hour < 800 RETURNING name, price_per_hour')
updated = cur.fetchall()
conn.commit()
cur.close()
conn.close()

if updated:
    print(f'Updated {len(updated)} turfs to minimum Rs.800:')
    for r in updated:
        print(f'  {r["name"]} -> Rs.{r["price_per_hour"]}')
else:
    print('All turfs already at or above Rs.800')
