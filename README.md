# 📚 Dhoria Library System

**Dhoria Library System** is an offline desktop application built for **Dhoria Academy Gwadar** to manage library records efficiently.  
It allows librarians to store, search, and manage books, students, and borrowing transactions — all without requiring an internet connection.

---

## 🚀 Features

- 📖 **Book Management** — Add, edit, and remove books with complete details.  
- 👨‍🎓 **Student Records** — Maintain a list of registered library members.  
- 🔄 **Borrow & Return Tracking** — Keep accurate logs of issued and returned books.  
- 💾 **Offline SQLite Database** — Stores all data locally in `library.db`.  
- 💡 **User-Friendly Interface** — Clean Bootstrap-based design with SweetAlert pop-ups.  
- 🔐 **Secure Data** — All data remains private on your computer.  

---

## 🧱 Tech Stack

| Component | Technology Used |
|------------|----------------|
| Frontend | HTML, CSS, Bootstrap, jQuery |
| Backend | Electron.js |
| Database | SQLite3 |
| Alerts | SweetAlert2 |

---

## 📂 Project Structure

Dhoria_Library/
├── main.js # Electron main process
├── index.html # Main app interface
├── src/
│ ├── js/app.js # Frontend logic
│ ├── styles/style.css # Custom styles
│ └── styles/favicon.png # App icon
├── library.db # SQLite database
├── package.json # Project configuration
└── README.md # Project documentation

yaml
Copy code

---

## ⚙️ How to Run in Development

### 1. Install dependencies
```bash
npm install
2. Start the app
bash
Copy code
npm start
🏗️ How to Build Setup (.exe Installer)
1️⃣ Install Electron Builder:

bash
Copy code
npm install --save-dev electron-builder
2️⃣ Build your setup:

bash
Copy code
npm run build
3️⃣ Your installer will appear in:

sql
Copy code
dist/Dhoria Library System Setup 1.0.0.exe
💾 Database & Backup
All data is stored in the library.db file.

To back up your data:

Copy the file library.db to a safe location (e.g., Google Drive or USB).

To restore after reinstalling, replace the new library.db with your backup file.

✅ This ensures your library records stay safe even after updates or reinstallation.

🧠 Optional Improvement (Recommended)
You can store your database in a safe external folder, such as:

makefile
Copy code
C:\Users\<YourName>\DhoriaLibraryData\
This keeps your data secure even if the app is updated or reinstalled.

👨‍🏫 Author
Developed by: Hafeez Ullah
For: Dhoria Academy Gwadar
📧 Internal educational use only.

🛠️ License
This project is licensed under the ISC License.
All rights reserved © 2025 Dhoria Academy Gwadar.