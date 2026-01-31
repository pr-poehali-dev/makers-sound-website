import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''API для сохранения метаданных релизов в БД (файлы загружаются напрямую из браузера)'''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        return get_releases()
    elif method == 'POST':
        return save_release(event)
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }

def get_releases() -> dict:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    cur.execute(f'''
        SELECT id, title, artist, genre, year, cover_url, audio_url, created_at
        FROM {schema}.releases
        ORDER BY created_at DESC
    ''')
    
    releases = []
    for row in cur.fetchall():
        releases.append({
            'id': row[0],
            'title': row[1],
            'artist': row[2],
            'genre': row[3],
            'year': row[4],
            'cover': row[5],
            'preview': row[6],
            'created_at': row[7].isoformat() if row[7] else None
        })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'releases': releases}),
        'isBase64Encoded': False
    }

def save_release(event: dict) -> dict:
    try:
        body = json.loads(event.get('body', '{}'))
        
        title = body.get('title')
        artist = body.get('artist')
        genre = body.get('genre')
        year = body.get('year')
        audio_url = body.get('audio_url')
        cover_url = body.get('cover_url')
        
        if not all([title, artist, genre, year, audio_url]):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing required fields'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        cur.execute(f'''
            INSERT INTO {schema}.releases (title, artist, genre, year, cover_url, audio_url)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (title, artist, genre, int(year), cover_url, audio_url))
        
        release_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'id': release_id,
                'title': title,
                'artist': artist,
                'audio_url': audio_url,
                'cover_url': cover_url
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
