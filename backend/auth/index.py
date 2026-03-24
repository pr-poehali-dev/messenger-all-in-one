"""
Авторизация: регистрация, вход, проверка сессии, выход.
Вход и регистрация по номеру телефона + пароль.
Action передаётся в теле запроса: {"action": "register"|"login"|"me"|"logout"}
"""
import json
import os
import hashlib
import secrets
import re
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p83659847_messenger_all_in_one')
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def normalize_phone(raw: str) -> str:
    digits = re.sub(r'\D', '', raw)
    if digits.startswith('8') and len(digits) == 11:
        digits = '7' + digits[1:]
    return digits

def resp(status, data):
    return {'statusCode': status, 'headers': CORS, 'body': data}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': {}}

    method = event.get('httpMethod', 'GET')
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            body = {}

    action = body.get('action', '')
    token = event.get('headers', {}).get('X-Session-Token', '')

    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == 'register':
            phone_raw = body.get('phone', '').strip()
            display_name = body.get('display_name', '').strip()
            password = body.get('password', '')

            if not phone_raw or not password or not display_name:
                return resp(400, {'error': 'Заполните все поля'})
            if len(password) < 6:
                return resp(400, {'error': 'Пароль минимум 6 символов'})

            phone = normalize_phone(phone_raw)
            if len(phone) < 10:
                return resp(400, {'error': 'Введите корректный номер телефона'})

            pw_hash = hash_password(password)
            username = 'u' + phone

            try:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.users (username, display_name, password_hash, phone) VALUES (%s, %s, %s, %s) RETURNING id",
                    (username, display_name, pw_hash, phone)
                )
                user_id = cur.fetchone()[0]
            except psycopg2.errors.UniqueViolation:
                conn.rollback()
                return resp(409, {'error': 'Этот номер уже зарегистрирован'})

            tok = secrets.token_hex(32)
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (user_id, tok))
            conn.commit()
            return resp(200, {'token': tok, 'user': {'id': user_id, 'username': username, 'display_name': display_name}})

        if action == 'login':
            phone_raw = body.get('phone', '').strip()
            password = body.get('password', '')

            if not phone_raw or not password:
                return resp(400, {'error': 'Введите номер телефона и пароль'})

            phone = normalize_phone(phone_raw)
            pw_hash = hash_password(password)

            cur.execute(
                f"SELECT id, username, display_name FROM {SCHEMA}.users WHERE phone=%s AND password_hash=%s",
                (phone, pw_hash)
            )
            user = cur.fetchone()
            if not user:
                return resp(401, {'error': 'Неверный номер или пароль'})

            tok = secrets.token_hex(32)
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (user[0], tok))
            conn.commit()
            return resp(200, {'token': tok, 'user': {'id': user[0], 'username': user[1], 'display_name': user[2]}})

        if action == 'me' or (method == 'GET' and token):
            if not token:
                return resp(401, {'error': 'Нет токена'})

            cur.execute(
                f"""SELECT u.id, u.username, u.display_name FROM {SCHEMA}.sessions s
                    JOIN {SCHEMA}.users u ON u.id = s.user_id
                    WHERE s.token=%s AND s.expires_at > NOW()""",
                (token,)
            )
            row = cur.fetchone()
            if not row:
                return resp(401, {'error': 'Сессия истекла'})

            return resp(200, {'user': {'id': row[0], 'username': row[1], 'display_name': row[2]}})

        if action == 'logout':
            if token:
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at=NOW() WHERE token=%s", (token,))
                conn.commit()
            return resp(200, {'ok': True})

        return resp(400, {'error': 'Неизвестное действие'})

    finally:
        cur.close()
        conn.close()