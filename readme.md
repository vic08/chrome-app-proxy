### Launching the app for debugging:

1. Run `npm i`
2. Run `webpack`
3. Open chrome and load unpacked extension from `build` folder
4. Launch 'Simple proxy' app
5. Test proxy with a URL like this [http://localhost:5858/?url=https%3A%2F%2Fuser-media.screen.cloud%2Fpublic%2Fproduction%2F79d07f37-388f-4c51-9b71-f0a3815b2d4a%2Fprocessed%2F463dbe1d-ae9b-4ace-aedc-baec6fd5d8cc.mp4](http://localhost:5858/?url=https%3A%2F%2Fuser-media.screen.cloud%2Fpublic%2Fproduction%2F79d07f37-388f-4c51-9b71-f0a3815b2d4a%2Fprocessed%2F463dbe1d-ae9b-4ace-aedc-baec6fd5d8cc.mp4)

####List of necessary feature improvements:

* Add SSL support
* Ensure chunked responses are handled correctly according to RFC
* Add byte serving support
* Handle redirect responses (redirects should not be returned to client)
* Return 500 responses in case of app errors

####List of necessary code improvements:
* Implement a class for handling every client's connection, which will handle all client connection related bindings/events, destroy itself when connection is closed.
* Implement Request/Response classes. Parsed http request/response and all related data should be an instance of Request/Response, so that our data structures and methods will be documented in code
* Destroy client socket and target server socket if inactive (add timeout)