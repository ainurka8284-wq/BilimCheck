// Firebase жеке конфигурациясы
const firebaseConfig = {
    apiKey: "AIzaSyAW4ztx5zqry9vLPIGTZGcf1eTCxWcQnqI",
    authDomain: "bilimchek.firebaseapp.com",
    databaseURL: "https://bilimchek-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bilimchek",
    storageBucket: "bilimchek.firebasestorage.app",
    messagingSenderId: "214598424733",
    appId: "1:214598424733:web:3775772e9c37662ed05c74"
};

// Firebase'ди коопсуз демилгелөө
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// Баскычтарды жана контейнерлерди кодго байлоо
const btnAddTest = document.querySelector('.btn-add');
const testsListContainer = document.getElementById('tests-list');
const resultsListContainer = document.getElementById('results-list');
const btnClean = document.querySelector('.btn-clean') || document.querySelector('button[class=""]'); // Эгер класс өзгөрсө да табуу үчүн

// --- 1. ЖАҢЫ ТЕСТ КОШУУ БАСКЫЧЫ ---
if (btnAddTest) {
    btnAddTest.addEventListener('click', () => {
        const testName = prompt("Жаңы тесттин аталышын киргизиңиз (Мисалы: 10-B класс жылдык):");
        
        if (testName && testName.trim() !== "") {
            const newTestRef = database.ref('tests').push();
            newTestRef.set({
                name: testName.trim(),
                status: "жабык" // Алгач тест жабык болот
            }).then(() => {
                alert("Тест ийгиликтүү түзүлдү жана базага кошулду!");
            }).catch((error) => {
                alert("Базага жазууда ката кетти: " + error.message);
            });
        }
    });
}

// --- 2. БАЗАДАН ТЕСТТЕРДИ РЕАЛДУУ УБАКИ ТАРТЫП ЭКРАНГА ЧЫГАРУУ ---
database.ref('tests').on('value', (snapshot) => {
    if (!testsListContainer) return;
    testsListContainer.innerHTML = "";
    
    const data = snapshot.val();
    
    if (data) {
        Object.keys(data).forEach((key) => {
            const test = data[key];
            const isChecked = test.status === "ачык" ? "checked" : "";
            
            const testCard = document.createElement('div');
            testCard.className = 'test-card';
            testCard.innerHTML = `
                <div class="test-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: bold;">${test.name}</span>
                    <label class="switch">
                        <input type="checkbox" ${isChecked} onchange="toggleTestStatus('${key}', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="card-buttons" style="display: flex; gap: 5px;">
                    <button class="btn-sm btn-link" style="background: #2563eb; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;" onclick="copyLink('${key}')">Шилтеме</button>
                    <button class="btn-sm btn-delete" style="background: #dc2626; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;" onclick="deleteTest('${key}')">Өчүрүү</button>
                </div>
            `;
            testsListContainer.appendChild(testCard);
        });
    } else {
        testsListContainer.innerHTML = `<p style="color: #9ca3af; font-size: 14px; font-style: italic;">Азырынча тесттер жок. Өйдөдөн жаңы тест кошуңуз.</p>`;
    }
}, (error) => {
    if (testsListContainer) {
        testsListContainer.innerHTML = `<p style="color: #dc2626;">Ката: Базага кирүүгө уруксат берилген жок. Rules бөлүмүн текшериңиз.</p>`;
    }
});

// --- 3. ОКУУЧУЛАРДЫН ЖЫЙЫНТЫКТАРЫН РЕАЛДУУ УБАКИ КӨЗӨМӨЛДӨӨ ---
database.ref('results').on('value', (snapshot) => {
    if (!resultsListContainer) return;
    resultsListContainer.innerHTML = "";
    
    const data = snapshot.val();
    
    if (data) {
        Object.keys(data).forEach((key) => {
            const res = data[key];
            
            let statusBadge = '';
            if (res.status === 'Таза') {
                statusBadge = `<span style="background: #065f46; color: #34d399; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">Таза</span>`;
            } else if (res.status && res.status.includes('Чыкты')) {
                statusBadge = `<span style="background: #78350f; color: #fbbf24; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${res.status}</span>`;
            } else {
                statusBadge = `<span style="background: #991b1b; color: #fca5a5; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">Бөгөт!</span>`;
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding: 12px; border-bottom: 1px solid #1f2937;">${res.studentName}</td>
                <td style="padding: 12px; border-bottom: 1px solid #1f2937;">${res.testName}</td>
                <td style="padding: 12px; border-bottom: 1px solid #1f2937;"><span style="background: #1e3a8a; color: #60a5fa; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${res.score}</span></td>
                <td style="padding: 12px; border-bottom: 1px solid #1f2937;">${statusBadge}</td>
            `;
            resultsListContainer.appendChild(row);
        });
    } else {
        resultsListContainer.innerHTML = `<tr><td colspan="4" style="color: #9ca3af; text-align: center; padding: 20px; font-style: italic;">Азырынча жыйынтыктар жок.</td></tr>`;
    }
});

// --- 4. ТЕСТТИ КҮЙГҮЗҮҮ / ЖАБУУ ---
window.toggleTestStatus = function(testId, isOpening) {
    const newStatus = isOpening ? "ачык" : "жабык";
    database.ref('tests/' + testId).update({ status: newStatus });
};

// --- 5. ТЕСТТИ ӨЧҮРҮҮ ---
window.deleteTest = function(testId) {
    if (confirm("Бул тестти өчүрүүнү каалайсызбы?")) {
        database.ref('tests/' + testId).remove();
    }
};

// --- 6. ШИЛТЕМЕ КӨЧҮРҮҮ ---
window.copyLink = function(testId) {
    const studentLink = window.location.origin + window.location.pathname.replace('index.html', '') + "student.html?test=" + testId;
    navigator.clipboard.writeText(studentLink).then(() => {
        alert("Окуучулар үчүн шилтеме көчүрүлдү! Каалаган жерге (мисалы WhatsApp) чаптасаңыз болот:\n" + studentLink);
    }).catch(() => {
        alert("Шилтеме: " + studentLink);
    });
};

// --- 7. ТАЗАЛОО БАСКЫЧЫ ---
if (btnClean) {
    btnClean.addEventListener('click', () => {
        if (confirm("Бардык окуучулардын жыйынтыктарын өчүрүүнү каалайсызбы?")) {
            database.ref('results').remove();
        }
    });
}
