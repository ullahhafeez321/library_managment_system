# 📚 Dhoria Library System

![Electron.js](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)

**Dhoria Library System** is a comprehensive offline desktop application built for **Dhoria Academy Gwadar** to manage library records efficiently. It allows librarians to store, search, and manage books, students, and borrowing transactions — all without requiring an internet connection.

![Electron.js](https://electronjs.org/images/electron-logo.svg)

---

## 🚀 Features

### 📖 **Book Management**
- Add new books with complete details (title, author, ISBN, genre, etc.)
- Edit existing book information
- Remove books from the library catalog
- Search and filter books by various criteria

### 👨‍🎓 **Student Records**
- Maintain a comprehensive list of registered library members
- Track student information and contact details
- Manage student membership status

### 🔄 **Borrow & Return Tracking**
- Keep accurate logs of issued books
- Track return dates and manage overdue items
- Generate borrowing history reports
- Automatic date tracking for transactions

### 💾 **Offline SQLite Database**
- All data stored locally in `library.db` file
- No internet connection required
- Fast and reliable data access

### 💡 **User-Friendly Interface**
- Clean, modern Bootstrap-based design
- Intuitive navigation and responsive layout
- SweetAlert2 for beautiful pop-up notifications
- Smooth user experience with jQuery interactions

### 🔐 **Secure & Private**
- All data remains private on your computer
- No cloud dependencies or external servers
- Complete control over your library records

---

## 🧱 Tech Stack

| Component | Technology Used |
|-----------|-----------------|
| **Frontend** | HTML5, CSS3, Bootstrap 5, jQuery |
| **Application Framework** | Electron.js |
| **Database** | SQLite3 |
| **UI Components** | SweetAlert2, Font Awesome |
| **Packaging** | Electron Builder |

---

## 📂 Project Structure

```
Dhoria_Library/
├── main.js                 # Electron main process
├── index.html             # Main application interface
├── src/
│   ├── js/
│   │   └── app.js        # Frontend application logic
│   ├── styles/
│   │   ├── style.css     # Custom stylesheets
│   │   └── favicon.png   # Application icon
│   └── assets/           # Additional assets
├── library.db            # SQLite database (auto-created)
├── package.json          # Project configuration and dependencies
└── README.md            # Project documentation
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Development Setup

1. **Clone or download the project**
   ```bash
   # If using git
   git clone <repository-url>
   cd Dhoria_Library
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application in development mode**
   ```bash
   npm start
   ```

### Building for Production

#### 1. Install Electron Builder
```bash
npm install --save-dev electron-builder
```

#### 2. Build the Application
```bash
# Build for current platform
npm run build

# Or build specifically for Windows
npm run build:win

# Build for all platforms
npm run build:all
```

#### 3. Output Location
After successful build, your installer will be available in:
```
dist/Dhoria Library System Setup 1.0.0.exe
```

---

## 💾 Database & Backup

### Data Storage
All library data is stored in the `library.db` SQLite file located in the application directory.

### Backup Procedure
To ensure your data safety, follow these steps:

1. **Locate the database file:**
   - Default location: `[App Directory]/library.db`

2. **Manual Backup:**
   ```bash
   # Copy the database file to a safe location
   cp library.db /path/to/backup/location/library_backup_$(date +%Y%m%d).db
   ```

3. **Recommended Backup Locations:**
   - External USB drive
   - Cloud storage (Google Drive, Dropbox, etc.)
   - Network drive

### Restore Procedure
To restore your data after reinstallation:

1. Install the application fresh
2. Replace the new `library.db` file with your backup copy
3. Launch the application - your data will be restored

### Advanced Data Management (Recommended)
For enhanced data security, you can configure the application to store data in a dedicated directory:

**Windows:**
```
C:\Users\[YourUsername]\DhoriaLibraryData\library.db
```

**This approach ensures:**
- Data persistence across application updates
- Easy backup management
- Protection against accidental uninstallation

---

## 🎯 Usage Guide

### Adding Books
1. Navigate to the "Books" section
2. Click "Add New Book"
3. Fill in the book details
4. Click "Save" to add to the library

### Managing Students
1. Go to the "Students" section
2. Register new students with their details
3. View and edit existing student records

### Borrowing Books
1. Select a student from the records
2. Choose the book to be borrowed
3. Set the return date
4. Confirm the transaction

### Returning Books
1. Access the "Transactions" section
2. Find the active borrowing record
3. Mark the book as returned
4. The system automatically updates availability

---

## 🐛 Troubleshooting

### Common Issues

**Application won't start:**
- Verify Node.js installation: `node --version`
- Reinstall dependencies: `npm install`

**Database errors:**
- Check if `library.db` file exists and is accessible
- Verify file permissions in the application directory

**Build failures:**
- Ensure all dependencies are properly installed
- Check available disk space
- Verify anti-virus isn't blocking the build process

---

## 🔄 Updates & Maintenance

### Updating the Application
1. Backup your `library.db` file
2. Install the new version
3. Restore your database backup
4. Launch the updated application

### Regular Maintenance
- Perform monthly database backups
- Keep the application updated to latest version
- Regularly verify data integrity

---

## 👨‍🏫 About the Project

**Developed by:** Hafeez Ullah  
**Institution:** Dhoria Academy Gwadar  
**Purpose:** Internal educational use and library management  
**Version:** 1.0.0  
**Release Date:** 2025

### 📧 Support
For technical support or feature requests, please contact the development team at Dhoria Academy Gwadar.

---

## 🛠️ Development

### Contributing
This project is developed specifically for Dhoria Academy Gwadar. Contributions are welcome from authorized personnel only.

### License
This project is licensed under the **ISC License**.

### Acknowledgments
- Electron.js community
- Bootstrap team
- SQLite developers
- SweetAlert2 creators

---

## 📄 License

All rights reserved © 2025 Dhoria Academy Gwadar.

```text
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
OR OTHER DEALINGS IN THE SOFTWARE.
```

---

<div align="center">

**Thank you for using Dhoria Library System!**  
*Simplifying library management for educational institutions.*

</div>