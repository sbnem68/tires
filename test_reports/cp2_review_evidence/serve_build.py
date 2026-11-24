"""Serve frontend/build as a single-page app on 127.0.0.1:4173 and proxy /api to the local backend (GET only)."""
import http.server, os, urllib.request
os.chdir('/app/frontend/build')
class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        p = self.path.split('?')[0]
        if p.startswith('/api'):
            try:
                with urllib.request.urlopen('http://127.0.0.1:8001' + self.path) as r:
                    body = r.read(); self.send_response(r.status)
                    self.send_header('Content-Type', r.headers.get('Content-Type', 'application/json'))
            except urllib.error.HTTPError as e:
                body = e.read(); self.send_response(e.code); self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body); return
        if not os.path.isfile('.' + p): self.path = '/index.html'
        return super().do_GET()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', 4173), H).serve_forever()
