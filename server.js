const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { sessions, addSession, deleteSession } = require('./session');
const auth = require('./auth');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 4000;

app.use(cors());
app.use(cookieParser());
app.use(express.static('./build'));

app.all("/*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

//check the login status
function check_login(req, res) {
    const sid = req.cookies.sid;
    if (!sid) {
        res.status(401).json({ code: 'LOGIN_REQUIRED' });
        return;
    }
    if (!sessions[sid]) {
        res.clearCookie('sid');
        res.status(403).json({ code: 'LOGIN_UNAUTHORIZED' });
        return;
    }
}

//get the session
app.get('/session', (req, res) => {
    check_login(req, res);
    res.status(200).json(sessions[sid]);
});

//reg one user
app.post('/session', express.json(), (req, res) => {
    const USER = req.body;
    res.clearCookie('sid');
    if (!USER.username) {
        res.status(400).json({ code: 'USERNAME_REQUIRED' });
        return;
    }
    if (!auth.isPermitted(USER.username)) {
        res.status(403).json({ code: 'LOGIN_UNAUTHORIZED' });
        return;
    }
    const session = addSession(USER);
    res.cookie('sid', session.id);

    //add the user to user collection
    USER.id = session.id;

    res.status(200).json(USER);
});

//get the product list
app.get('/product', (req, res) => {
	check_login(req, res);
    let pid = req.query.id || '';
    let name = req.query.name || '';

    var file = path.join(__dirname, 'data/product.json');


    //read json
    fs.readFile(file, 'utf-8', function(err, data) {
        if (err) {
            res.json({"code":1,"msg":"read json file error"})
        } else {
            if(pid){
                let product = JSON.parse(data);
                product.forEach(function (v,k) {
                    if(v.p_id === pid){
                        res.end(JSON.stringify({"code":0,"msg":"ok","data":[v]}));
                    }
                });
                res.end(JSON.stringify({"code":1,"msg":"The product doesn't exist"}));
            }else if(name){
                let product = JSON.parse(data);
                product.forEach(function (v,k) {
                    if(v.p_name.toLowerCase() === name.toLowerCase()){
                        res.end(JSON.stringify({"code":0,"msg":"ok","data":[v]}));
                    }
                });
                res.end(JSON.stringify({"code":1,"msg":"The product doesn't exist"}));
            }else{
                res.end(data);
            }
        }
    });
});

//add order
app.post('/order',express.json(),(req, res) => {
	check_login(req, res);
    var file = path.join(__dirname, 'data/order.json');

    let jsonData = [];
    //read json
    fs.readFile(file, 'utf-8', function(err, data) {
        if (err) {
            res.json({"code":1,"msg":"read json file error"})
        } else {
            //save order data
            if(!data){
                jsonData = JSON.stringify([]);
            }else{
                jsonData = data;
            }

            let order = JSON.parse(jsonData);

            order.push(req.body);

            fs.writeFile(file,JSON.stringify(order),{flag:'w',encoding:'utf-8',mode:'0666'},function(err){
                if(err){
                    res.end(JSON.stringify({"code":1,"msg":"failed !"}));
                }else{
                    res.end(JSON.stringify({"code":1,"msg":"success !"}));
                }
            });
        }
    });
});


app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
