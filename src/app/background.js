import { parseRequestMessage } from './utils/httpHandler';
import { arrayBufferToString } from './utils/utils';
import { log } from './utils/logger';
import { proxyRequest } from './controllers/proxy';

const PROXY_PORT = 5858;
const PROXY_ADDRESS = '127.0.0.1';

let proxyServerSocketId;

function startApplication() {
  chrome.app.runtime.onLaunched.addListener(function () {

    chrome.app.window.create('server.html', {
      'outerBounds': {
        'width': 400,
        'height': 500
      }
    });

    chrome.sockets.tcpServer.create({}, function (createInfo) {
      proxyServerSocketId = createInfo.socketId;
      log('TCP server created. SocketID: ' + proxyServerSocketId);

      chrome.sockets.tcpServer.listen(proxyServerSocketId, PROXY_ADDRESS, PROXY_PORT, null, function (result) {
        if (result < 0) {
          log('Listen failed. Error: ' + chrome.runtime.lastError.message);
          chrome.sockets.tcpServer.close(proxyServerSocketId);
          return;
        }

        log('Listening on port ' + PROXY_PORT + ', address: ' + PROXY_ADDRESS);
      });
      chrome.sockets.tcpServer.onAccept.addListener(onAcceptConnection);
    });
  });

  chrome.runtime.onSuspend.addListener(function () {
    chrome.sockets.tcpServer.getSockets(function (sockets) {
      sockets.forEach(function (socketInfo) {
        chrome.sockets.tcpServer.close(socketInfo.socketId);
      })
    })
  });
}

function onAcceptConnection(info) {
  if (info.socketId != proxyServerSocketId) {
    return;
  }

  chrome.sockets.tcp.onReceive.addListener(getOnListenClientRequests(info.clientSocketId));

  chrome.sockets.tcp.setPaused(info.clientSocketId, false);
}

function onTcpConnectionData(recvInfo, clientSocketId) {
  if (clientSocketId !== recvInfo.socketId) {
    return;
  }

  let httpMessage = arrayBufferToString(recvInfo.data);

  let requestData = {
    ...parseRequestMessage(httpMessage),
    originalMessage: httpMessage,
    clientSocketId: clientSocketId
  };

  log("Received from client: \r\n" + httpMessage);

  proxyRequest(requestData);
}

function getOnListenClientRequests(clientSocketId) {
  const handler = (recvInfo) => {
    if (recvInfo.resultCode < 0) {
      log('ERROR: could not receive client request. ' + chrome.runtime.lastError.message);
      chrome.sockets.tcp.onReceive.removeListener(handler);
      return;
    }
    onTcpConnectionData(recvInfo, clientSocketId);
  };
  return handler;
}

startApplication();