const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const Database = require("better-sqlite3");

const folderPath = path.join(app.getPath("documents"), "DhoriaLibrary");
const fs = require("fs");

// Ensure the folder exists
if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath, { recursive: true });
}

// Path to the database inside that folder
const dbPath = path.join(folderPath, "library.db");

// Copy default DB from app folder if it doesn't exist
const defaultDbPath = path.join(__dirname, "library.db");
if (!fs.existsSync(dbPath) && fs.existsSync(defaultDbPath)) {
  fs.copyFileSync(defaultDbPath, dbPath);
}

let db;
try {
  db = new Database(dbPath);
  console.log("Database opened at:", dbPath);
} catch (err) {
  console.error("Database opening error:", err);
}

// Create the main application window
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "src/styles/favicon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("src/index.html");

  // Create application menu
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Dashboard",
          accelerator: "CmdOrCtrl+1",
          click: () => win.webContents.send("navigate-to", "dashboard"),
        },
        {
          label: "Books",
          accelerator: "CmdOrCtrl+2",
          click: () => win.webContents.send("navigate-to", "books"),
        },
        {
          label: "Members",
          accelerator: "CmdOrCtrl+3",
          click: () => win.webContents.send("navigate-to", "members"),
        },
        {
          label: "Borrowings",
          accelerator: "CmdOrCtrl+4",
          click: () => win.webContents.send("navigate-to", "borrowings"),
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo", label: "Undo" },
        { role: "redo", label: "Redo" },
        { type: "separator" },
        { role: "cut", label: "Cut" },
        { role: "copy", label: "Copy" },
        { role: "paste", label: "Paste" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload", label: "Reload" },
        { role: "forceReload", label: "Force Reload" },
        { type: "separator" },
        { role: "resetZoom", label: "Actual Size" },
        { role: "zoomIn", label: "Zoom In" },
        { role: "zoomOut", label: "Zoom Out" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Toggle Fullscreen" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About",
          click: () => {
            dialog.showMessageBox(win, {
              type: "info",
              title: "About Library System",
              message: "Dhoria Academy Library Management System",
              detail:
                "Version 1.0.0\n\nDeveloped by Hafeez Ullah\n\nA comprehensive library management solution for educational institutions.",
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ====================== APP LIFECYCLE ======================
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ====================== DATABASE TABLES ======================
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT UNIQUE,
    category TEXT,
    quantity INTEGER DEFAULT 1,
    available INTEGER DEFAULT 1,
    added_date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT,
    address TEXT,
    join_date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS borrowings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    member_id INTEGER,
    borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME,
    return_date DATETIME,
    status TEXT DEFAULT 'borrowed',
    FOREIGN KEY (book_id) REFERENCES books (id),
    FOREIGN KEY (member_id) REFERENCES members (id)
  );
`);

// ====================== IPC HANDLERS ======================

// Add a book
ipcMain.handle("add-book", async (event, bookData) => {
  const stmt = db.prepare(
    `INSERT INTO books (title, author, isbn, category, quantity, available) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const info = stmt.run(
    bookData.title,
    bookData.author,
    bookData.isbn,
    bookData.category,
    bookData.quantity,
    bookData.quantity
  );
  return info.lastInsertRowid;
});

// Get all books
ipcMain.handle("get-books", async () => {
  const stmt = db.prepare("SELECT * FROM books");
  return stmt.all();
});

// Add a member
ipcMain.handle("add-member", async (event, memberData) => {
  const stmt = db.prepare(
    `INSERT INTO members (name, contact, address, join_date) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
  );
  const info = stmt.run(
    memberData.name,
    memberData.contact,
    memberData.address
  );
  return info.lastInsertRowid;
});

// Borrow a book
ipcMain.handle("borrow-book", async (event, borrowData) => {
  const book = db
    .prepare("SELECT available FROM books WHERE id = ?")
    .get(borrowData.book_id);
  if (!book || book.available <= 0) throw new Error("Book not available");

  const transaction = db.transaction(() => {
    db.prepare("UPDATE books SET available = available - 1 WHERE id = ?").run(
      borrowData.book_id
    );
    const info = db
      .prepare(
        "INSERT INTO borrowings (book_id, member_id, due_date) VALUES (?, ?, datetime('now', '+14 days'))"
      )
      .run(borrowData.book_id, borrowData.member_id);
    return info.lastInsertRowid;
  });

  return transaction();
});

// Get members
ipcMain.handle("get-members", async () => {
  return db.prepare("SELECT * FROM members").all();
});

// Get borrowings
ipcMain.handle("get-borrowings", async () => {
  return db
    .prepare(
      `
      SELECT b.*, 
             books.title as book_title, 
             members.name as member_name 
      FROM borrowings b
      JOIN books ON b.book_id = books.id
      JOIN members ON b.member_id = members.id
      ORDER BY b.borrow_date DESC
    `
    )
    .all();
});

// Return a book
ipcMain.handle("return-book", async (event, borrowingId) => {
  const borrowing = db
    .prepare("SELECT book_id FROM borrowings WHERE id = ?")
    .get(borrowingId);
  if (!borrowing) throw new Error("Borrowing record not found");

  const transaction = db.transaction(() => {
    db.prepare("UPDATE books SET available = available + 1 WHERE id = ?").run(
      borrowing.book_id
    );
    const info = db
      .prepare(
        "UPDATE borrowings SET return_date = CURRENT_TIMESTAMP, status = 'returned' WHERE id = ?"
      )
      .run(borrowingId);
    return info.changes;
  });

  return transaction();
});

// ====================== BOOKS EDIT & DELETE ======================
ipcMain.handle("update-book", async (event, bookData) => {
  const stmt = db.prepare(
    `UPDATE books SET title=?, author=?, isbn=?, category=?, quantity=?, available=? WHERE id=?`
  );
  const info = stmt.run(
    bookData.title,
    bookData.author,
    bookData.isbn,
    bookData.category,
    bookData.quantity,
    bookData.available,
    bookData.id
  );
  return info.changes;
});

ipcMain.handle("delete-book", async (event, bookId) => {
  const stmt = db.prepare("DELETE FROM books WHERE id=?");
  const info = stmt.run(bookId);
  return info.changes;
});

// ====================== MEMBERS EDIT & DELETE ======================
ipcMain.handle("update-member", async (event, memberData) => {
  const stmt = db.prepare(
    `UPDATE members SET name=?, contact=?, address=? WHERE id=?`
  );
  const info = stmt.run(
    memberData.name,
    memberData.contact,
    memberData.address,
    memberData.id
  );
  return info.changes;
});

ipcMain.handle("delete-member", async (event, memberId) => {
  const stmt = db.prepare("DELETE FROM members WHERE id=?");
  const info = stmt.run(memberId);
  return info.changes;
});
