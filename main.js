'use strict';

const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs/promises');
const Handlebars = require('handlebars');
const { marked } = require('marked');

http.createServer((req, res) => {
  const { method, url } = req;

  if (method === 'GET' && url === '/') {
    const headers = {
      'Content-Type':'text/html'
    }
    res.writeHead(200, headers);
    postsList(res);
  }
  else if (method === 'GET' && url.split('/')[1] === 'posts') {
    const postID = url.split('/')[2];
    postFormat(postID, res);
  }
  else {
    const headers = {
      'Content-Type':'text/html'
    }
    res.writeHead(200, headers);
    res.end(`<h1>you sent something else: ${url}</h1>`);
  }

}).listen(8080);


async function postsList(res) {
  try {
    const data = await fs.readFile('templates/index.html', 'utf8');
    const template = Handlebars.compile(data);
    const posts = await fs.readdir('./postsData', 'utf8');
    console.log(posts);

    let REALData = { posts : [ ] };
    for (const postFileName of posts) {
      const postFilePath = path.join(__dirname, './postsData' , postFileName)
      const postContent = await fs.readFile(postFilePath , 'utf8' );
      REALData.posts.push(JSON.parse(postContent));
    }
    console.log(REALData.posts);
    res.end(template(REALData));
  }
  catch (err) {
    res.end(`<h1>some error ${err}</h1>`);
  }
}

async function postFormat(postID, res) {
  try {
    const data = await fs.readFile('templates/post.html', 'utf8');
    const template = Handlebars.compile(data);

    const postFilePath = path.join(__dirname, './postsData', postID + '.json');
    const postFile = await fs.readFile(postFilePath, 'utf8');
    const postContents = JSON.parse(postFile);
    //parse markdown string to HTML content
    postContents.contents = marked.parse(postContents.contents);
    res.end(template(postContents));
  }
  catch (err) {
    res.end(`<h1>some error ${err}</h1>`);
  }
}
