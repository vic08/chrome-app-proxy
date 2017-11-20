import {parseUrl, stringToArrayBuffer, arrayBufferToString} from '../utils/utils';
import {log} from '../utils/logger';
// import { } from '../utils/httpHandler';

function getProxiedHttpRequest(requestData) {
  let message = requestData.originalMessage;

  let targetURLData = parseUrl(requestData.queryParameters.url);
  let targetURI = targetURLData.pathname + (targetURLData.queryString ? '?' + targetURLData.queryString : '');
  let targetHost = targetURLData.domain + ':' + targetURLData.port;

  message = message.replace(requestData.requestURI, targetURI);
  message = message.replace('Host: ' + requestData.headers.Host, 'Host: ' + targetHost); //todo: check if there is a strict standard for 1 space between header key and value

  return message;
}

function getProxyOnReceiveListener(targetSocketId, responseSocketId) {
  const handler = (info) => {
    if (targetSocketId !== info.socketId) {
      return;
    }

    let message = arrayBufferToString(info.data);
    log('Received from server: \r\n' + message);

    chrome.sockets.tcp.send(responseSocketId, info.data, function(sendInfo) {
      if (sendInfo.resultCode < 0) {
        log('ERROR: could not send data back to client. ' + chrome.runtime.lastError.message);
        chrome.sockets.tcp.onReceive.removeListener(handler);
        chrome.sockets.tcp.close(targetSocketId);
        chrome.sockets.tcp.close(responseSocketId);
      }
      // if (isResponseCompleted(message)) {
        // chrome.sockets.tcp.close(targetSocketId);
        // chrome.sockets.tcp.close(responseSocketId);
      // }
    });
  };
  return handler;
}

export function proxyRequest(req) {
  if (!req.queryParameters.url) {
    chrome.sockets.tcp.close(req.clientSocketId);
    log('Client did not provide a target url. Closing socket ' + req.clientSocketId);
    return;
  }

  let urlData = parseUrl(req.queryParameters.url);

  chrome.sockets.tcp.create({}, function(createInfo) {
    let targetSocketId = createInfo.socketId;
    chrome.sockets.tcp.connect(targetSocketId, urlData.domain, urlData.port, function(result) {
      if (result < 0) {
        log('ERROR: Could not connect to remote  server ' + urlData.domain + ':' + urlData.port + '. Error: ' + chrome.runtime.lastError.message);
        chrome.sockets.tcp.close(targetSocketId);
        return;
      }

      let socketListener = getProxyOnReceiveListener(targetSocketId, req.clientSocketId);
      chrome.sockets.tcp.onReceive.addListener(socketListener);

      let proxiedHttpRequest = getProxiedHttpRequest(req);
      log('Sending request to target server: ' + proxiedHttpRequest);
      let binaryData = stringToArrayBuffer(proxiedHttpRequest);

      chrome.sockets.tcp.send(targetSocketId, binaryData, (sendInfo) => {
        if (sendInfo.resultCode < 0) {
          //todo: remove listener
          log('ERROR: when sending request to target server: ' + chrome.runtime.lastError.message);
          chrome.sockets.tcp.onReceive.removeListener(socketListener);
        }
      })
    })
  })
}