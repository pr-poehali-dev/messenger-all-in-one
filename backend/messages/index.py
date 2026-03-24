"""
Сообщения: история чата и отправка.
GET /?chat_id=X — получить сообщения
POST / {"chat_id": X, "text": "..."} — отправить сообщение
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p83659847_messenger_all_in_one')
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user_by_token(cur, token):
    cur.execute(
        f"""SELECT u.id, u.username, u.display_name FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token=%s AND s.expires_at > NOW()""",
        (token,)
    )
    return cur.fetchone()

def resp(status, data):
    return {'statusCode': status, 'headers': CORS, 'body': data}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': {}}

    method = event.get('httpMethod', 'GET')
    token = event.get('headers', {}).get('X-Session-Token', '')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            body = {}

    conn = get_conn()
    cur = conn.cursor()

    try:
        user = get_user_by_token(cur, token)
        if not user:
            return resp(401, {'error': 'Не авторизован'})

        user_id = user[0]

        if method == 'GET':
            chat_id = params.get('chat_id')
            if not chat_id:
                return resp(400, {'error': 'chat_id обязателен'})

            cur.execute(
                f"SELECT 1 FROM {SCHEMA}.chat_members WHERE chat_id=%s AND user_id=%s",
                (chat_id, user_id)
            )
            if not cur.fetchone():
                return resp(403, {'error': 'Нет доступа к чату'})

            cur.execute(f"""
                SELECT m.id, m.sender_id, u.display_name, m.text, m.created_at, m.is_read
                FROM {SCHEMA}.messages m
                LEFT JOIN {SCHEMA}.users u ON u.id = m.sender_id
                WHERE m.chat_id=%s
                ORDER BY m.created_at ASC
                LIMIT 200
            """, (chat_id,))

            msgs = []
            for r in cur.fetchall():
                msg_id, sender_id, sender_name, text, created_at, is_read = r
                msgs.append({
                    'id': msg_id,
                    'sender_id': sender_id,
                    'sender_name': sender_name or 'Бот',
                    'text': text,
                    'time': created_at.strftime('%H:%M') if created_at else '',
                    'is_own': sender_id == user_id,
                    'is_read': is_read,
                })

            cur.execute(
                f"UPDATE {SCHEMA}.messages SET is_read=TRUE WHERE chat_id=%s AND sender_id!=%s AND is_read=FALSE",
                (chat_id, user_id)
            )
            conn.commit()
            return resp(200, {'messages': msgs})

        if method == 'POST':
            chat_id = body.get('chat_id')
            text = body.get('text', '').strip()

            if not chat_id or not text:
                return resp(400, {'error': 'chat_id и text обязательны'})

            cur.execute(
                f"SELECT 1 FROM {SCHEMA}.chat_members WHERE chat_id=%s AND user_id=%s",
                (chat_id, user_id)
            )
            if not cur.fetchone():
                return resp(403, {'error': 'Нет доступа к чату'})

            cur.execute(
                f"INSERT INTO {SCHEMA}.messages (chat_id, sender_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
                (chat_id, user_id, text)
            )
            msg_id, created_at = cur.fetchone()
            conn.commit()

            return resp(200, {
                'message': {
                    'id': msg_id,
                    'sender_id': user_id,
                    'text': text,
                    'time': created_at.strftime('%H:%M'),
                    'is_own': True,
                    'is_read': False,
                }
            })

        return resp(400, {'error': 'Неизвестный метод'})

    finally:
        cur.close()
        conn.close()
