from flask import Flask, jsonify, request, send_from_directory, Response
import requests, os, time

app = Flask(__name__, static_folder='.')

CLIENT_ID = 'sh-6923f6c3-13d9-40fa-9ad0-c4e6e99d4b27'
CLIENT_SECRET = 'ytBy2eKPGnTBjspJ1VwRdA6yL8MwiAV4'
TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'

token_cache = {'token': None, 'expiry': 0}

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/token')
def get_token():
    now = time.time()
    if token_cache['token'] and now < token_cache['expiry']:
        return jsonify({'access_token': token_cache['token']})
    try:
        resp = requests.post(TOKEN_URL, data={
            'grant_type': 'client_credentials',
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET
        }, timeout=30)
        if not resp.ok:
            return jsonify({'error': 'Token error'}), resp.status_code
        data = resp.json()
        token_cache['token'] = data['access_token']
        token_cache['expiry'] = now + data.get('expires_in', 3600) - 60
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

API_MAP = {
    'process': 'https://sh.dataspace.copernicus.eu/api/v1/process',
    'statistics': 'https://sh.dataspace.copernicus.eu/api/v1/statistics',
    'catalog': 'https://sh.dataspace.copernicus.eu/api/v1/catalog/1.0.0/search'
}

@app.route('/api/<endpoint>', methods=['POST'])
def proxy_api(endpoint):
    if endpoint not in API_MAP:
        return jsonify({'error': 'Unknown endpoint'}), 404
    try:
        # Get fresh token server-side (no need to pass from client)
        token_resp = requests.post(TOKEN_URL, data={
            'grant_type': 'client_credentials',
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET
        }, timeout=30)
        if not token_resp.ok:
            return jsonify({'error': 'Auth failed'}), 502
        token = token_resp.json()['access_token']

        url = API_MAP[endpoint]
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': request.headers.get('Content-Type', 'application/json')
        }
        accept = request.headers.get('Accept')
        if accept:
            headers['Accept'] = accept

        body = request.get_json(silent=True)
        resp = requests.post(url, headers=headers, json=body, stream=True, timeout=90)

        if endpoint == 'process' and 'image' in (resp.headers.get('Content-Type', '')):
            return Response(resp.iter_content(chunk_size=8192),
                          status=resp.status_code,
                          content_type=resp.headers.get('Content-Type'))
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)
