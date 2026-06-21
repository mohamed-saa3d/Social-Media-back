const fs = require('fs');
const p = 'src/docs/openapi.json';
let s = fs.readFileSync(p, 'utf8');
const needle = '"components": {';
const first = s.indexOf(needle);
if (first === -1) {
  console.error('NO_COMPONENTS');
  process.exit(1);
}
const second = s.indexOf(needle, first + 1);
if (second === -1) {
  console.error('ONLY_ONE_COMPONENT');
  process.exit(1);
}
const header = `{
  "openapi": "3.0.0",
  "info": {
    "title": "Social Media API",
    "version": "1.0.0",
    "description": "Full MERN Social Media Backend API Documentation"
  },
  "servers": [ { "url": "http://localhost:5000" } ],
  "tags": [
    { "name": "System", "description": "Health and system endpoints" },
    { "name": "Auth", "description": "Authentication and password management" },
    { "name": "Users", "description": "User profile and follow APIs" },
    { "name": "Posts", "description": "Post feed and reactions" },
    { "name": "Comments", "description": "Comment CRUD APIs" },
    { "name": "Notifications", "description": "Notification inbox APIs" },
    { "name": "Sessions", "description": "Session management APIs" },
    { "name": "Media", "description": "Media upload APIs" },
    { "name": "Admin", "description": "Administrative APIs" },
    { "name": "Reports", "description": "Content reporting APIs" }
  ],
`;
const rest = s.slice(second);
const out = header + rest;
fs.writeFileSync(p, out, 'utf8');
console.log('HEADER_FIXED');
