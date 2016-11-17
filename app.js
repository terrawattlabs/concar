const express = require('express');
const session = require('express-session');

var request = require('request');
var url = require('url');
const port = process.env.PORT || 3000;
const app = express();

// Add your automatic client id and client secret here or as environment variables
const AUTOMATIC_CLIENT_ID = process.env.AUTOMATIC_CLIENT_ID || 'e2a8e01cbed8378693d5';
const AUTOMATIC_CLIENT_SECRET = process.env.AUTOMATIC_CLIENT_SECRET || '8dc63ba465926f9f18954a4726ce76e400b3a38d';

const oauth2 = require('simple-oauth2')({
  clientID: "e2a8e01cbed8378693d5",
  clientSecret: "8dc63ba465926f9f18954a4726ce76e400b3a38d",
  site: 'https://accounts.automatic.com',
  tokenPath: '/oauth/access_token'
});

// Authorization uri definition
const authorizationUri = oauth2.authCode.authorizeURL({
  scope: 'scope:user:profile scope:trip scope:location scope:vehicle:profile scope:vehicle:events scope:behavior'
});

// Enable sessions
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

// Initial page redirecting to Automatic's oAuth page
app.get('/auth', (req, res) => {
  res.redirect(authorizationUri);
});

// Callback service parsing the authorization token and asking for the access token
app.get('/redirect', (req, res) => {
  const code = req.query.code;

  function saveToken(error, result) {
    if (error) {
      console.log('Access token error', error.message);
      res.send('Access token error: ' +  error.message);
      return;
    }

    // Attach `token` to the user's session for later use
    // This is where you could save the `token` to a database for later use
    req.session.token = oauth2.accessToken.create(result);

    res.redirect('/welcome');
  }

  oauth2.authCode.getToken({
    code: code
  }, saveToken);
});

app.get('/welcome', (req, res) => {

  if (req.query.code) {
    // Display token to authenticated user
    //console.log('Automatic access token', req.session.token.token.access_token);
    
    var automatic_code = req.query.code;

      
    request.post({url:'https://app.asana.com/-/oauth_token', 
      body: {
                  grant_type: 'authorization_code',
                  client_id: 'e2a8e01cbed8378693d5',
                  client_secret: '8dc63ba465926f9f18954a4726ce76e400b3a38d',
                  code: automatic_code
              }}, 
      function(err,httpResponse,body){

        console.log(httpResponse);
        //var jsonbody = JSON.parse(body);
       // console.log(jsonbody);


        output(httpResponse,err);
    });

    

     
     //res.send("Here is the code I got - " + automatic_code);

  } else {
    // No token, so redirect to login
    res.redirect('/');
  };

  function output(d,err){
      res.status(200).json(d);
      
    };

});



// Main page of app with link to log in
app.get('/', (req, res) => {
  res.send('<a href="/auth">Log in with Automatic</a>');
});

// Start server
app.listen(port);

console.log('Express server started on port ' + port);
