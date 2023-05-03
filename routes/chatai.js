const bodyParser = require("body-parser");
let express = require('express');
let router = express.Router();
const axios = require("axios");
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// openaiapi
router.post("/gptai", bodyParser.json(), (req, res) => {
    const content = req.body.content;
    const apiKey = req.body.apiKey || "";
    if (!apiKey) {
        res.send({
            errCode: 1,
            message: "请输入apiKey"
        })
        return;
    }
    const requestConfig = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey
        },
    };
    axios.post(OPENAI_URL, {
        "model": "gpt-3.5-turbo",
        "messages": [{ "role": "user", "content": content }],
        "temperature": "0.7"
    }, requestConfig).then(response => {
        console.log("请求成功", response);
        res.send({
            errCode: 0,
            choices: response.choices,
            message: "成功"
        })
    }).catch(error => {
        console.error("请求失败", error);
        res.send({
            choices: null,
            errCode: 1,
            message: "失败"
        })
    });
})

module.exports = router;