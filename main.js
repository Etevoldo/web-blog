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
  } // mock response for random url
  else {
    const headers = {
      'Content-Type':'text/html'
    }
    res.writeHead(200, headers);
    res.end(`<h1>you sent something else: ${url}</h1>`);
  }

}).listen(8080);


async function postsList() {
  try {
    const data = await fs.readFile('templates/index.html', 'utf8');
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
