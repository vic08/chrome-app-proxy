import { InvalidHttpMessageError } from './errorTypes';

export function parseRequestMessage(message) {
  // validateHttpMessage(message);

  let firstLineArguments = getFirstLineArguments(message);

  return {
    originalMessage: message,
    method: firstLineArguments[0],
    headers: getHeaders(message),
    requestURI: firstLineArguments[1],
    queryParameters: getURLParameters(firstLineArguments[1]),
    body: getBody(message)
  }
}

export function parseResponseMessage(message) {
  // validateHttpMessage(message);

  let firstLineArguments = getFirstLineArguments(message);

  return {
    originalMessage: message,
    status: firstLineArguments[1],
    statusMessage: firstLineArguments[2],
    headers: getHeaders(message)
  }
}

function getHeaders(requestMessage) {
  let firstEmptyLineIndex = getFirstEmptyLineNumber(requestMessage);
  let lines = getLines(requestMessage);

  lines.splice(firstEmptyLineIndex, lines.length - firstEmptyLineIndex);
  lines.splice(0, 1);

  let headers = {};

  lines.forEach(line => {
    let parts = line.split(': ');
    if (parts.length < 2) {
      return;
    }
    let key = parts[0];
    parts.shift();
    let value;
    if (parts.length > 1) {
      value = parts.join(': ');
    } else {
      value = parts[0];
    }
    headers[key] = value;
  });

  return headers;
}

function getBody(message) {
  let lines = getLines(message);
  let firstEmptyLineNumber = getFirstEmptyLineNumber(message);
  return lines.slice(firstEmptyLineNumber + 1).join('\r\n').trim();
}

function getURLParameters(url) {
  let parts = url.split('?');
  if (parts.length > 2) {
    throw new InvalidHttpMessageError('Target url has more than 2 "?" signs.');
  }
  parts = parts[1] ? parts[1].split('&') : [];
  let result = {};
  parts.forEach(part => {
    let parts = part.split('=');
    result[parts[0]] = decodeURIComponent(parts[1]);
  });
  return result;
}

function getFirstEmptyLineNumber(message) {
  let lines = getLines(message);

  let firstEmptyLineIndex = lines.indexOf(''); // figure out: can there be spaces in this empty line?

  if (firstEmptyLineIndex === -1) {
    throw new InvalidHttpMessageError('Http message does not contain an empty line after headers.');
  }

  return firstEmptyLineIndex;
}

function getLines(message) {
  let regexp = /\r\n/g;
  return message.split(regexp);
}

function getFirstLineArguments(message) {
  let startLine = getLines(message)[0];
  let parts = startLine.split(/\s+/);

  if (parts.length > 3) {
    throw new InvalidHttpMessageError('More than 2 spaces in the http message start line.');
  }

  return parts;
}

// export function parseServerResponseMessage(message) {
//   validateHttpMessage(message);
//   return {
//
//   }
// }

//todo: implement validation of message structure
// export function validateHttpMessage(message) {
//
// }

// function getMethod(requestMessage) {
//   //todo: whitelist possible methods
//   let regexp = /^([A-Z]+)\s/;
//   return regexp.exec(requestMessage)[1];
// }

// function getServerResponseStatus(message) {
//
// }

// function getClientRequestURI(message) {
//   return getFirstLineArguments(message)[1];
// }

// export function isResponseCompleted(httpMessage) {
//
// }