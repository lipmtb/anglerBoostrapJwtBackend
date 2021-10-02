const jwt = require('jsonwebtoken');
const mykey = "ttkpffsdfdsdsdsfsdgsgfdfddhfd45645455hgf4h5gf4hgf5h4gf5h5gfh45gfh4fg5h4fgh5fh5fg4hf5g4hf5h4f5gh4f5h4fh5f4h5fgh4f5gh4gf5h4gf5hf6hfg2hf62g66gd2gfd6g2fdg"; //secretKey 密钥，服务端验证


const createUserToken = (username, userid) => {

    return new Promise((resolve, reject) => {

        jwt.sign({
            name: "pmtb",
            username: username,
            userid: userid
        }, mykey, {
            algorithm: 'HS256',
            expiresIn: 24* 60 * 60
        }, (err, token) => {
            if (err) {
                reject(err);
            }
            resolve(token);

        });

    })
}



//验证token的方法,过期也会失败?!
const verifyTokenMyTest = (token) => {
    return new Promise((resolve, reject) => {
        if (!token) {
            reject(new Error("token is required"));
        } else {
            jwt.verify(token.split(" ")[1], mykey, function (err, payload) {
                if (err) {
                    reject(new Error("解析token失败"));
                }
                resolve(payload);
            });

        }

    })
}

module.exports = {
    createUserToken,
    verifyTokenMyTest,
    mykey
}

