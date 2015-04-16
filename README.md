# datagather
Data Gather server for scientific projects,
this is a simple webservice with a self-signed certificate
that saves anonymous information (wifi or location) in
a mongoDB instance.

Dependencies: node >= 0.12 and all in package.json

To install use:
```
npm install
```

To run the server use:
```
npm start PORT
```

The server will listen in the PORT argument or 8443 by default
if no PORT is given

You need to make a SSL key (if self-signed)
and certificate, can easily be done using
openssl like:
```
openssl genrsa -des3 -out server.key 4096 #creates key
openssl req -new -key server.key -out server.csr #creates a signing request
openssl rsa -in server.key -out server.key #removes the password
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt #generate a self-signed request
```

Server routes:

GET /me
```
    Will return 403 if not authenticated or
    some of users data
```

POST /auth
```
    Will log in or create a user with the json data
    like:
    {
        username: "username",
        password: "password"
    }
    if there's an error (invalid password for example)
    return 403
```

GET /lastLocation
```
    return {timestamp: "last unix epoch location timestamp"
```


GET /lastWifi
```
    return {timestamp: "last unix epoch wifi timestamp"
```

POST /addLocation
```
    Add json data:
    [{
        lat: "Decimal Latitude",
        lon: "Decimal Longitude",
        timestamp: "unix epoch timestamp"
    }]
    returns {status: Done} and 200 status code if correct

```

POST /addWifi
```
    Add json data:
    [{
        name: "bssid1:power1, bssid2:power2, ...",
        timestamp: "unix epoch timestamp"
    }]
    returns {status: Done} and 200 status code if correct

```

All the data is inserted ordered in BD, doesn't matter if they're
not at /addLocation or /addWifi

Running ./scripts/getResults.js can save space in DB.
