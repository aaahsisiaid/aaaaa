import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js";

export const firebaseConfig = {
    apiKey: "AIzaSyAuSr-KgBjfvp-yroLH2X0tujZaUenFVsY",
    authDomain: "boxwood-spot-486909-j1.firebaseapp.com",
    projectId: "boxwood-spot-486909-j1",
    storageBucket: "boxwood-spot-486909-j1.firebasestorage.app",
    messagingSenderId: "899371812603",
    appId: "1:899371812603:web:ced1901f7a3abb5e0e125e"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const functions = getFunctions(app, "us-central1");

// 管理者クレーム(admin:true)を持つログイン済みユーザーのみ onReady を呼ぶ。
// それ以外は admin-login.html へ追い返す。
export function requireAdmin(onReady) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "admin-login.html";
            return;
        }
        try {
            const tokenResult = await user.getIdTokenResult(true);
            if (tokenResult.claims.admin !== true) {
                alert("管理者権限がありません。");
                await signOut(auth);
                window.location.href = "admin-login.html";
                return;
            }
            onReady(user, tokenResult);
        } catch (e) {
            console.error("管理者権限の確認に失敗:", e);
            window.location.href = "admin-login.html";
        }
    });
}

// 管理者用Cloud Functionsの共通呼び出しヘルパー
// token以外のフィールドは他のページ（mypage.html等）と同じくフラットに乗せる
// （サーバー側 getAuthedAdmin/unwrap は request.data を1段だけ取り出す実装のため、
//   ここでさらに data: {...} と入れ子にすると中身が1段深くなり、サーバー側で届かなくなる）
export async function callAdmin(name, payload) {
    const idToken = await auth.currentUser.getIdToken(true);
    const fn = httpsCallable(functions, name);
    const result = await fn({ token: idToken, ...(payload || {}) });
    return result.data;
}

export async function adminLogout() {
    try {
        await signOut(auth);
    } finally {
        window.location.href = "admin-login.html";
    }
}
