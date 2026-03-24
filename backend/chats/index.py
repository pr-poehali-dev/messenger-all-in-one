"""
Чаты: список чатов, создание, поиск пользователей.
GET /?action=list — список чатов
GET /?action=search&q=... — поиск пользователей
POST / {"action": "create", ...} — создать чат
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
        action = params.get('action', '') or body.get('action', '')

        if method == 'GET' and action == 'list':
            cur.execute(f"""
                SELECT c.id, c.type, c.name,
                       (SELECT COUNT(*) FROM {SCHEMA}.messages m WHERE m.chat_id = c.id AND m.is_read = FALSE AND m.sender_id != %s) as unread,
                       (SELECT m2.text FROM {SCHEMA}.messages m2 WHERE m2.chat_id = c.id ORDER BY m2.created_at DESC LIMIT 1) as last_msg,
                       (SELECT m2.created_at FROM {SCHEMA}.messages m2 WHERE m2.chat_id = c.id ORDER BY m2.created_at DESC LIMIT 1) as last_time,
                       (SELECT u2.display_name FROM {SCHEMA}.users u2
                        JOIN {SCHEMA}.chat_members cm2 ON cm2.user_id = u2.id
                        WHERE cm2.chat_id = c.id AND u2.id != %s LIMIT 1) as other_name
                FROM {SCHEMA}.chats c
                JOIN {SCHEMA}.chat_members cm ON cm.chat_id = c.id
                WHERE cm.user_id = %s
                ORDER BY last_time DESC NULLS LAST
            """, (user_id, user_id, user_id))

            rows = cur.fetchall()
            result = []
            for r in rows:
                chat_id, ctype, cname, unread, last_msg, last_time, other_name = r
                name = cname if cname else (other_name or 'Неизвестный')
                time_str = last_time.strftime('%H:%M') if last_time else ''
                result.append({
                    'id': chat_id,
                    'type': ctype,
                    'name': name,
                    'unread': int(unread),
                    'last_message': last_msg or '',
                    'time': time_str,
                })
            return resp(200, {'chats': result})

        if method == 'GET' and action == 'search':
            q = params.get('q', '').strip().lower()
            if not q or len(q) < 2:
                return resp(200, {'users': []})

            cur.execute(
                f"""SELECT id, username, display_name FROM {SCHEMA}.users
                    WHERE (LOWER(username) LIKE %s OR LOWER(display_name) LIKE %s) AND id != %s
                    LIMIT 20""",
                (f'%{q}%', f'%{q}%', user_id)
            )
            users = [{'id': r[0], 'username': r[1], 'display_name': r[2]} for r in cur.fetchall()]
            return resp(200, {'users': users})

        if method == 'POST' and action == 'create':
            target_user_id = body.get('user_id')
            chat_type = body.get('type', 'chat')
            chat_name = body.get('name', '')

            if chat_type == 'chat' and target_user_id:
                cur.execute(f"""
                    SELECT c.id FROM {SCHEMA}.chats c
                    JOIN {SCHEMA}.chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = %s
                    JOIN {SCHEMA}.chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = %s
                    WHERE c.type = 'chat' LIMIT 1
                """, (user_id, target_user_id))
                existing = cur.fetchone()
                if existing:
                    return resp(200, {'chat_id': existing[0]})

                cur.execute(
                    f"INSERT INTO {SCHEMA}.chats (type, created_by) VALUES ('chat', %s) RETURNING id",
                    (user_id,)
                )
                chat_id = cur.fetchone()[0]
                cur.execute(f"INSERT INTO {SCHEMA}.chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, user_id))
                cur.execute(f"INSERT INTO {SCHEMA}.chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, target_user_id))
                conn.commit()
                return resp(200, {'chat_id': chat_id})

            if chat_type in ('group', 'channel'):
                cur.execute(
                    f"INSERT INTO {SCHEMA}.chats (type, name, created_by) VALUES (%s, %s, %s) RETURNING id",
                    (chat_type, chat_name or 'Без названия', user_id)
                )
                chat_id = cur.fetchone()[0]
                cur.execute(f"INSERT INTO {SCHEMA}.chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, user_id))
                conn.commit()
                return resp(200, {'chat_id': chat_id})

        return resp(400, {'error': 'Неизвестное действие'})

    finally:
        cur.close()
        conn.close()
