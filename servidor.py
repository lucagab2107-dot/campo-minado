
import http.server
import socketserver
import webbrowser
import os

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Servidor rodando na porta {PORT}")
    print("O navegador deve abrir automaticamente.")
    
    # Abrir navegador
    webbrowser.open(f"http://localhost:{PORT}")
    
    # Iniciar servidor
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
Clicking...Pressing key...Stopping...

Stop Agent
