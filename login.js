// login.js

document.addEventListener("DOMContentLoaded", function() {
    const authScreen = document.getElementById("authScreen");
    const btnLogin = document.getElementById("btnLogin");
    const btnLogout = document.getElementById("btnLogout");
    const userArea = document.getElementById("userArea");
    const userNick = document.getElementById("userNick");
    
    // تحقق من حالة الدخول عند تحميل الصفحة
    if (localStorage.getItem("isLoggedIn") === "true") {
        showUserArea();
    }
    
    // عند الضغط على زر الدخول
    btnLogin.addEventListener("click", function() {
        const nickname = document.getElementById("nickname").value.trim();
        const email = document.getElementById("email").value.trim();
        
        // تحقق من القيم المدخلة
        if (!nickname || !email) {
            showToast("⚠️ من فضلك أدخل الاسم المستعار والبريد الإلكتروني");
            return;
        }
        
        // تحقق من صيغة البريد الإلكتروني (Gmail فقط)
        const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailPattern.test(email)) {
            showToast("⚠️ يجب أن يكون البريد من نوع Gmail");
            return;
        }
        
        // حفظ البيانات في localStorage
        localStorage.setItem("nickname", nickname);
        localStorage.setItem("email", email);
        localStorage.setItem("isLoggedIn", "true");
        
        showUserArea();
        showToast("✅ تم تسجيل الدخول بنجاح");
    });
    
    // تسجيل خروج
    btnLogout.addEventListener("click", function() {
        localStorage.removeItem("nickname");
        localStorage.removeItem("email");
        localStorage.setItem("isLoggedIn", "false");
        
        authScreen.classList.add("visible");
        userArea.classList.add("hidden");
        showToast("👋 تم تسجيل الخروج");
    });
    
    // عرض منطقة المستخدم وإخفاء شاشة الدخول
    function showUserArea() {
        const nickname = localStorage.getItem("nickname");
        userNick.textContent = `مرحبًا، ${nickname}`;
        authScreen.classList.remove("visible");
        userArea.classList.remove("hidden");
    }
    
    // عرض رسالة مؤقتة (Toast)
    function showToast(message) {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }
});