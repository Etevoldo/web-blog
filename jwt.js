'use strict';

const { secret } = require('./secret.js');
const { createHmac } = require('node:crypto');

function btoaUrl(stringToEncode) {
  return Buffer.from(stringToEncode).toString('base64url');
}

const header = JSON.stringify({
  alg: 'HS256',
  typ: 'JWT'
});
function sign(payload, secret) {
  const HMAC_SHA256 = createHmac('sha256', secret);

  HMAC_SHA256.update(`${btoaUrl(header)}.${btoaUrl(payload)}`);
  const signature = HMAC_SHA256.digest('base64url');

  return `${btoaUrl(header)}.${btoaUrl(payload)}.${signature}`;
}

function verify(token, secret) {
  const HMAC_SHA256 = createHmac('sha256', secret);

  const [ header, payload, ClaimedSignature ] = token.split('.');

  HMAC_SHA256.update(header + '.' + payload);
  const signature = HMAC_SHA256.digest('base64url');

  if (ClaimedSignature === signature) {
    return { ok: true, data: decode(token, secret) } ;
  } else {
    return { ok: false, data: {} };
  }
}

function decode(token, secret) {
  const [ header, payload ] = token.split('.');
  return Buffer.from(header, 'base64url').toString('utf8') + '\n' +
      Buffer.from(payload, 'base64url').toString('utf8');
}

//mock token
const payload = JSON.stringify({
  loggedInAs: 'admin',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60), //expire in 1 minute
});

const token = sign(header, payload, secret + 1);

// test funtions
//console.log('JWT created:' + token);
//console.log(verify(token, secret));

module.exports = { sign, verify };
