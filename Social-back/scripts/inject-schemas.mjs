#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const openapiPath = path.join(process.cwd(), 'src', 'docs', 'openapi.json');

const schemasToInject = {
  "ObjectId": {
    "type": "string",
    "pattern": "^[a-fA-F0-9]{24}$",
    "example": "66c2d3a4e0b0c1a2b3c4d5e6"
  },
  "CommentReply": {
    "type": "object",
    "properties": {
      "userId": { "$ref": "#/components/schemas/ObjectId" },
      "text": { "type": "string", "example": "Thanks!" }
    }
  },
  "UserProfile": {
    "type": "object",
    "properties": {
      "_id": { "$ref": "#/components/schemas/ObjectId" },
      "name": { "type": "string", "nullable": true, "example": "Jane Doe" },
      "username": { "type": "string", "example": "jane_doe" },
      "email": { "type": "string", "format": "email", "example": "jane@example.com" },
      "avatar": { "type": "string", "example": "/uploads/avatar.jpg" },
      "bio": { "type": "string", "nullable": true },
      "location": { "type": "string", "nullable": true },
      "followers": { "type": "array", "items": { "$ref": "#/components/schemas/ObjectId" } },
      "following": { "type": "array", "items": { "$ref": "#/components/schemas/ObjectId" } },
      "isAdmin": { "type": "boolean", "example": false },
      "isActive": { "type": "boolean", "example": true },
      "lastActiveAt": { "type": "string", "format": "date-time", "nullable": true },
      "createdAt": { "type": "string", "format": "date-time" },
      "updatedAt": { "type": "string", "format": "date-time" }
    }
  },
  "Post": {
    "type": "object",
    "properties": {
      "_id": { "$ref": "#/components/schemas/ObjectId" },
      "userId": { "$ref": "#/components/schemas/ObjectId" },
      "image": { "type": "string", "nullable": true },
      "text": { "type": "string", "nullable": true, "example": "A new post from the feed." },
      "visibility": { "type": "string", "enum": ["public","private","friends"], "example": "public" },
      "likes": { "type": "array", "items": { "$ref": "#/components/schemas/ObjectId" } },
      "commentsCount": { "type": "integer", "example": 2 },
      "createdAt": { "type": "string", "format": "date-time" },
      "updatedAt": { "type": "string", "format": "date-time" }
    }
  },
  "Comment": {
    "type": "object",
    "properties": {
      "_id": { "$ref": "#/components/schemas/ObjectId" },
      "userId": { "$ref": "#/components/schemas/ObjectId" },
      "postId": { "$ref": "#/components/schemas/ObjectId" },
      "text": { "type": "string", "example": "Nice post!" },
      "replies": { "type": "array", "items": { "$ref": "#/components/schemas/CommentReply" } },
      "createdAt": { "type": "string", "format": "date-time" },
      "updatedAt": { "type": "string", "format": "date-time" }
    }
  },
  "Notification": {
    "type": "object",
    "properties": {
      "_id": { "$ref": "#/components/schemas/ObjectId" },
      "type": { "type": "string", "enum": ["like","follow","comment"], "example": "like" },
      "actor": { "$ref": "#/components/schemas/ObjectId" },
      "recipient": { "$ref": "#/components/schemas/ObjectId" },
      "post": { "$ref": "#/components/schemas/ObjectId", "nullable": true },
      "comment": { "$ref": "#/components/schemas/ObjectId", "nullable": true },
      "read": { "type": "boolean", "example": false },
      "createdAt": { "type": "string", "format": "date-time" },
      "updatedAt": { "type": "string", "format": "date-time" }
    }
  },
  "AuthRegisterResponse": {
    "type": "object",
    "properties": {
      "success": { "type": "boolean", "example": true },
      "message": { "type": "string", "example": "Registration successful. Verify your email to continue." },
      "user": { "$ref": "#/components/schemas/PublicAuthUser" }
    }
  },
  "FollowResponse": {
    "type": "object",
    "properties": {
      "target": { "$ref": "#/components/schemas/UserProfile" },
      "actor": { "$ref": "#/components/schemas/UserProfile" }
    }
  },
  "PaginatedUsers": {
    "type": "object",
    "properties": {
      "data": { "type": "array", "items": { "$ref": "#/components/schemas/UserProfile" } },
      "page": { "type": "integer", "example": 1 },
      "totalPages": { "type": "integer", "example": 4 },
      "totalCount": { "type": "integer", "example": 38 }
    }
  },
  "PaginatedPosts": {
    "type": "object",
    "properties": {
      "data": { "type": "array", "items": { "$ref": "#/components/schemas/Post" } },
      "page": { "type": "integer", "example": 1 },
      "totalPages": { "type": "integer", "example": 4 },
      "totalCount": { "type": "integer", "example": 38 }
    }
  },
  "Report": {
    "type": "object",
    "properties": {
      "_id": { "$ref": "#/components/schemas/ObjectId" },
      "reporterId": { "$ref": "#/components/schemas/ObjectId" },
      "targetId": { "$ref": "#/components/schemas/ObjectId" },
      "targetType": { "type": "string", "example": "post" },
      "reason": { "type": "string", "example": "spam" },
      "description": { "type": "string", "nullable": true },
      "status": { "type": "string", "example": "pending" },
      "createdAt": { "type": "string", "format": "date-time" },
      "updatedAt": { "type": "string", "format": "date-time" }
    }
  },
  "OtpGenerateResponse": {
    "type": "object",
    "properties": {
      "otp": { "$ref": "#/components/schemas/ObjectId" },
      "code": { "type": "string" },
      "expiresAt": { "type": "string", "format": "date-time" }
    }
  },
  "OtpVerifyResponse": {
    "type": "object",
    "properties": {
      "verified": { "type": "boolean" },
      "otp": { "$ref": "#/components/schemas/ObjectId" }
    }
  },
  "PaginatedComments": {
    "type": "object",
    "properties": {
      "data": { "type": "array", "items": { "$ref": "#/components/schemas/Comment" } },
      "page": { "type": "integer", "example": 1 },
      "totalPages": { "type": "integer", "example": 3 },
      "totalCount": { "type": "integer", "example": 24 }
    }
  },
  "PaginatedNotifications": {
    "type": "object",
    "properties": {
      "data": { "type": "array", "items": { "$ref": "#/components/schemas/Notification" } },
      "page": { "type": "integer", "example": 1 },
      "totalPages": { "type": "integer", "example": 2 },
      "totalCount": { "type": "integer", "example": 12 }
    }
  },
  "SessionSummary": {
    "type": "object",
    "properties": {
      "id": { "$ref": "#/components/schemas/ObjectId" },
      "deviceInfo": { "type": "string", "example": "Chrome on Windows" },
      "ipAddress": { "type": "string", "nullable": true, "example": "127.0.0.1" },
      "createdAt": { "type": "string", "format": "date-time" },
      "updatedAt": { "type": "string", "format": "date-time" },
      "lastSeenAt": { "type": "string", "format": "date-time" }
    }
  },
  "MediaUpload": {
    "type": "object",
    "properties": {
      "filename": { "type": "string", "example": "f4e1c8c8-1717760000000.jpg" },
      "mimetype": { "type": "string", "example": "image/jpeg" },
      "size": { "type": "integer", "example": 182736 },
      "url": { "type": "string", "example": "/uploads/f4e1c8c8-1717760000000.jpg" }
    }
  },
  "AdminStatsResponse": {
    "type": "object",
    "properties": {
      "users": { "type": "integer", "example": 120 },
      "posts": { "type": "integer", "example": 340 }
    }
  },
  "ErrorResponse": {
    "type": "object",
    "properties": {
      "message": { "type": "string", "example": "Unauthorized" },
      "error": { "type": "string", "example": "Forbidden" },
      "success": { "type": "boolean", "example": false },
      "errors": {
        "type": "array",
        "items": {
          "oneOf": [
            { "type": "string" },
            { "$ref": "#/components/schemas/ValidationIssue" }
          ]
        }
      },
      "stack": { "type": "string", "nullable": true }
    }
  },
  "ValidationIssue": {
    "type": "object",
    "properties": {
      "type": { "type": "string", "example": "field" },
      "msg": { "type": "string", "example": "Invalid value" },
      "path": { "type": "string", "example": "email" },
      "location": { "type": "string", "example": "body" },
      "value": {}
    }
  },
  "ValidationErrorResponse": {
    "type": "object",
    "properties": {
      "errors": {
        "type": "array",
        "items": { "$ref": "#/components/schemas/ValidationIssue" }
      }
    }
  },
  "RegisterUserResponse": {
    "type": "object",
    "properties": {
      "success": { "type": "boolean", "example": true },
      "message": { "type": "string", "example": "User created. Verification required." }
    }
  },
  "MessageResponse": {
    "type": "object",
    "properties": {
      "message": { "type": "string", "example": "Success" }
    }
  },
  "PublicAuthUser": {
    "type": "object",
    "required": ["id", "username", "email"],
    "properties": {
      "id": { "$ref": "#/components/schemas/ObjectId" },
      "username": { "type": "string", "example": "jane_doe" },
      "email": { "type": "string", "format": "email", "example": "jane@example.com" }
    }
  },
  "AuthLoginResponse": {
    "type": "object",
    "properties": {
      "message": { "type": "string", "example": "Login successful" },
      "accessToken": { "type": "string", "example": "eyJhbGciOi..." },
      "token": { "type": "string", "example": "eyJhbGciOi..." },
      "user": { "$ref": "#/components/schemas/PublicAuthUser" }
    }
  },
  "UsersLoginResponse": {
    "type": "object",
    "properties": {
      "message": { "type": "string", "example": "Login successful" },
      "token": { "type": "string", "example": "eyJhbGciOi..." },
      "user": { "$ref": "#/components/schemas/PublicAuthUser" }
    }
  },
  "VerifyEmailResponse": {
    "type": "object",
    "properties": {
      "success": { "type": "boolean", "example": true },
      "user": { "$ref": "#/components/schemas/PublicAuthUser" },
      "accessToken": { "type": "string", "example": "eyJhbGciOi..." }
    }
  }
};

async function main() {
  try {
    const raw = await readFile(openapiPath, 'utf8');
    const doc = JSON.parse(raw);

    if (!doc.components || typeof doc.components !== 'object') doc.components = {};
    if (!doc.components.schemas || typeof doc.components.schemas !== 'object') doc.components.schemas = {};

    const target = doc.components.schemas;
    const added = [];

    for (const [name, schema] of Object.entries(schemasToInject)) {
      if (Object.prototype.hasOwnProperty.call(target, name)) continue; // do not overwrite
      target[name] = schema;
      added.push(name);
    }

    await writeFile(openapiPath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
    console.log(`INJECTED_SCHEMAS_COUNT:${added.length}`);
    if (added.length) console.log(`ADDED:${added.join(',')}`);
    console.log(`SUCCESS: ${path.relative(process.cwd(), openapiPath)} updated`);
  } catch (err) {
    console.error('ERROR:', err && err.message ? err.message : String(err));
    process.exit(1);
  }
}

main();
