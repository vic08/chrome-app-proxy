import {HTTP_DEFAULT_PORT} from '../utils/constants';

export function parseUrl(url) {
  let regex = /(https?):\/\/(.[^/:]+)(?::([\d]+))?(\/[^?]+)?(\?(.*))?/;
  let matches = url.match(regex);
  return {
    protocol: matches[1],
    domain: matches[2],
    port: matches[3] || HTTP_DEFAULT_PORT,
    pathname: matches[4] || '/',
    queryString: matches[5]
  }
}

export function arrayBufferToString(buf) {
  let bufView = new Uint8Array(buf);
  let unis = [];
  for (var i = 0; i < bufView.length; i++) {
    unis.push(bufView[i]);
  }
  return String.fromCharCode.apply(null, unis);
}

export function stringToArrayBuffer(str) {
  let buf = new ArrayBuffer(str.length * 2);
  let bufView = new Uint8Array(buf);
  for (var i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}