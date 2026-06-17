import net from 'net';
import tls from 'tls';
import dns from 'dns';
import util from 'util';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const lookup = util.promisify(dns.lookup);

const HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const PORT = Number(process.env.SMTP_PORT) || 587;
const TIMEOUT = 10000;

const sha1 = (buf) => crypto.createHash('sha1').update(buf).digest('hex').toUpperCase();
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();

const printCert = (cert, idx) => {
  console.log(`\n--- Certificate [${idx}] ---`);
  console.log('subject:', cert.subject);
  console.log('issuer :', cert.issuer);
  console.log('valid_from:', cert.valid_from);
  console.log('valid_to  :', cert.valid_to);
  if (cert.raw) {
    console.log('sha1 fingerprint  :', sha1(cert.raw));
    console.log('sha256 fingerprint:', sha256(cert.raw));
  } else {
    console.log('(no raw data available)');
  }
};

const start = async () => {
  console.log('SMTP STARTTLS certificate inspector');
  console.log('Host:', HOST, 'Port:', PORT);

  try {
    const addr = await lookup(HOST);
    console.log('DNS.lookup result:', addr);
  } catch (e) {
    console.error('DNS.lookup failed:', e && e.stack ? e.stack : e);
  }

  const socket = net.createConnection({ host: HOST, port: PORT }, () => {
    console.log('\nTCP connected to', socket.remoteAddress, 'port', socket.remotePort);
  });

  socket.setEncoding('utf8');
  socket.setTimeout(TIMEOUT);

  let buffer = '';

  const send = (line) => {
    console.log('C: ' + line.trim());
    socket.write(line + '\r\n');
  };

  const closeAll = () => {
    try { socket.destroy(); } catch (e) { }
  };

  socket.on('data', (data) => {
    buffer += data;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();
    for (const line of lines) {
      console.log('S: ' + line);
      if (/^220\b/.test(line)) {
        send('EHLO localhost');
      } else if (/^250\b/.test(line) && line.includes('STARTTLS')) {
        send('STARTTLS');
      } else if (/^220\b.*TLS|Ready to start TLS|Go ahead and start TLS/i.test(line)) {
        console.log('\nServer ready for STARTTLS — upgrading to TLS');
        const tlsSocket = tls.connect({ socket, servername: HOST, rejectUnauthorized: true }, () => {
          console.log('\nTLS secure connection established');
          try {
            const peer = tlsSocket.getPeerCertificate(true);
            let idx = 0;
            let current = peer;
            while (current && Object.keys(current).length) {
              printCert(current, idx);
              if (!current.issuerCertificate || current === current.issuerCertificate) break;
              current = current.issuerCertificate;
              idx += 1;
            }
          } catch (e) {
            console.error('Failed to read peer certificate:', e && e.stack ? e.stack : e);
          }
          tlsSocket.end();
          closeAll();
        });

        tlsSocket.on('error', (err) => {
          console.error('\nTLS socket error:', err && err.stack ? err.stack : err);
          closeAll();
        });

        socket.removeAllListeners('data');
        socket.removeAllListeners('timeout');
      } else if (/^5\d\d\b/.test(line)) {
        console.error('SMTP error response:', line);
        closeAll();
      }
    }
  });

  socket.on('error', (err) => {
    console.error('\nTCP socket error:', err && err.stack ? err.stack : err);
    closeAll();
  });

  socket.on('timeout', () => {
    console.error('\nTCP socket timeout');
    closeAll();
  });

  socket.on('close', () => {
    console.log('\nTCP socket closed');
  });
};

start().catch((err) => {
  console.error('Fatal error:', err && err.stack ? err.stack : err);
});
