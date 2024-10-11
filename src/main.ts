'use strict';

import * as http from 'node:http';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { createWriteStream, createReadStream } from 'node:fs';
import * as Handlebars from 'handlebars';
import { marked } from 'marked';

console.log(__dirname);

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
  else if (method === 'GET' && url?.split('/')[1] === 'posts') {
    const postID = url?.split('/')[2];
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
    const css = createReadStream(path.join(__dirname, '../styles/home.css'));
    css.pipe(res);
    css.on('end', () => res.end() )
  }
  else if (method === 'GET'
           && url === '/admin'
           && req.headers['authorization']) {
    const credentials = req.headers['authorization'].split(' ')[1];
    if (credentials !== 'YWxhZGRpbjpvcGVuc2VzYW1l') {
      res.writeHead(401);
      res.end('access denied!\nWrong credentials!');
      return;
    }
    res.writeHead(200);
    postsList(true)
      .then((data) => res.end(data));
  } // update post page
  else if (method === 'GET'
           && url?.split('/')[1] === 'edit'
           && req.headers['authorization']) {
    // get authorization credendial (second word of authorization value)
    const credentials = req.headers['authorization'].split(' ')[1];
    // YWxhZGRpbjpvcGVuc2VzYW1l is aladdin:opensesame, just for testing
    if (credentials !== 'YWxhZGRpbjpvcGVuc2VzYW1l') {
      res.writeHead(401);
      res.end('access denied!\nWrong credentials!');
      return;
    }
    const headers = {
      'Content-Type':'text/html'
    }

    res.writeHead(200, headers);
    editFormat(url?.split('/')[2])
      .then((data) => res.end(data));
  } // new post page, slight variation of update post page
  else if (method === 'GET'
           && url?.split('/')[1] === 'new'
           && req.headers['authorization']) {
    // get authorization credendial (second word of authorization value)
    const credentials = req.headers['authorization'].split(' ')[1];
    // YWxhZGRpbjpvcGVuc2VzYW1l is aladdin:opensesame, just for testing
    if (credentials !== 'YWxhZGRpbjpvcGVuc2VzYW1l') {
      res.writeHead(401);
      res.end('access denied!\nWrong credentials!');
      return;
    }
    const headers = {
      'Content-Type':'text/html'
    }
    const newPostPath = path.join(__dirname, '../templates/postNew.html');
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
           && url?.split('/')[1] === 'edit'
           && req.headers['authorization']) {
    const credentials = req.headers['authorization'].split(' ')[1];
    if (credentials !== 'YWxhZGRpbjpvcGVuc2VzYW1l') {
      res.writeHead(401);
      res.end('access denied!\nWrong credentials!');
    }
    const headers = {'Content-Type':'text/plain'};
    res.writeHead(200, headers);

    const postID = url?.split('/')[2];
    const postPath = path.join(__dirname, '../postsData', postID + '.json');
    const postToUpdate = createWriteStream(postPath);
    req.pipe(postToUpdate);
    req.on('end', () => {
      console.log(`updated ${postPath}`); // debug
      res.end(`updated ${postPath}`);
    });
  }
  else if (method === 'DELETE'
           && url?.split('/')[1] === 'edit'
           && req.headers['authorization']) {
    const credentials = req.headers['authorization'].split(' ')[1];
    if (credentials !== 'YWxhZGRpbjpvcGVuc2VzYW1l') {
      res.writeHead(401);
      res.end('access denied!\nWrong credentials!');
    }
    const headers = {'Content-Type':'text/plain'};
    res.writeHead(200, headers);

    const postID = url?.split('/')[2];
    const postPath = path.join(__dirname, '../postsData', postID + '.json');
    fs.unlink(postPath)
      .then(() => res.end(`deleted ${postPath}`) )
      .catch(err => res.end(`Error deleting ${postPath}:\n${err}`));
  }
  else if (method === 'POST'
           && url?.split('/')[1] === 'new'
           && req.headers['authorization']) {
    const credentials = req.headers['authorization'].split(' ')[1];
    if (credentials !== 'YWxhZGRpbjpvcGVuc2VzYW1l') {
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
          res.end(err)
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
      res.end(`
      You've sent something else: ${url}
      Method: ${method}\nbody: ${body}
      `);
    });
  }

}).listen(8080);

console.log(`Server running at http://localhost:8080`);

const postsDataPath = path.join(__dirname, '../postsData');
const templatesPath = path.join(__dirname, '../templates');

async function postsList(isAdmin=false) {
  let templatePath;
  if (isAdmin)
    templatePath = path.join(templatesPath, 'indexAdmin.html');
  else
    templatePath = path.join(templatesPath, 'index.html');

  try {
    const data = await fs.readFile(templatePath, 'utf8');
    const template = Handlebars.compile(data);
    const posts = await fs.readdir(postsDataPath, 'utf8');

    type Post = {
      id: number;
      title: string;
      contents: string;
    };
    let postList: Post[] = [];

    let REALData = { "posts": postList };
    for (const postFileName of posts) {
      const postContent
          = await fs.readFile(path.join(postsDataPath, postFileName), 'utf8' );
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

async function postFormat(postID: string) {
  try {
    const postTemplatePath = path.join(templatesPath, 'post.html');
    const postTemplateRaw = await fs.readFile(postTemplatePath, 'utf8');
    const postTemplate = Handlebars.compile(postTemplateRaw);

    const postPath = path.join(postsDataPath, postID + '.json');
    const postFile = await fs.readFile(postPath, 'utf8');
    const postContents = JSON.parse(postFile);

    //parse markdown string to HTML content
    postContents.contents = marked.parse(postContents.contents);
    //parse handlebars expressions to finished document
    const finishedDocument = postTemplate(postContents);

    return finishedDocument;
  }
  catch (err) {
    // assuming the only thing that can go wrong is reading unexistent files
    return `<h1>404</h1><p>${err}</p>`;
  }
}

async function editFormat(postID: string) {
  try {
    const postTemplatePath = path.join(templatesPath, 'postEdit.html');
    const postTemplateRaw = await fs.readFile(postTemplatePath, 'utf8');
    const postTemplate = Handlebars.compile(postTemplateRaw);
    const postPath = path.join(postsDataPath, postID + '.json');
    const postFileRaw = await fs.readFile(postPath, 'utf8');
    const postObj = JSON.parse(postFileRaw);

    //parse handlebars expressions to finished document
    const finishedDocument = postTemplate(postObj);

    return finishedDocument;
  }
  catch (err) {
    // assuming the only thing that can go wrong is reading unexistent files
    return `<h1>404</h1><p>${err}</p>`;
  }
}

async function newPost(body: string) {
  const postsQuantity = await fs.readdir(postsDataPath, 'utf8');
  const newPostID = postsQuantity.length + 1;
  const newPostPath = path.join(postsDataPath, newPostID + '.json');
  const newPostObj = JSON.parse(body);

  newPostObj.id = postsQuantity;
  await fs.writeFile(newPostPath, JSON.stringify(newPostObj));
  return `New post written on ${newPostPath}`;
}
