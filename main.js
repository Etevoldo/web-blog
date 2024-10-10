'use strict';

const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs/promises');
const { createWriteStream, createReadStream } = require('node:fs');
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
  } // render specific post on the request /posts/number
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
  } // update post page
  else if (method === 'GET'
           && url.split('/')[1] === 'edit'
           && req.headers['authorization']) {
    // get authorization credendial (second word of authorization value)
    const credentials = req.headers['authorization'].split(' ')[1];
    // YWxhZGRpbjpvcGVuc2VzYW1l is aladdin:opensesame, just for testing
    if (!(credentials === 'YWxhZGRpbjpvcGVuc2VzYW1l')) {
      res.writeHead(401);
      res.end('access denied!\nWrong credentials!');
      return;
    }
    const headers = {
      'Content-Type':'text/html'
    }

    res.writeHead(200, headers);
    editFormat(url.split('/')[2])
      .then((data) => res.end(data));
  } // new post page, slight variation of update post page
  else if (method === 'GET'
           && url.split('/')[1] === 'new'
           && req.headers['authorization']) {
    // get authorization credendial (second word of authorization value)
    const credentials = req.headers['authorization'].split(' ')[1];
    // YWxhZGRpbjpvcGVuc2VzYW1l is aladdin:opensesame, just for testing
    if (!(credentials === 'YWxhZGRpbjpvcGVuc2VzYW1l')) {
      res.writeHead(401);
      res.end('access denied!\nWrong credentials!');
      return;
    }
    const headers = {
      'Content-Type':'text/html'
    }
    const newPostPath = path.join(__dirname, '/templates/postNew.html');
    const newPostDocument = createReadStream(newPostPath);
    res.writeHead(200, headers);

    newPostDocument.pipe(res)
    newPostDocument.on('end', () => {
      res.end();
    });
  }
  else if (method === 'GET' && url === '/admin') {
    const headers = {
      'WWW-Authenticate': 'Basic'
    }
    res.writeHead(401, headers);
    res.end('Admin only');
  } // Update post
  else if (method === 'PUT'
           && url.split('/')[1] === 'edit'
           && req.headers['authorization']) {
    const credentials = req.headers['authorization'].split(' ')[1];
    if (!(credentials === 'YWxhZGRpbjpvcGVuc2VzYW1l')) {
      res.writeHead(401);
      res.end('access denied!\nWrong credentials!');
    }
    const headers = {'Content-Type':'text/plain'};
    res.writeHead(200, headers);

    const postID = url.split('/')[2];
    const postFilePath = path.join(__dirname, './postsData', postID + '.json');
    const postToUpdate = createWriteStream(postFilePath);
    req.pipe(postToUpdate);
    req.on('end', () => {
      console.log(`updated ${postFilePath}`); // debug
      res.end(`updated ${postFilePath}`);
    });
  }
  else if (method === 'DELETE'
           && url.split('/')[1] === 'edit'
           && req.headers['authorization']) {
    const credentials = req.headers['authorization'].split(' ')[1];
    if (!(credentials === 'YWxhZGRpbjpvcGVuc2VzYW1l')) {
      res.writeHead(401);
      res.end('access denied!\nWrong credentials!');
    }
    const headers = {'Content-Type':'text/plain'};
    res.writeHead(200, headers);

    const postID = url.split('/')[2];
    const postFilePath = path.join(__dirname, './postsData', postID + '.json');
    fs.unlink(postFilePath)
      .then(err => {
        if (err)
          res.end(`error deleting ${postFilePath}`);
        else
          res.end(`deleted ${postFilePath}`);
      });
  }
  else if (method === 'POST'
           && url.split('/')[1] === 'new'
           && req.headers['authorization']) {
    const credentials = req.headers['authorization'].split(' ')[1];
    if (!(credentials === 'YWxhZGRpbjpvcGVuc2VzYW1l')) {
      res.writeHead(401);
      res.end('access denied!\nWrong credentials!');
    }

    let body = ''; // get body data
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      newPost(body)
        .then(result => {
          res.writeHead(201, {'Content-Type':'text/plain'});
          res.end(result)
        })
        .catch(err => {
          res.writeHead(500, {'Content-Type':'text/plain'});
          res.end(result)
        })
    });

  }
  else {
    const headers = {
      'Content-Type':'text/plain'
    }
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      res.writeHead(200, headers);
      // debug info
      res.end(`you sent something else: ${url}
      Method: ${method}\nbody: ${body}`);
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

async function newPost(body) {
  const postsQuantity = (await fs.readdir('./postsData', 'utf8')).length + 1;
  const postFilePath = './postsData/' + postsQuantity + '.json';

  const newPostObj = JSON.parse(body);
  newPostObj.id = postsQuantity;
  await fs.writeFile(postFilePath, JSON.stringify(newPostObj));
  return `New post written on ${postFilePath}`;
}
