### LPFR to TaxCre API

####**Request Authentication Token**

Endpoints:
https://api.sandbox.taxcore.online/api/v3/sdc/token

Method: GET

Header: 

`Accept: application/json`

Response: 

token (string)

The Token is valid for 8 hours by default. An Client uses the current token when calling all other services exposed by TaxCore.API.

expiresAt (string)

Date and time of token expiration. When a token expires a Client must requests a new token. If Client requests a new token while the current token is still valid, TaxCore will return the current token.

Example: 

`{
"token": "245ebd69-1438-4dc3-a65b-18f1a527f093",
"expiresAt": "2020-12-23 15:18:33Z"
}`

---

####**Get Initialization Commands**


