import express from 'express';
import cors from 'cors';
import { StoreLibrary } from './src/store/StoreServer.js'
import { test1 } from './src/store/test.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
 
// create application/json parser
var jsonParser = bodyParser.json()
 
// create application/x-www-form-urlencoded parser
// var urlencodedParser = bodyParser.urlencoded({ extended: false })

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express()
const port = 3000

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

app.use(cors());
app.use(express.static(__dirname + '/dist'));

app.get("/api/hello", (req, res) => {
    res.json({ hello: "world!!" });
});

const lib = new StoreLibrary();
let x = test1;
console.log(x);

app.post("/api/sync", jsonParser, (req, res) => {
  const sessionID = req.query.sessionID as string;
  const body = req.body;
  console.log(sessionID, body);
  res.json(lib.handle(sessionID, body));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})