'use strict';

const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs/promises');
const Handlebars = require('handlebars');
const { marked } = require('marked');

http.createServer((req, res) => {
  const { method, url } = req;
  // list all posts
  if (method === 'GET' && url === '/') {
    const headers = {
      'Content-Type':'text/html'
    }
    res.writeHead(200, headers);
    postsList()
      .then((data) => res.end(data));
  }
  // render specific post on the request /posts/number
  else if (method === 'GET' && url.split('/')[1] === 'posts') {
    const postID = url.split('/')[2];
    const headers = {
      'Content-Type':'text/html'
    }

    postFormat(postID)
      .then((data) => {
        res.writeHead(200, headers);
        res.end(data);
      })
      .catch((errorPage) =>{
        res.writeHead(404, headers);
        res.end(errorPage);
      });
  } // css files requests
  else if (method === 'GET' && url === '/home.css') {
    res.writeHead(200, {'Content-Type':'text/css'});
    fs.readFile('./styles/home.css')
      .then((data) => res.end(data));
  }
  else if (method === 'GET'
           && url === '/admin'
           && req.headers['authorization']) {
    // get authorization credendial (second word of authorization value)
    const credentials = req.headers['authorization'].split(' ')[1];
    // YWxhZGRpbjpvcGVuc2VzYW1l is aladdin:opensesame, just for testing
    if (!(credentials === 'YWxhZGRpbjpvcGVuc2VzYW1l')) {
      res.writeHead(401);
      res.end('access denied!\nWrong credentials!');
      return;
    }
    res.writeHead(200);
    postsList(true)
      .then((data) => res.end(data));
  }
  else if (method === 'GET'
           && url.split('/')[1] === 'edit'
           && req.headers['authorization']) {
    // get authorization credendial (second word of authorization value)
    const credentials = req.headers['authorization'].split(' ')[1];
    // YWxhZGRpbjpvcGVuc2VzYW1l is aladdin:opensesame, just for testing
    if (!(credentials === 'YWxhZGRpbjpvcGVuc2VzYW1l')) {
      res.writeHead(401);
      res.end('access denied!\nWrong credentials!');
    }
    editFormat(url.split('/')[2])
      .then((data) => res.end(data));
  }
  else if (method === 'GET' && url === '/admin') {
    const headers = {
      'WWW-Authenticate': 'Basic'
    }
    res.writeHead(401, headers);
    res.end('Admin only');
  }
  else {
    const headers = {
      'Content-Type':'text/html'
    }
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      res.writeHead(200, headers);
      // debug info
      res.end(`<h1>you sent something else: ${url}</h1><p>
      Method: ${method}body: ${decodeURIComponent(body)}</p>`);
    });
  }

}).listen(8080);


async function postsList(isAdmin=false) {
  let templatePath;
  if (isAdmin)
    templatePath = 'templates/indexAdmin.html';
  else
    templatePath = 'templates/index.html';

  try {
    const data = await fs.readFile(templatePath, 'utf8');
    const template = Handlebars.compile(data);
    const posts = await fs.readdir('./postsData', 'utf8');

    let REALData = { posts : [ ] };
    for (const postFileName of posts) {
      const postFilePath = path.join(__dirname, './postsData' , postFileName)
      const postContent = await fs.readFile(postFilePath , 'utf8' );
      REALData.posts.push(JSON.parse(postContent));
    }
    //parse handlebars expressions to finished document
    const finishedDocument = template(REALData);
    return finishedDocument;
  }
  catch (err) {
    return `<h1>some error ${err}</h1>`;
  }
}

console.log(`Server running at http://localhost:8080`);

async function postFormat(postID) {
  try {
    const data = await fs.readFile('templates/post.html', 'utf8');
    const template = Handlebars.compile(data);
    const postFilePath = path.join(__dirname, './postsData', postID + '.json');
    const postFile = await fs.readFile(postFilePath, 'utf8');
    const postContents = JSON.parse(postFile);

    //parse markdown string to HTML content
    postContents.contents = marked.parse(postContents.contents);
    //parse handlebars expressions to finished document
    const finishedDocument = template(postContents);

    return finishedDocument;
  }
  catch (err) {
    // assuming the only thing that can go wrong is reading unexistent files
    return `<h1>404</h1><p>${err}</p>`;
  }
}

async function editFormat(postID) {
  try {
    const data = await fs.readFile('templates/postEdit.html', 'utf8');
    const template = Handlebars.compile(data);
    const postFilePath = path.join(__dirname, './postsData', postID + '.json');
    const postFile = await fs.readFile(postFilePath, 'utf8');
    const postContents = JSON.parse(postFile);

    //parse handlebars expressions to finished document
    const finishedDocument = template(postContents);

    return finishedDocument;
  }
  catch (err) {
    // assuming the only thing that can go wrong is reading unexistent files
    return `<h1>404</h1><p>${err}</p>`;
  }
}
