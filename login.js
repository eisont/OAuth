const kakaoLoginButton = document.querySelector('#kakao');
const naverLoginButton = document.querySelector('#naver');
const userImage = document.querySelector('img');
const userName = document.querySelector('#user_name');
const logoutButton = document.querySelector('#logout_button');

let currentOAuthService = '';

function renderUserInfo(imgUrl, name) {
  userImage.src = imgUrl || '';
  userName.textContent = name || '';
}

// ===== 서버에서 채울 변수들 =====
let kakaoClientId = '';
const redirectURI = 'http://localhost:5500';
let kakaoAccessToken = '';

let naverClientId = '';
let naverClientSecret = '';
let naverSecret = '';
let naverAccessToken = '';

// 키 로드 + 초기화
async function init() {
  try {
    const { data } = await axios.get('http://localhost:3000/api-key');
    kakaoClientId = data.kakaoClientId;
    naverClientId = data.naverClientId;
    naverClientSecret = data.naverClientSecret;
    naverSecret = data.naverSecret;

    // 키를 받은 뒤에만 버튼 활성화 & 핸들러 등록
    kakaoLoginButton.disabled = false;
    naverLoginButton.disabled = false;

    kakaoLoginButton.onclick = () => {
      location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}` + `&redirect_uri=${encodeURIComponent(redirectURI)}&response_type=code`;
    };

    naverLoginButton.onclick = () => {
      location.href =
        `https://nid.naver.com/oauth2.0/authorize?client_id=${naverClientId}` + `&response_type=code&redirect_uri=${encodeURIComponent(redirectURI)}&state=${encodeURIComponent(naverSecret)}`;
    };

    // URL 파라미터 처리
    const url = new URL(location.href);
    const authorizationCode = url.searchParams.get('code');
    const naverState = url.searchParams.get('state');

    if (authorizationCode) {
      if (naverState) {
        // NAVER
        const login = await axios.post('http://localhost:3000/naver/login', { authorizationCode });
        naverAccessToken = login.data;
        const info = await axios.post('http://localhost:3000/naver/userinfo', { naverAccessToken });
        renderUserInfo(info.data.profile_image, info.data.name);
        currentOAuthService = 'naver';
      } else {
        // KAKAO
        const login = await axios.post('http://localhost:3000/kakao/login', { authorizationCode });
        kakaoAccessToken = login.data;
        const info = await axios.post('http://localhost:3000/kakao/userinfo', { kakaoAccessToken });
        renderUserInfo(info.data.profile_image, info.data.nickname);
        currentOAuthService = 'kakao';
      }
    }

    // 로그아웃
    logoutButton.onclick = async () => {
      if (currentOAuthService === 'kakao') {
        const res = await axios.delete('http://localhost:3000/kakao/logout', { data: { kakaoAccessToken } });
        console.log(res.data);
      } else if (currentOAuthService === 'naver') {
        const res = await axios.delete('http://localhost:3000/naver/logout', { data: { naverAccessToken } });
        console.log(res.data);
      }
      renderUserInfo('', '');
      currentOAuthService = '';
      history.replaceState(null, '', location.pathname); // URL 정리
    };
  } catch (e) {
    console.error('키 불러오기 실패:', e);
    alert('설정 키를 불러오지 못했습니다. 서버 확인하세요.');
  }
}

window.addEventListener('DOMContentLoaded', init);
