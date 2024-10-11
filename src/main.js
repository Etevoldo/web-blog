'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("node:http");
var path = require("node:path");
var fs = require("node:fs/promises");
var node_fs_1 = require("node:fs");
var Handlebars = require("handlebars");
var marked_1 = require("marked");
console.log(__dirname);
http.createServer(function (req, res) {
    var method = req.method, url = req.url;
    // list all posts
    if (method === 'GET' && url === '/') {
        var headers = {
            'Content-Type': 'text/html'
        };
        res.writeHead(200, headers);
        postsList()
            .then(function (data) { return res.end(data); });
    } // render specific post on the request /posts/number
    else if (method === 'GET' && (url === null || url === void 0 ? void 0 : url.split('/')[1]) === 'posts') {
        var postID = url === null || url === void 0 ? void 0 : url.split('/')[2];
        var headers_1 = {
            'Content-Type': 'text/html'
        };
        postFormat(postID)
            .then(function (data) {
            res.writeHead(200, headers_1);
            res.end(data);
        })
            .catch(function (errorPage) {
            res.writeHead(404, headers_1);
            res.end(errorPage);
        });
    } // css files requests
    else if (method === 'GET' && url === '/home.css') {
        res.writeHead(200, { 'Content-Type': 'text/css' });
        var css = (0, node_fs_1.createReadStream)(path.join(__dirname, '../styles/home.css'));
        css.pipe(res);
        css.on('end', function () { return res.end(); });
    }
    else if (method === 'GET'
        && url === '/admin'
        && req.headers['authorization']) {
        var credentials = req.headers['authorization'].split(' ')[1];
        if (credentials !== 'YWxhZGRpbjpvcGVuc2VzYW1l') {
            res.writeHead(401);
            res.end('access denied!\nWrong credentials!');
            return;
        }
        res.writeHead(200);
        postsList(true)
            .then(function (data) { return res.end(data); });
    } // update post page
    else if (method === 'GET'
        && (url === null || url === void 0 ? void 0 : url.split('/')[1]) === 'edit'
        && req.headers['authorization']) {
        // get authorization credendial (second word of authorization value)
        var credentials = req.headers['authorization'].split(' ')[1];
        // YWxhZGRpbjpvcGVuc2VzYW1l is aladdin:opensesame, just for testing
        if (credentials !== 'YWxhZGRpbjpvcGVuc2VzYW1l') {
            res.writeHead(401);
            res.end('access denied!\nWrong credentials!');
            return;
        }
        var headers = {
            'Content-Type': 'text/html'
        };
        res.writeHead(200, headers);
        editFormat(url === null || url === void 0 ? void 0 : url.split('/')[2])
            .then(function (data) { return res.end(data); });
    } // new post page, slight variation of update post page
    else if (method === 'GET'
        && (url === null || url === void 0 ? void 0 : url.split('/')[1]) === 'new'
        && req.headers['authorization']) {
        // get authorization credendial (second word of authorization value)
        var credentials = req.headers['authorization'].split(' ')[1];
        // YWxhZGRpbjpvcGVuc2VzYW1l is aladdin:opensesame, just for testing
        if (credentials !== 'YWxhZGRpbjpvcGVuc2VzYW1l') {
            res.writeHead(401);
            res.end('access denied!\nWrong credentials!');
            return;
        }
        var headers = {
            'Content-Type': 'text/html'
        };
        var newPostPath = path.join(__dirname, '../templates/postNew.html');
        var newPostDocument = (0, node_fs_1.createReadStream)(newPostPath);
        res.writeHead(200, headers);
        newPostDocument.pipe(res);
        newPostDocument.on('end', function () {
            res.end();
        });
    }
    else if (method === 'GET' && url === '/admin') {
        var headers = {
            'WWW-Authenticate': 'Basic'
        };
        res.writeHead(401, headers);
        res.end('Admin only');
    } // Update post
    else if (method === 'PUT'
        && (url === null || url === void 0 ? void 0 : url.split('/')[1]) === 'edit'
        && req.headers['authorization']) {
        var credentials = req.headers['authorization'].split(' ')[1];
        if (credentials !== 'YWxhZGRpbjpvcGVuc2VzYW1l') {
            res.writeHead(401);
            res.end('access denied!\nWrong credentials!');
        }
        var headers = { 'Content-Type': 'text/plain' };
        res.writeHead(200, headers);
        var postID = url === null || url === void 0 ? void 0 : url.split('/')[2];
        var postPath_1 = path.join(__dirname, '../postsData', postID + '.json');
        var postToUpdate = (0, node_fs_1.createWriteStream)(postPath_1);
        req.pipe(postToUpdate);
        req.on('end', function () {
            console.log("updated ".concat(postPath_1)); // debug
            res.end("updated ".concat(postPath_1));
        });
    }
    else if (method === 'DELETE'
        && (url === null || url === void 0 ? void 0 : url.split('/')[1]) === 'edit'
        && req.headers['authorization']) {
        var credentials = req.headers['authorization'].split(' ')[1];
        if (credentials !== 'YWxhZGRpbjpvcGVuc2VzYW1l') {
            res.writeHead(401);
            res.end('access denied!\nWrong credentials!');
        }
        var headers = { 'Content-Type': 'text/plain' };
        res.writeHead(200, headers);
        var postID = url === null || url === void 0 ? void 0 : url.split('/')[2];
        var postPath_2 = path.join(__dirname, '../postsData', postID + '.json');
        fs.unlink(postPath_2)
            .then(function () { return res.end("deleted ".concat(postPath_2)); })
            .catch(function (err) { return res.end("Error deleting ".concat(postPath_2, ":\n").concat(err)); });
    }
    else if (method === 'POST'
        && (url === null || url === void 0 ? void 0 : url.split('/')[1]) === 'new'
        && req.headers['authorization']) {
        var credentials = req.headers['authorization'].split(' ')[1];
        if (credentials !== 'YWxhZGRpbjpvcGVuc2VzYW1l') {
            res.writeHead(401);
            res.end('access denied!\nWrong credentials!');
        }
        var body_1 = ''; // get body data
        req.on('data', function (chunk) {
            body_1 += chunk;
        });
        req.on('end', function () {
            newPost(body_1)
                .then(function (result) {
                res.writeHead(201, { 'Content-Type': 'text/plain' });
                res.end(result);
            })
                .catch(function (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(err);
            });
        });
    }
    else {
        var headers_2 = {
            'Content-Type': 'text/plain'
        };
        var body_2 = '';
        req.on('data', function (chunk) {
            body_2 += chunk;
        });
        req.on('end', function () {
            res.writeHead(200, headers_2);
            // debug info
            res.end("\n      You've sent something else: ".concat(url, "\n      Method: ").concat(method, "\nbody: ").concat(body_2, "\n      "));
        });
    }
}).listen(8080);
console.log("Server running at http://localhost:8080");
var postsDataPath = path.join(__dirname, '../postsData');
var templatesPath = path.join(__dirname, '../templates');
function postsList() {
    return __awaiter(this, arguments, void 0, function (isAdmin) {
        var templatePath, data, template, posts, postList, REALData, _i, posts_1, postFileName, postContent, finishedDocument, err_1;
        if (isAdmin === void 0) { isAdmin = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isAdmin)
                        templatePath = path.join(templatesPath, 'indexAdmin.html');
                    else
                        templatePath = path.join(templatesPath, 'index.html');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    return [4 /*yield*/, fs.readFile(templatePath, 'utf8')];
                case 2:
                    data = _a.sent();
                    template = Handlebars.compile(data);
                    return [4 /*yield*/, fs.readdir(postsDataPath, 'utf8')];
                case 3:
                    posts = _a.sent();
                    postList = [];
                    REALData = { "posts": postList };
                    _i = 0, posts_1 = posts;
                    _a.label = 4;
                case 4:
                    if (!(_i < posts_1.length)) return [3 /*break*/, 7];
                    postFileName = posts_1[_i];
                    return [4 /*yield*/, fs.readFile(path.join(postsDataPath, postFileName), 'utf8')];
                case 5:
                    postContent = _a.sent();
                    REALData.posts.push(JSON.parse(postContent));
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7:
                    finishedDocument = template(REALData);
                    return [2 /*return*/, finishedDocument];
                case 8:
                    err_1 = _a.sent();
                    return [2 /*return*/, "<h1>some error ".concat(err_1, "</h1>")];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function postFormat(postID) {
    return __awaiter(this, void 0, void 0, function () {
        var postTemplatePath, postTemplateRaw, postTemplate, postPath, postFile, postContents, finishedDocument, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    postTemplatePath = path.join(templatesPath, 'post.html');
                    return [4 /*yield*/, fs.readFile(postTemplatePath, 'utf8')];
                case 1:
                    postTemplateRaw = _a.sent();
                    postTemplate = Handlebars.compile(postTemplateRaw);
                    postPath = path.join(postsDataPath, postID + '.json');
                    return [4 /*yield*/, fs.readFile(postPath, 'utf8')];
                case 2:
                    postFile = _a.sent();
                    postContents = JSON.parse(postFile);
                    //parse markdown string to HTML content
                    postContents.contents = marked_1.marked.parse(postContents.contents);
                    finishedDocument = postTemplate(postContents);
                    return [2 /*return*/, finishedDocument];
                case 3:
                    err_2 = _a.sent();
                    // assuming the only thing that can go wrong is reading unexistent files
                    return [2 /*return*/, "<h1>404</h1><p>".concat(err_2, "</p>")];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function editFormat(postID) {
    return __awaiter(this, void 0, void 0, function () {
        var postTemplatePath, postTemplateRaw, postTemplate, postPath, postFileRaw, postObj, finishedDocument, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    postTemplatePath = path.join(templatesPath, 'postEdit.html');
                    return [4 /*yield*/, fs.readFile(postTemplatePath, 'utf8')];
                case 1:
                    postTemplateRaw = _a.sent();
                    postTemplate = Handlebars.compile(postTemplateRaw);
                    postPath = path.join(postsDataPath, postID + '.json');
                    return [4 /*yield*/, fs.readFile(postPath, 'utf8')];
                case 2:
                    postFileRaw = _a.sent();
                    postObj = JSON.parse(postFileRaw);
                    finishedDocument = postTemplate(postObj);
                    return [2 /*return*/, finishedDocument];
                case 3:
                    err_3 = _a.sent();
                    // assuming the only thing that can go wrong is reading unexistent files
                    return [2 /*return*/, "<h1>404</h1><p>".concat(err_3, "</p>")];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function newPost(body) {
    return __awaiter(this, void 0, void 0, function () {
        var postsQuantity, newPostID, newPostPath, newPostObj;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.readdir(postsDataPath, 'utf8')];
                case 1:
                    postsQuantity = _a.sent();
                    newPostID = postsQuantity.length + 1;
                    newPostPath = path.join(postsDataPath, newPostID + '.json');
                    newPostObj = JSON.parse(body);
                    newPostObj.id = postsQuantity;
                    return [4 /*yield*/, fs.writeFile(newPostPath, JSON.stringify(newPostObj))];
                case 2:
                    _a.sent();
                    return [2 /*return*/, "New post written on ".concat(newPostPath)];
            }
        });
    });
}
