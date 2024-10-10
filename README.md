# What is this

a [roadmap.sh project](https://roadmap.sh/projects/personal-blog) of a (mostly) Server Sided rendered blog plataform with ***NO framework whatsoever***, which i'm currently bulding to learn nodejs and js on a backend context, everything besides admin pages are server rendered with [handlebars](https://handlebarsjs.com/) and [marked](https://marked.js.org/).

It is full of unsafe code like unsanitized marker parses and basic HTTP authentication on a http connection (with the password right on the code) so don't run this outside your local machine!

---

# How run
1. clone the repo
2. download the dependencies
```console
npm i
```
3. run the main.js file to open the server
```console
npm start
```
4. explore in http://localhost:8080

append `/admin` to the url to edit posts and all

