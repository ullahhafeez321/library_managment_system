const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const initSqlJs = require("sql.js");
const fs = require("fs");

// Database instance
let db = null;
const dbPath = path.join(__dirname, "library.db");

// Initialize database
async function initializeDatabase() {
  try {
    const SQL = await initSqlJs();

    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      console.log("Database opened successfully");
    } else {
      db = new SQL.Database();
      console.log("New database created successfully");
      initializeTables();
      saveDatabase();
    }
  } catch (err) {
    console.error("Database opening error: ", err);
  }
}

// Initialize tables
function initializeTables() {
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

  // Add some sample data for testing
  addSampleData();
}

// Add sample data for testing
function addSampleData() {
  try {
    // Check if books table is empty
    const booksCount = db.exec("SELECT COUNT(*) as count FROM books");
    if (booksCount[0]?.values[0]?.[0] === 0) {
      // Add sample books
      const sampleBooks = [
        [
          "Computer Science Fundamentals",
          "John Smith",
          "978-0123456789",
          "Technology",
          5,
          5,
        ],
        [
          "Mathematics for Beginners",
          "Alice Johnson",
          "978-1234567890",
          "Education",
          3,
          3,
        ],
        [
          "History of Modern World",
          "Robert Brown",
          "978-2345678901",
          "History",
          2,
          2,
        ],
        [
          "Introduction to Physics",
          "Maria Garcia",
          "978-3456789012",
          "Science",
          4,
          4,
        ],
      ];

      const insertBook = db.prepare(
        "INSERT INTO books (title, author, isbn, category, quantity, available) VALUES (?, ?, ?, ?, ?, ?)"
      );
      sampleBooks.forEach((book) => {
        insertBook.run(book);
      });
      insertBook.free();

      // Add sample members
      const sampleMembers = [
        ["Hafeez Ullah", "0312-1234567", "Gwadar, Balochistan"],
        ["Ahmed Khan", "0300-9876543", "Karachi, Sindh"],
        ["Sara Ahmed", "0333-4567890", "Quetta, Balochistan"],
      ];

      const insertMember = db.prepare(
        "INSERT INTO members (name, contact, address) VALUES (?, ?, ?)"
      );
      sampleMembers.forEach((member) => {
        insertMember.run(member);
      });
      insertMember.free();

      saveDatabase();
      console.log("Sample data added successfully");
    }
  } catch (err) {
    console.log("Sample data already exists or error:", err.message);
  }
}

// Save database to file
function saveDatabase() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (err) {
      console.error("Error saving database:", err);
    }
  }
}

// Helper function to execute queries and return results
function executeQuery(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);

    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }

    stmt.free();
    return results;
  } catch (err) {
    console.error("Query error:", err, sql, params);
    throw err;
  }
}

// Helper function to execute statements (INSERT, UPDATE, DELETE)
function executeStatement(sql, params = []) {
  try {
    db.run(sql, params);
    saveDatabase(); // Auto-save after modifications

    // Get last insert ID
    if (sql.trim().toUpperCase().startsWith("INSERT")) {
      const result = db.exec("SELECT last_insert_rowid() as id");
      return {
        lastID: result[0]?.values[0]?.[0] || 0,
        changes: db.getRowsModified(),
      };
    }

    return { changes: db.getRowsModified() };
  } catch (err) {
    console.error("Statement error:", err, sql, params);
    throw err;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(__dirname, "/src/styles/favicon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    minWidth: 1200,
    minHeight: 800,
  });

  win.loadFile("src/index.html");
  // Uncomment the following line to open DevTools by default
  // win.webContents.openDevTools();
}

app.whenReady().then(async () => {
  await initializeDatabase();
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

// IPC Handlers for database operations
ipcMain.handle("add-book", async (event, bookData) => {
  try {
    const sql = `INSERT INTO books (title, author, isbn, category, quantity, available) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    const result = executeStatement(sql, [
      bookData.title,
      bookData.author,
      bookData.isbn,
      bookData.category,
      bookData.quantity,
      bookData.quantity,
    ]);
    return { success: true, id: result.lastID };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("get-books", async () => {
  try {
    const books = executeQuery("SELECT * FROM books ORDER BY id DESC");
    return { success: true, data: books };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("add-member", async (event, memberData) => {
  try {
    const sql = `INSERT INTO members (name, contact, address) 
                 VALUES (?, ?, ?)`;
    const result = executeStatement(sql, [
      memberData.name,
      memberData.contact,
      memberData.address,
    ]);
    return { success: true, id: result.lastID };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("get-members", async () => {
  try {
    const members = executeQuery("SELECT * FROM members ORDER BY id DESC");
    return { success: true, data: members };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("borrow-book", async (event, borrowData) => {
  try {
    // Check if book is available
    const availableBooks = executeQuery(
      "SELECT available FROM books WHERE id = ?",
      [borrowData.book_id]
    );

    if (availableBooks.length === 0 || availableBooks[0].available <= 0) {
      return { success: false, error: "Book not available" };
    }

    // Start transaction
    executeStatement("BEGIN TRANSACTION");

    try {
      // Update book availability
      executeStatement(
        "UPDATE books SET available = available - 1 WHERE id = ?",
        [borrowData.book_id]
      );

      // Create borrowing record
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const result = executeStatement(
        `INSERT INTO borrowings (book_id, member_id, due_date) 
         VALUES (?, ?, ?)`,
        [borrowData.book_id, borrowData.member_id, dueDate.toISOString()]
      );

      executeStatement("COMMIT");
      return { success: true, id: result.lastID };
    } catch (err) {
      executeStatement("ROLLBACK");
      throw err;
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("get-borrowings", async () => {
  try {
    const sql = `
      SELECT b.*, 
             books.title as book_title, 
             members.name as member_name 
      FROM borrowings b
      JOIN books ON b.book_id = books.id
      JOIN members ON b.member_id = members.id
      ORDER BY b.borrow_date DESC`;

    const borrowings = executeQuery(sql);
    return { success: true, data: borrowings };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("return-book", async (event, borrowingId) => {
  try {
    // Get borrowing record
    const borrowing = executeQuery(
      "SELECT book_id FROM borrowings WHERE id = ? AND return_date IS NULL",
      [borrowingId]
    );

    if (borrowing.length === 0) {
      return {
        success: false,
        error: "Borrowing record not found or already returned",
      };
    }

    // Start transaction
    executeStatement("BEGIN TRANSACTION");

    try {
      // Update book availability
      executeStatement(
        "UPDATE books SET available = available + 1 WHERE id = ?",
        [borrowing[0].book_id]
      );

      // Update borrowing record
      executeStatement(
        `UPDATE borrowings 
         SET return_date = datetime('now'), status = 'returned' 
         WHERE id = ?`,
        [borrowingId]
      );

      executeStatement("COMMIT");
      return { success: true };
    } catch (err) {
      executeStatement("ROLLBACK");
      throw err;
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ====================== BOOKS EDIT & DELETE ======================
ipcMain.handle("update-book", async (event, bookData) => {
  try {
    const sql = `UPDATE books SET title=?, author=?, isbn=?, category=?, quantity=?, available=? 
                 WHERE id=?`;
    const result = executeStatement(sql, [
      bookData.title,
      bookData.author,
      bookData.isbn,
      bookData.category,
      bookData.quantity,
      bookData.available,
      bookData.id,
    ]);
    return { success: true, changes: result.changes };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("delete-book", async (event, bookId) => {
  try {
    const result = executeStatement("DELETE FROM books WHERE id=?", [bookId]);
    return { success: true, changes: result.changes };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ====================== MEMBERS EDIT & DELETE ======================
ipcMain.handle("update-member", async (event, memberData) => {
  try {
    const sql = `UPDATE members SET name=?, contact=?, address=? WHERE id=?`;
    const result = executeStatement(sql, [
      memberData.name,
      memberData.contact,
      memberData.address,
      memberData.id,
    ]);
    return { success: true, changes: result.changes };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("delete-member", async (event, memberId) => {
  try {
    const result = executeStatement("DELETE FROM members WHERE id=?", [
      memberId,
    ]);
    return { success: true, changes: result.changes };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Search functionality
ipcMain.handle("search-books", async (event, searchTerm) => {
  try {
    const sql = `SELECT * FROM books 
                 WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ? OR category LIKE ?
                 ORDER BY title`;
    const books = executeQuery(sql, [
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      `%${searchTerm}%`,
    ]);
    return { success: true, data: books };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get book by ID
ipcMain.handle("get-book", async (event, bookId) => {
  try {
    const books = executeQuery("SELECT * FROM books WHERE id = ?", [bookId]);
    return { success: true, data: books[0] || null };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get member by ID
ipcMain.handle("get-member", async (event, memberId) => {
  try {
    const members = executeQuery("SELECT * FROM members WHERE id = ?", [
      memberId,
    ]);
    return { success: true, data: members[0] || null };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Backup database
ipcMain.handle("backup-database", async (event, backupPath) => {
  try {
    if (fs.existsSync(dbPath)) {
      const backupFile = path.join(
        backupPath,
        `library_backup_${Date.now()}.db`
      );
      fs.copyFileSync(dbPath, backupFile);
      return { success: true, path: backupFile };
    }
    return { success: false, error: "Database file not found" };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
