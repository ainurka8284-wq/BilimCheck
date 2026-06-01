const firebaseConfig = {
    apiKey: "AIzaSyAW4ztx5zqry9vLPIGTZGcf1eTCxWcQnqI",
    authDomain: "bilimchek.firebaseapp.com",
    databaseURL: "https://bilimchek-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bilimchek",
    storageBucket: "bilimchek.firebasestorage.app",
    messagingSenderId: "214598424733",
    appId: "1:214598424733:web:3775772e9c37662ed05c74"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

const btnAddTest = document.querySelector('.btn-add');
const testsListContainer = document.getElementById('tests-list');
const resultsListContainer = document.getElementById('results-list');
const btnClean = document.querySelector('.btn-clean');

let currentEditingTestId = "";

// --- 1. ЖАҢЫ ТЕСТ КОШУУ ---
if (btnAddTest) {
    btnAddTest.addEventListener('click', () => {
        const testName = prompt("Жаңы тесттин аталышын киргизиңиз (Мисалы: 9-класс Программалоо):");
        if (testName && testName.trim() !== "") {
            const newTestRef = database.ref('tests').push();
            newTestRef.set({
                name: testName.trim(),
                status: "жабык"
            }).then(() => {
                alert("Тесттин аталышы ийгиликтүү кошулду!");
            });
        }
    });
}

// --- 2. БАЗАДАН ТЕСТТЕРДИ ЖАНА БАРДЫК БАСКЫЧТАРДЫ ЧЫГАРУУ ---
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
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: bold; font-size: 16px;">${test.name}</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 12px; color: #94a3b8;">${test.status === "ачык" ? "Ачык" : "Жабык"}</span>
                        <label class="switch">
                            <input type="checkbox" ${isChecked} onchange="toggleTestStatus('${key}', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                <div class="card-buttons">
                    <button class="btn-sm btn-blue" onclick="copyLink('${key}')">Шилтеме</button>
                    <button class="btn-sm btn-orange" onclick="openEditModal('${key}', '${test.name}')">Түзөтүү</button>
                    <button class="btn-sm btn-red" onclick="deleteTest('${key}')">Өчүрүү</button>
                </div>
            `;
            testsListContainer.appendChild(testCard);
        });
    } else {
        testsListContainer.innerHTML = `<p style="color: #64748b; font-style: italic;">Тесттер жок.</p>`;
    }
});

// --- 3. ТҮЗӨТҮҮ (МОДАЛЬ СУРОО КИРГИЗҮҮ) ---
window.openEditModal = function(testId, testName) {
    currentEditingTestId = testId;
    document.getElementById('modal-test-name').innerText = testName + " - Суроолорду башкаруу";
    document.getElementById('edit-modal').style.display = "block";
    
    database.ref('tests/' + testId + '/questions').on('value', (snapshot) => {
        const qList = document.getElementById('modal-questions-list');
        qList.innerHTML = "";
        const questions = snapshot.val();
        
        if (questions) {
            let index = 1;
            Object.keys(questions).forEach((qKey) => {
                const q = questions[qKey];
                const qDiv = document.createElement('div');
                qDiv.style = "background: #0f172a; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #334155;";
                qDiv.innerHTML = `
                    <div>
                        <p style="margin: 0; font-weight: bold;">${index}. ${q.text}</p>
                        <small style="color: #10b981;">Туура вариант: ${q.correct}</small>
                    </div>
                    <button onclick="deleteQuestion('${testId}', '${qKey}')" style="background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">Өчүрүү</button>
                `;
                qList.appendChild(qDiv);
                index++;
            });
        } else {
            qList.innerHTML = `<p style="color: #64748b; font-size: 13px; font-style: italic;">Суроолор жок.</p>`;
        }
    });
};

// --- 4. СУРОО ЖАНА ВАРИАНТТАРДЫ САКТОО ---
window.saveQuestion = function() {
    const qText = document.getElementById('q-text').value.trim();
    const optA = document.getElementById('opt-a').value.trim();
    const optB = document.getElementById('opt-b').value.trim();
    const optC = document.getElementById('opt-c').value.trim();
    const optD = document.getElementById('opt-d').value.trim();
    const correct = document.getElementById('correct-opt').value;

    if (!qText || !optA || !optB || !optC || !optD) {
        alert("Сураныч, суроону жана А, Б, В, Г варианттарынын баарын толук жазыңыз!");
        return;
    }

    const questionRef = database.ref('tests/' + currentEditingTestId + '/questions').push();
    questionRef.set({
        text: qText,
        options: { A: optA, B: optB, C: optC, D: optD },
        correct: correct
    }).then(() => {
        document.getElementById('q-text').value = "";
        document.getElementById('opt-a').value = "";
        document.getElementById('opt-b').value = "";
        document.getElementById('opt-c').value = "";
        document.getElementById('opt-d').value = "";
        alert("Суроо варианттары менен ийгиликтүү кошулду!");
    });
};

// --- 5. ШИЛТЕМЕ КӨЧҮРҮҮ ---
window.copyLink = function(testId) {
    const studentLink = window.location.origin + window.location.pathname.replace('index.html', '') + "student.html?test=" + testId;
    navigator.clipboard.writeText(studentLink).then(() => {
        alert("Окуучулар үчүн шилтеме көчүрүлдү!\n\nШилтеме: " + studentLink);
    }).catch(() => {
        alert("Шилтеме: " + studentLink);
    });
};

// --- 6. ТЕСТТИ ӨЧҮРҮҮ ---
window.deleteTest = function(testId) {
    if (confirm("Бул тестти жана анын ичиндеги бардык суроолорду базадан биротоло өчүрөсүзбү?")) {
        database.ref('tests/' + testId).remove();
    }
};

// --- 7. СУРООНУ ӨЧҮРҮҮ ---
window.deleteQuestion = function(testId, qKey) {
    if (confirm("Бул суроону өчүрүүнү каалайсызбы?")) {
        database.ref('tests/' + testId + '/questions/' + qKey).remove();
    }
};

// --- 8. ТЕСТ СТАТУСУН АЛМАШТЫРУУ (Ачык/Жабык) ---
window.toggleTestStatus = function(testId, isOpening) {
    const newStatus = isOpening ? "ачык" : "жабык";
    database.ref('tests/' + testId).update({ status: newStatus });
};

// --- 9. ТЕРЕЗЕНИ ЖАБУУ ---
window.closeModal = function() {
    document.getElementById('edit-modal').style.display = "none";
};

// --- 10. ЖЫЙЫНТЫКТАРДЫ РЕАЛДУУ УБАКИ ОКУУ ---
database.ref('results').on('value', (snapshot) => {
    if (!resultsListContainer) return;
    resultsListContainer.innerHTML = "";
    const data = snapshot.val();
    
    if (data) {
        Object.keys(data).forEach((key) => {
            const res = data[key];
            let badge = '';
            if (res.status === 'Таза') {
                badge = `<span style="color: #10b981; font-weight: bold;">Таза</span>`;
            } else if (res.status && res.status.includes('Чыкты')) {
                badge = `<span style="color: #f59e0b; font-weight: bold;">${res.status}</span>`;
            } else {
                badge = `<span style="color: #ef4444; font-weight: bold;">Бөгөт!</span>`;
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${res.studentName}</td>
                <td>${res.testName}</td>
                <td><span style="background: #1e3a8a; padding: 4px 8px; border-radius: 4px; color: #60a5fa; font-weight: bold;">${res.score}</span></td>
                <td>${badge}</td>
            `;
            resultsListContainer.appendChild(row);
        });
    } else {
        resultsListContainer.innerHTML = `<tr><td colspan="4" style="color: #64748b; text-align: center; font-style: italic; padding: 20px;">Азырынча жыйынтыктар жок.</td></tr>`;
    }
});

// --- 11. ЖЫЙЫНТЫКТАРДЫ ТАЗАЛОО ---
if (btnClean) {
    btnClean.addEventListener('click', () => {
        if (confirm("Бардык окуучулардын жыйынтыктарын өчүрүүнү каалайсызбы?")) {
            database.ref('results').remove();
        }
    });
}
