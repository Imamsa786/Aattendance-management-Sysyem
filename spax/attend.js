// Users list (expand as needed)
const USERS = {
  admin1: { username: "admin1", password: "1234", role: "admin" },
  admin2: { username: "admin2", password: "2345", role: "admin" },
  admin3: { username: "admin3", password: "3456", role: "admin" },

  lead1: { username: "lead1", password: "1111", role: "lead" },
  lead2: { username: "lead2", password: "2222", role: "lead" },
  lead3: { username: "lead3", password: "3333", role: "lead" },
  lead4: { username: "lead4", password: "4444", role: "lead" },
  lead5: { username: "lead5", password: "5555", role: "lead" },
  lead6: { username: "lead6", password: "6666", role: "lead" }
};

let attendanceData = [];

// ===== Login =====
function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  let foundUser = Object.values(USERS).find(u => u.username === user && u.password === pass);

  if (foundUser) {
    localStorage.setItem("loggedInUser", JSON.stringify(foundUser));
    showDashboard(foundUser);
  } else {
    document.getElementById("loginError").innerText = "Invalid Credentials!";
  }
}

function showDashboard(user) {
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("dashboardTitle").innerText = `Welcome, ${user.username} (${user.role})`;

  if (user.role === "admin") {
    document.getElementById("adminSection").style.display = "block";
  } else {
    document.getElementById("adminSection").style.display = "none";
  }

  loadAttendance();
}

// ===== File Upload (Admin Only) =====
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileUpload");

dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  handleFile(e.dataTransfer.files[0]);
});
fileInput?.addEventListener("change", e => handleFile(e.target.files[0]));

function handleFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    attendanceData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Remove header row if it exists
    if (attendanceData[0][0] === "S.No" || attendanceData[0][1] === "Name") {
      attendanceData.shift();
    }

    localStorage.setItem("attendanceData", JSON.stringify(attendanceData));
    renderTable();
  };
  reader.readAsArrayBuffer(file);
}
// ===== Search Function =====
function searchTable() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#attendanceTable tbody tr");

  rows.forEach(row => {
    let rowText = row.innerText.toLowerCase();
    row.style.display = rowText.includes(input) ? "" : "none";
  });
}

// ===== Render Attendance Table =====
function renderTable() {
  const tbody = document.querySelector("#attendanceTable tbody");
  tbody.innerHTML = "";

  attendanceData.forEach((row, index) => {
    const tr = document.createElement("tr");

    // Apply row color if status exists
    if (row[6] === "Present") {
      tr.classList.add("present");
    } else if (row[6] === "Absent") {
      tr.classList.add("absent");
    }

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${row[1]}</td>
      <td>${row[2]}</td>
      <td>${row[3]}</td>
      <td>${row[4]}</td>
      <td>${row[5]}</td>
      <td>
        <button onclick="markAttendance(${index}, 'Present')">Present</button>
        <button onclick="markAttendance(${index}, 'Absent')">Absent</button>
        <button onclick="clearAttendance(${index})">Clear</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== Attendance Functions =====
function markAttendance(index, status) {
  if (!attendanceData[index]) return;
  attendanceData[index][6] = status;
  localStorage.setItem("attendanceData", JSON.stringify(attendanceData));
  renderTable(); // refresh table to apply row colors
}

function clearAttendance(index) {
  if (!attendanceData[index]) return;
  attendanceData[index][6] = "";
  localStorage.setItem("attendanceData", JSON.stringify(attendanceData));
  renderTable();
}

function submitAttendance() {
  localStorage.setItem("attendanceData", JSON.stringify(attendanceData));
  alert("Attendance Submitted!");
}

// ===== Load from Storage =====
function loadAttendance() {
  const stored = localStorage.getItem("attendanceData");
  if (stored) {
    attendanceData = JSON.parse(stored);
    renderTable();
  }
}

// ===== Download Report =====
function downloadAttendance() {
  if (attendanceData.length === 0) {
    alert("No attendance data available!");
    return;
  }

  const header = ["S.No", "Name", "Register No", "Year", "Dept", "Section", "Attendance"];
  const data = [header, ...attendanceData.map((row, i) => [i + 1, ...row.slice(1, 6), row[6] || ""])];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
  XLSX.writeFile(workbook, "Attendance_Report.xlsx");
}

// ===== Logout =====
function logout() {
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("attendanceData");
  location.reload();
}

// ===== Auto Login =====
window.onload = () => {
  const storedUser = localStorage.getItem("loggedInUser");
  if (storedUser) {
    const user = JSON.parse(storedUser);
    showDashboard(user);
  }
};
