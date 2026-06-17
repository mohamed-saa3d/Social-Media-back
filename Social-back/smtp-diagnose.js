import dns from 'dns';
import util from 'util';
import tls from 'tls';
import net from 'net';
import dotenv from 'dotenv';
dotenv.config();

const resolve = util.promisify(dns.lookup);

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = Number(process.env.SMTP_PORT) || 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS ? '[REDACTED]' : undefined;

console.log('--- SMTP Diagnostic ---');
console.log('env.SMTP_HOST=', process.env.SMTP_HOST);
console.log('env.SMTP_PORT=', process.env.SMTP_PORT);
console.log('env.SMTP_USER=', process.env.SMTP_USER);
console.log('env.SMTP_SECURE=', process.env.SMTP_SECURE);
console.log('NODE_ENV=', process.env.NODE_ENV);

const transporterOptions = {
  host,
  port,
  secure: (String(process.env.SMTP_SECURE || '').toLowerCase() === 'true') || port === 465,
  auth: user ? { user, pass: pass ? '[REDACTED]' : undefined } : undefined,
};

console.log('\nComputed transporter.options:');
console.log(transporterOptions);

const runNodemailerVerify = async () => {
  try {
    const { default: nodemailer } = await import('nodemailer');
    const transporter = nodemailer.createTransport(transporterOptions);
    console.log('\ntransporter.options from nodemailer:', transporter.options || transporter.transport?.opts || 'n/a');
    console.log('\nCalling transporter.verify()...');
    await transporter.verify();
    console.log('transporter.verify(): OK');
  } catch (err) {
    console.error('transporter.verify() ERROR:');
    console.error(err && err.stack ? err.stack : err);
  }
};

const checkDnsAndTcp = async () => {
  try {
    console.log('\nResolving host via DNS.lookup...');
    const addr = await resolve(host);
    console.log('DNS.lookup result:', addr);

    console.log('\nOpening raw TCP connection to host to capture remote certificate (if STARTTLS)');
    const socket = net.connect({ host, port, timeout: 8000 });
    socket.on('connect', () => {
      console.log('TCP connected to', socket.remoteAddress, 'port', socket.remotePort);
      socket.end();
    });
    socket.on('error', (err) => {
      console.error('TCP connection error:', err && err.stack ? err.stack : err);
    });
    socket.on('timeout', () => {
      console.error('TCP connection timed out');
      socket.destroy();
    });

    // Also attempt TLS handshake (direct TLS) to retrieve cert chain if port uses TLS
    const tlsSocket = tls.connect({ host, port, servername: host, rejectUnauthorized: true, timeout: 8000 }, () => {
      try {
        const cert = tlsSocket.getPeerCertificate(true);
        console.log('\nTLS handshake succeeded; peer certificate:');
        console.log(cert);
        tlsSocket.end();
      } catch (e) {
        console.error('Error reading certificate:', e && e.stack ? e.stack : e);
        tlsSocket.destroy();
      }
    });
    tlsSocket.on('error', (err) => {
      console.error('\nTLS socket error (likely certificate issue or STARTTLS mismatch):');
      console.error(err && err.stack ? err.stack : err);
    });
  } catch (err) {
    console.error('DNS/TCP diagnostic failed:', err && err.stack ? err.stack : err);
  }
};

const main = async () => {
  await runNodemailerVerify();
  await checkDnsAndTcp();
  console.log('\n--- Diagnostic complete ---');
};

main().catch((err) => {
  console.error('Fatal error in diagnostic script:', err && err.stack ? err.stack : err);
});
