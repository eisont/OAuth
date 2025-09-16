const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const kakaoClientId = process.env.KAKAO_CLIENT_ID;
const redirectURI = 'http://localhost:5500';

const naverClientId = process.env.NAVER_CLIENT_ID;
const naverClientSecret = process.env.NAVER_CLIENT_SECRET;
const naverSecret = process.env.NAVER_SECRET;

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    method: ['OPTIONS', 'POST', 'DELETE', 'GET'],
  })
);
app.use(express.json());

app.get('/api-key', (req, res) => {
  res.json({ kakaoClientId, naverClientId, naverClientSecret, naverSecret });
});

app.post('/kakao/login', (req, res) => {
  const authorizationCode = req.body.authorizationCode;
  axios
    .post(
      'https://kauth.kakao.com/oauth/token',
      {
        grant_type: `authorization_code`,
        client_id: kakaoClientId,
        redirect_uri: redirectURI,
        code: authorizationCode,
      },
      {
        headers: { 'Content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
      }
    )
    .then((response) => res.send(response.data.access_token));
});

app.post('/naver/login', (req, res) => {
  const authorizationCode = req.body.authorizationCode;
  axios
    .post(
      `https://nid.naver.com/oauth2.0/token?client_id=${naverClientId}&client_secret=${naverClientSecret}&grant_type=authorization_code&state=${naverSecret}&code=${authorizationCode}
`
    )
    .then((response) => res.send(response.data.access_token));
});

app.post('/kakao/userinfo', (req, res) => {
  const { kakaoAccessToken } = req.body;

  axios
    .get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${kakaoAccessToken}`,
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    })
    .then((response) => res.json(response.data.properties));
});

app.post('/naver/userinfo', (req, res) => {
  const { naverAccessToken } = req.body;

  axios
    .get('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${naverAccessToken}`,
      },
    })
    .then((response) => res.json(response.data.response));
});

app.delete('/kakao/logout', (req, res) => {
  const { kakaoAccessToken } = req.body;
  axios
    .post(
      'https://kapi.kakao.com/v1/user/logout',
      {},
      {
        headers: { Authorization: `Bearer ${kakaoAccessToken}` },
      }
    )
    .then((response) => res.send('로그아웃 성공'));
});

app.delete('/naver/logout', (req, res) => {
  const { naverAccessToken } = req.body;
  axios
    .post(`https://nid.naver.com/oauth2.0/token?grant_type=delete&client_id=${naverClientId}&client_secret=${naverClientSecret}&access_token=${naverAccessToken}&service_provider=NAVER`)
    .then((response) => res.send('로그아웃 성공'));
});

app.listen(3000, () => console.log('서버 열림!'));
