"""
Авторизация: регистрация, вход, проверка сессии, выход.
Регистрация по номеру телефона с подтверждением через SMS-код.
Actions: send_code, register, login, me, logout
"""
import json
import os
import hashlib
import secrets
import re
import random
import urllib.request
import urllib.parse
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
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False)}

def send_sms(phone: str, message: str) -> bool:
    login = os.environ.get('SMSC_LOGIN', '')
    password = os.environ.get('SMSC_PASSWORD', '')
    params = urllib.parse.urlencode({
        'login': login,
        'psw': password,
        'phones': phone,
        'mes': message,
        'fmt': 3,
        'charset': 'utf-8',
    })
    url = f'https://smsc.ru/sys/send.php?{params}'
    req = urllib.request.urlopen(url, timeout=10)
    result = json.loads(req.read().decode('utf-8'))
    return 'error_code' not in result

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
        if action == 'send_code':
            phone_raw = body.get('phone', '').strip()
            purpose = body.get('purpose', 'register')

            if not phone_raw:
                return resp(400, {'error': 'Введите номер телефона'})

            phone = normalize_phone(phone_raw)
            if len(phone) < 10:
                return resp(400, {'error': 'Введите корректный номер телефона'})

            if purpose == 'register':
                cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE phone=%s", (phone,))
                if cur.fetchone():
                    return resp(409, {'error': 'Этот номер уже зарегистрирован'})

            if purpose == 'login':
                cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE phone=%s", (phone,))
                if not cur.fetchone():
                    return resp(404, {'error': 'Номер не найден. Сначала зарегистрируйтесь'})

            cur.execute(
                f"SELECT created_at FROM {SCHEMA}.sms_codes WHERE phone=%s AND purpose=%s AND used=FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
                (phone, purpose)
            )
            recent = cur.fetchone()
            if recent:
                import datetime
                age = (datetime.datetime.utcnow() - recent[0].replace(tzinfo=None)).total_seconds()
                if age < 60:
                    return resp(429, {'error': 'Подождите минуту перед повторной отправкой'})

            code = str(random.randint(100000, 999999))
            cur.execute(
                f"INSERT INTO {SCHEMA}.sms_codes (phone, code, purpose) VALUES (%s, %s, %s)",
                (phone, code, purpose)
            )
            conn.commit()

            message = f'Код подтверждения Pulse: {code}'
            sms_sent = send_sms(phone, message)
            if not sms_sent:
                return resp(500, {'error': 'Не удалось отправить SMS. Попробуйте позже'})

            return resp(200, {'ok': True, 'message': 'Код отправлен'})

        if action == 'register':
            phone_raw = body.get('phone', '').strip()
            display_name = body.get('display_name', '').strip()
            code = body.get('code', '').strip()

            if not phone_raw or not code or not display_name:
                return resp(400, {'error': 'Заполните все поля'})

            phone = normalize_phone(phone_raw)
            if len(phone) < 10:
                return resp(400, {'error': 'Введите корректный номер телефона'})

            cur.execute(
                f"SELECT id FROM {SCHEMA}.sms_codes WHERE phone=%s AND code=%s AND purpose='register' AND used=FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
                (phone, code)
            )
            code_row = cur.fetchone()
            if not code_row:
                return resp(400, {'error': 'Неверный или устаревший код'})

            cur.execute(f"UPDATE {SCHEMA}.sms_codes SET used=TRUE WHERE id=%s", (code_row[0],))

            username = 'u' + phone
            tok = secrets.token_hex(32)

            try:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.users (username, display_name, phone) VALUES (%s, %s, %s) RETURNING id",
                    (username, display_name, phone)
                )
                user_id = cur.fetchone()[0]
            except psycopg2.errors.UniqueViolation:
                conn.rollback()
                return resp(409, {'error': 'Этот номер уже зарегистрирован'})

            cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (user_id, tok))
            conn.commit()
            return resp(200, {'token': tok, 'user': {'id': user_id, 'username': username, 'display_name': display_name}})

        if action == 'login':
            phone_raw = body.get('phone', '').strip()
            code = body.get('code', '').strip()

            if not phone_raw or not code:
                return resp(400, {'error': 'Введите номер телефона и код'})

            phone = normalize_phone(phone_raw)

            cur.execute(
                f"SELECT id FROM {SCHEMA}.sms_codes WHERE phone=%s AND code=%s AND purpose='login' AND used=FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
                (phone, code)
            )
            code_row = cur.fetchone()
            if not code_row:
                return resp(400, {'error': 'Неверный или устаревший код'})

            cur.execute(f"UPDATE {SCHEMA}.sms_codes SET used=TRUE WHERE id=%s", (code_row[0],))

            cur.execute(
                f"SELECT id, username, display_name FROM {SCHEMA}.users WHERE phone=%s",
                (phone,)
            )
            user = cur.fetchone()
            if not user:
                return resp(401, {'error': 'Пользователь не найден'})

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