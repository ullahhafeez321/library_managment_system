const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// Initialize database
const db = new sqlite3.Database(path.join(__dirname, "library.db"), (err) => {
  if (err) console.error("Database opening error: ", err);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("src/index.html");
  // Uncomment the following line to open DevTools by default
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Initialize Database Tables
db.serialize(() => {
  // Books table
  db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        isbn TEXT UNIQUE,
        category TEXT,
        quantity INTEGER DEFAULT 1,
        available INTEGER DEFAULT 1,
        added_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  // Members table
  db.run(`CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact TEXT,
        address TEXT,
        join_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  // Borrowings table
  db.run(`CREATE TABLE IF NOT EXISTS borrowings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER,
        member_id INTEGER,
        borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        due_date DATETIME,
        return_date DATETIME,
        status TEXT DEFAULT 'borrowed',
        FOREIGN KEY (book_id) REFERENCES books (id),
        FOREIGN KEY (member_id) REFERENCES members (id)
    )`);
});

// IPC Handlers for database operations
ipcMain.handle("add-book", async (event, bookData) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO books (title, author, isbn, category, quantity, available) 
                    VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(
      sql,
      [
        bookData.title,
        bookData.author,
        bookData.isbn,
        bookData.category,
        bookData.quantity,
        bookData.quantity,
      ],
      function (err) {
        if (err) reject(err);
        resolve(this.lastID);
      }
    );
  });
});

ipcMain.handle("get-books", async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM books", [], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
});

ipcMain.handle("add-member", async (event, memberData) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO members (name, contact, address,join_date) 
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
    db.run(
      sql,
      [memberData.name, memberData.contact, memberData.address],
      function (err) {
        if (err) reject(err);
        resolve(this.lastID);
      }
    );
  });
});

ipcMain.handle("borrow-book", async (event, borrowData) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      db.run(
        `UPDATE books SET available = available - 1 
                    WHERE id = ? AND available > 0`,
        [borrowData.book_id],
        function (err) {
          if (err) {
            db.run("ROLLBACK");
            reject(err);
            return;
          }

          if (this.changes === 0) {
            db.run("ROLLBACK");
            reject(new Error("Book not available"));
            return;
          }

          const sql = `INSERT INTO borrowings (book_id, member_id, due_date) 
                           VALUES (?, ?, datetime('now', '+14 days'))`;
          db.run(
            sql,
            [borrowData.book_id, borrowData.member_id],
            function (err) {
              if (err) {
                db.run("ROLLBACK");
                reject(err);
                return;
              }
              db.run("COMMIT");
              resolve(this.lastID);
            }
          );
        }
      );
    });
  });
});

ipcMain.handle("get-members", async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM members", [], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
});

ipcMain.handle("get-borrowings", async () => {
  return new Promise((resolve, reject) => {
    const sql = `
            SELECT b.*, 
                   books.title as book_title, 
                   members.name as member_name 
            FROM borrowings b
            JOIN books ON b.book_id = books.id
            JOIN members ON b.member_id = members.id
            ORDER BY b.borrow_date DESC`;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
});

ipcMain.handle("return-book", async (event, borrowingId) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      db.get(
        `SELECT book_id FROM borrowings WHERE id = ?`,
        [borrowingId],
        (err, borrowing) => {
          if (err) {
            db.run("ROLLBACK");
            reject(err);
            return;
          }

          if (!borrowing) {
            db.run("ROLLBACK");
            reject(new Error("Borrowing record not found"));
            return;
          }

          db.run(
            `UPDATE books SET available = available + 1 
                        WHERE id = ?`,
            [borrowing.book_id],
            (err) => {
              if (err) {
                db.run("ROLLBACK");
                reject(err);
                return;
              }

              db.run(
                `UPDATE borrowings 
                            SET return_date = CURRENT_TIMESTAMP,
                                status = 'returned'
                            WHERE id = ?`,
                [borrowingId],
                function (err) {
                  if (err) {
                    db.run("ROLLBACK");
                    reject(err);
                    return;
                  }
                  db.run("COMMIT");
                  resolve(this.changes);
                }
              );
            }
          );
        }
      );
    });
  });
});
