// Firebase SDK модулдарын импорттоо
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// МАНЕ ТАПШЫРМА: Өзүңүздүн Firebase маалыматтарыңызды бул жерге коюңуз
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "bilimcheck.firebaseapp.com",
    databaseURL: "https://bilimcheck-default-rtdb.firebaseio.com", // Сиздин базанын URL дареги
    projectId: "bilimcheck",
    storageBucket: "bilimcheck.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebaseти демилгелөө
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// DOM Элементтери
const testsList = document.getElementById('tests-list');
const resultsTableBody = document.getElementById('results-table-body');
const btnCreateTest = document.getElementById('btn-create-test');
const modalTest = document.getElementById('modal-test');
const closeModal = document.querySelector('.close-modal');
const saveTestBtn = document.getElementById('save-test-btn');
const btnClear = document.getElementById('btn-clear');

// 1. Тесттерди реалдуу убакытта базадан алуу
onValue(ref(database, 'tests'), (snapshot) => {
    testsList.innerHTML = '';
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const testId = childSnapshot.key;
            const testData = childSnapshot.val();
            
            const testEl = document.createElement('div');
            testEl.className = 'test-item';
            testEl.innerHTML = `
                <h4>${testData.title}</h4>
                <div class="test-status">Жабык (же Активдүү)</div>
                <div class="test-actions">
                    <button class="btn-sm" onclick="copyLink('${testId}')">Шилтеме</button>
                    <button class="btn-sm" onclick="editTest('${testId}')">Түзөтүү</button>
                </div>
            `;
            testsList.appendChild(testEl);
        });
    } else {
        testsList.innerHTML = '<div>Тесттер азырынча жок.</div>';
    }
});

// 2. Окуучулардын жыйынтыктарын реалдуу убакытта (Realtime) угуу
onValue(ref(database, 'results'), (snapshot) => {
    resultsTableBody.innerHTML = '';
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const res = childSnapshot.val();
            const row = document.createElement('tr');
            
            // Коопсуздук алгоритминин абалына карап түс берүү
            const statusColor = res.security === 'Коопсуз' ? '#34d399' : '#f87171';

            row.innerHTML = `
                <td>${res.studentName}</td>
                <td>${res.testTitle}</td>
                <td><strong>${res.score}</strong></td>
                <td style="color: ${statusColor}; font-weight: bold;">${res.security || 'Көзөмөлдө'}</td>
            `;
            resultsTableBody.appendChild(row);
        });
    } else {
        resultsTableBody.innerHTML = `<tr><td colspan="4" class="status-msg">Жыйынтыктар бош...</td></tr>`;
    }
});

// 3. Модаль терезесин башкаруу
btnCreateTest.onclick = () => modalTest.style.display = 'flex';
closeModal.onclick = () => modalTest.style.display = 'none';

// 4. Жаңы тестти базага сактоо
saveTestBtn.onclick = () => {
    const title = document.getElementById('test-title').value;
    const questionsText = document.getElementById('test-questions').value;

    if (!title) return alert('Тесттин аталышын жазыңыз!');

    const newTestRef = push(ref(database, 'tests'));
    set(newTestRef, {
        title: title,
        questions: questionsText, // Бул жерге суроолор массив түрүндө кетсе жакшы
        createdAt: new Date().toISOString()
    }).then(() => {
        modalTest.style.display = 'none';
        document.getElementById('test-title').value = '';
        document.getElementById('test-questions').value = '';
    });
};

// JAVASCRIPT ТАРМАГЫНДАГЫ ГЛОБАЛДЫК ФУНКЦИЯЛАР (Шилтеме көчүрүү үчүн)
window.copyLink = (testId) => {
    const studentUrl = `${window.location.origin}/test-student.html?id=${testId}`;
    navigator.clipboard.writeText(studentUrl);
    alert('Окуучулар үчүн шилтеме көчүрүлдү!');
};

// Жыйынтыктарды тазалоо баскычы
btnClear.onclick = () => {
    if(confirm('Бардык жыйынтыктарды өчүрүүнү каалайсызбы?')) {
        remove(ref(database, 'results'));
    }
};
