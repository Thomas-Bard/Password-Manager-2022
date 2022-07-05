const http  = require("http");
const uuid = require('uuid');
const { createHash } = require('crypto');
const {Server} = require("socket.io");

const qs = require("querystring");

const uuidv4 = uuid.v4;

const fs = require("fs");

let connectedUsers = [];

let last_error = "";

function GetConnectedUser(ip) {
    for (let i of connectedUsers) {
        if (i.ip === ip) {
            return i;
        }
    }
    return false;
}

function CreateUser(username, password) {
    let currentUser = {};
    currentUser["username"] = username;
    currentUser["id"] = uuidv4().toUpperCase();
    const user_table = fs.readFileSync("users/user_table.json").toString();
    let user_table_json = JSON.parse(user_table);
    let loop_back = false;
    do {
        for (let j of user_table_json) {
            if (j.id === currentUser.id) {
                currentUser.id = uuidv4().toUpperCase();
                loop_back = true;
                break;
            }
            if (j.username == currentUser.username) {
                last_error = "Username already exists";
                return false;
            }
        }
        break;
    } while (loop_back);
    
    user_table_json.push(currentUser);
    console.log(user_table_json);
    user_table_json = JSON.stringify(user_table_json);
    currentUser["passwords"] = [];
    let id = new String(currentUser.id);
    delete currentUser.username;
    delete currentUser.id;
    currentUser["password"] = createHash('sha512').update(password).digest('hex').toUpperCase();
    fs.writeFileSync(`users/${id}`, JSON.stringify(currentUser));
    fs.writeFileSync("users/user_table.json", user_table_json);
    return true;
}

function CheckUser(username, password) {
    let user_table = fs.readFileSync("users/user_table.json").toString();
    let user_table_json = JSON.parse(user_table);
    for (let j of user_table_json) {
        if (j.username == username) {
            let user = fs.readFileSync(`users/${j.id}`).toString();
            let user_json = JSON.parse(user);
            if (user_json.password == createHash('sha512').update(password).digest('hex').toUpperCase()) {
                return j.id;
            }
        }
    }
    return false;
}

function CheckUrl(url) {
    // Check if url leads to users folder
    if (url.includes("users")) {
        last_error = "Url is not allowed";
        return false;
    }
    //Check if url has no extension if not add .html
    if (!url.includes(".")) {
        url += ".html";
    }
    // Check if url leads to a file
    if (!fs.existsSync(url)) {
        last_error = "Url not found";
        return false;
    }
    return true;
}

function AddPassword(username, password, password_value, password_name, email) {
    const user_table = fs.readFileSync("users/user_table.json").toString();
    const user_table_json = JSON.parse(user_table);
    let user_id = "";
    for (let j of user_table_json) {
        if (j.username === username) {
            user_id = j.id;
        }
    }
    if (user_id === "") {
        last_error = "User not found";
        return false;
    }
    let user_content = "";
    try {
        user_content = fs.readFileSync(`users/${user_id}`).toString();
    } catch (e) {
        last_error = "User file not found";
        return false;
    }
    user_content = JSON.parse(user_content);
    if (createHash('sha512').update(password).digest('hex').toUpperCase() != user_content.password) {
        last_error = "Invalid password";
        return false;
    }
    user_content.passwords.push({name: password_name, password: password_value, email: email});
    fs.writeFileSync(`users/${user_id}`, JSON.stringify(user_content));
    return true;
}

function GetPasswords(username, password) {
    const user_table = fs.readFileSync("users/user_table.json").toString();
    const user_table_json = JSON.parse(user_table);
    let user_id = "";
    for (let j of user_table_json) {
        if (j.username === username) {
            user_id = j.id;
        }
    }
    if (user_id === "") {
        last_error = "User not found";
        return false;
    }
    let user_content = "";
    try {
        user_content = fs.readFileSync(`users/${user_id}`).toString();
    } catch (e) {
        last_error = "User file not found";
        return false;
    }
    user_content = JSON.parse(user_content);
    if (createHash('sha512').update(password).digest('hex').toUpperCase() != user_content.password) {
        last_error = "Invalid password";
        return false;
    }
    return user_content.passwords;
}

function DeletePassword(username, password, password_name) {
    const user_table = fs.readFileSync("users/user_table.json").toString();
    const user_table_json = JSON.parse(user_table);
    let user_id = "";
    for (let j of user_table_json) {
        if (j.username === username) {
            user_id = j.id;
        }
    }
    if (user_id === "") {
        last_error = "User not found";
        return false;
    }
    let user_content = "";
    try {
        user_content = fs.readFileSync(`users/${user_id}`).toString();
    } catch (e) {
        last_error = "User file not found";
        return false;
    }
    user_content = JSON.parse(user_content);
    if (createHash('sha512').update(password).digest('hex').toUpperCase() != user_content.password) {
        last_error = "Invalid password";
        return false;
    }
    let passwords = user_content.passwords;
    for (let i = 0; i < passwords.length; i++) {
        if (passwords[i].name === password_name) {
            passwords.splice(i, 1);
            break;
        }
    }
    fs.writeFileSync(`users/${user_id}`, JSON.stringify(user_content));
    return true;
}

let server = http.createServer((req, res) => {
    let WORKING_DIR = "frontend/";
    if (req.url == "/") {
        req.url = "index.html";
    }

    if (req.url == "/create_account") {
        let body = "";
        req.on("data", (data) => {
            body += data;
        });
        req.on("end", () => {
            let data = qs.parse(body);
            if (CreateUser(data.register, data.password)) {
                res.writeHead(200, {
                    "Content-Type": "text/html"
                });
                res.end(fs.readFileSync("frontend/redirect_dashboard.html"));
                connectedUsers.push({username: data.register, password: data.password, ip: req.connection.remoteAddress});
            } else {
                res.writeHead(400, {
                    "Content-Type": "text/html"
                });
                res.end(fs.readFileSync("frontend/error_user.html"));
            }
        });
        return;
    }
    if (req.url == "/connect") {
        let body = "";
        req.on("data", (data) => {
            body += data;
        });
        req.on("end", () => {
            let data = qs.parse(body);
            if (CheckUser(data.login, data.password)) {
                res.writeHead(200, {
                    "Content-Type": "text/html"
                });
                res.end(fs.readFileSync("frontend/redirect_dashboard.html"));
                connectedUsers.push({username: data.login, password: data.password, ip: req.connection.remoteAddress});
            } else {
                res.writeHead(400, {
                    "Content-Type": "text/html"
                });
                res.end(fs.readFileSync("frontend/error_user.html"));
            }
        });
        return;
    }
    if (req.url == "/dashboard") {
        for (let j of connectedUsers) {
            if (j.ip == req.connection.remoteAddress) {
                res.writeHead(200, {
                    "Content-Type": "text/html"
                });
                res.end(fs.readFileSync("frontend/dashboard.html"));
                return;
            }
        }
        res.writeHead(403, {
            "Content-Type": "text/html"
        });
        res.end(fs.readFileSync("frontend/not_allowed.html"));
        return;
    }
    if (req.url.split(".").length === 1) {
        req.url = `${req.url}.html`;
    }
    if (!CheckUrl(WORKING_DIR + req.url)) {
        if (last_error == "Url not found") {
            res.writeHead(404, {"Content-Type": "text/html"});
            res.end(fs.readFileSync("frontend/redirect_to_404.html"));
        } else {
            res.writeHead(403, {"Content-Type": "text/html"});
            res.end(fs.readFileSync("frontend/redirect_to_403.html"));
        }
    }
    
    fs.readFile(WORKING_DIR + req.url, (err, data) => {
        if (err) {
            res.writeHead(500, {"Content-Type": "text/html"});
            res.end(fs.readFileSync("frontend/server_error.html"));
        } else {
            let ctype = {};
            if (req.url.endsWith(".css")) {
                ctype = {"Content-Type": "text/css"};
            } else if (req.url.endsWith(".js")) {
                ctype = {"Content-Type": "text/javascript"};
            } else if (req.url.endsWith(".html")) {
                ctype = {"Content-Type": "text/html"};
            } else if (req.url.endsWith(".png")) {
                ctype = {"Content-Type": "image/png"};
            } else if (req.url.endsWith(".jpg")) {
                ctype = {"Content-Type": "image/jpg"};
            } else if (req.url.endsWith(".ico")) {
                ctype = {"Content-Type": "image/x-icon"};
            } else if (req.url.endsWith(".svg")) {
                ctype = {"Content-Type": "image/svg+xml"};
            } else if (req.url.endsWith(".json")) {
                ctype = {"Content-Type": "application/json"};
            } else {
                ctype = {"Content-Type": "text/plain"};
            }
            res.writeHead(200, ctype);
            res.end(data);
        }
    });
});

let io = new Server(server);

io.on("connection", (socket) => {
    let user = GetConnectedUser(socket.handshake.address);
    console.log(`User ${user.username} connected`);
    socket.emit("passwords", GetPasswords(user.username, user.password));
    socket.on("add_password", (data) => {
        AddPassword(user.username, user.password, data.password, data.name, data.email);
    });
    socket.on("remove_password", (data) => {
        DeletePassword(user.username, user.password, data);
    });
    socket.on("disconnect", () => {
        console.log(`User ${user.username} disconnected`);
        connectedUsers.splice(connectedUsers.indexOf(user), 1);
    });
});

server.listen(8080);