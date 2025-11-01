const { ipcRenderer } = require("electron");

// Navigation
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const page = e.target.dataset.page;
    showPage(page);
  });
});

ipcRenderer.on("navigate-to", (event, page) => {
  showPage(page);
});

function showPage(pageId) {
  document.querySelectorAll(".page-section").forEach((section) => {
    section.classList.remove("active");
  });
  document.querySelector(`#${pageId}-section`).classList.add("active");
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
  });
  document.querySelector(`[data-page="${pageId}"]`).classList.add("active");
}

// Safe element function
function getElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element with id '${id}' not found`);
  }
  return element;
}

// Book Search Functionality
let allBooks = []; // Store all books for searching
let currentSearchTerm = "";

// Initialize search functionality
function initializeBookSearch() {
  const searchInput = document.getElementById("book-search");
  const searchBtn = document.getElementById("book-search-btn");
  const clearBtn = document.getElementById("book-clear-search");

  if (searchInput && searchBtn && clearBtn) {
    // Search on button click
    searchBtn.addEventListener("click", performBookSearch);

    // Search on Enter key
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        performBookSearch();
      }
    });

    // Clear search
    clearBtn.addEventListener("click", clearBookSearch);
  }
}

// Perform book search
function performBookSearch() {
  const searchInput = document.getElementById("book-search");
  if (!searchInput) return;

  currentSearchTerm = searchInput.value.trim().toLowerCase();

  if (currentSearchTerm === "") {
    displayBooks(allBooks);
    return;
  }

  const filteredBooks = allBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(currentSearchTerm) ||
      book.author.toLowerCase().includes(currentSearchTerm) ||
      (book.isbn && book.isbn.toLowerCase().includes(currentSearchTerm)) ||
      (book.category && book.category.toLowerCase().includes(currentSearchTerm))
  );

  displayBooks(filteredBooks, true);
}

// Clear book search
function clearBookSearch() {
  const searchInput = document.getElementById("book-search");
  if (searchInput) {
    searchInput.value = "";
    currentSearchTerm = "";
    displayBooks(allBooks);
  }
}

// Display books with optional highlighting
function displayBooks(books, highlight = false) {
  const tbody = document.querySelector("#books-table tbody");

  if (!tbody) {
    console.warn("Books table tbody not found");
    return;
  }

  tbody.innerHTML = "";

  if (books.length === 0) {
    const noResultsRow = document.createElement("tr");
    noResultsRow.innerHTML = `
            <td colspan="7" class="text-center text-muted py-4 no-results">
                <i class="fas fa-search me-2"></i>
                ${
                  currentSearchTerm
                    ? "No books found matching your search."
                    : "No books available."
                }
            </td>
        `;
    tbody.appendChild(noResultsRow);
    return;
  }

  books.forEach((book) => {
    const row = document.createElement("tr");

    // Highlight search terms if needed
    const title = highlight
      ? highlightText(book.title, currentSearchTerm)
      : book.title;
    const author = highlight
      ? highlightText(book.author, currentSearchTerm)
      : book.author;
    const isbn = highlight
      ? highlightText(book.isbn || "-", currentSearchTerm)
      : book.isbn || "-";
    const category = highlight
      ? highlightText(book.category || "-", currentSearchTerm)
      : book.category || "-";

    row.innerHTML = `
            <td>${book.id}</td>
            <td>${title}</td>
            <td>${author}</td>
            <td>${isbn}</td>
            <td>${category}</td>
            <td>${book.available}/${book.quantity}</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action edit-book" data-id="${book.id}">Edit</button>
                <button class="btn btn-sm btn-danger btn-action delete-book" data-id="${book.id}">Delete</button>
            </td>
        `;
    tbody.appendChild(row);
  });
}

// Highlight search terms in text
function highlightText(text, searchTerm) {
  if (!searchTerm || !text) return text;

  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi");
  return text.toString().replace(regex, '<span class="highlight">$1</span>');
}

// Escape special characters for regex
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Load Dashboard Data
async function loadDashboardData() {
  try {
    await loadRecentActivity();
    await loadOverdueBooks();
    await loadPopularBooks();
    await loadTodayStatistics();
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

// Recent Activity
async function loadRecentActivity() {
  try {
    const recentActivityTable = getElement("recent-activity-table");
    if (!recentActivityTable) return;

    const borrowings = await ipcRenderer.invoke("get-borrowings");
    const recentActivities = [];

    const recentBorrowings = borrowings.slice(0, 10);
    recentBorrowings.forEach((borrowing) => {
      const status = borrowing.return_date
        ? "returned"
        : new Date(borrowing.due_date) < new Date()
        ? "overdue"
        : "borrowed";

      recentActivities.push({
        type: "borrowing",
        details: `${borrowing.member_name} ${
          status === "borrowed" ? "borrowed" : "returned"
        } "${borrowing.book_title}"`,
        date: borrowing.borrow_date,
        status: status,
      });
    });

    recentActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

    recentActivityTable.innerHTML = "";

    if (recentActivities.length === 0) {
      recentActivityTable.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-4">
                        <i class="fas fa-info-circle me-2"></i>No recent activity
                    </td>
                </tr>
            `;
      return;
    }

    recentActivities.slice(0, 5).forEach((activity) => {
      const row = document.createElement("tr");
      const statusClass = `bg-${activity.status}`;
      const statusText =
        activity.status.charAt(0).toUpperCase() + activity.status.slice(1);

      row.innerHTML = `
                <td>
                    <i class="fas fa-exchange-alt me-1"></i>
                    ${activity.type === "borrowing" ? "Borrowing" : "Book"}
                </td>
                <td>${activity.details}</td>
                <td>${new Date(activity.date).toLocaleDateString()}</td>
                <td><span class="activity-badge ${statusClass}">${statusText}</span></td>
            `;
      recentActivityTable.appendChild(row);
    });
  } catch (error) {
    console.error("Failed to load recent activity:", error);
  }
}

// Overdue Books
async function loadOverdueBooks() {
  try {
    const overdueBooksTable = getElement("overdue-books-table");
    const overdueCount = getElement("overdue-count");

    if (!overdueBooksTable || !overdueCount) return;

    const borrowings = await ipcRenderer.invoke("get-borrowings");
    const today = new Date();
    const overdueBooks = borrowings.filter(
      (borrowing) =>
        !borrowing.return_date && new Date(borrowing.due_date) < today
    );

    overdueCount.textContent = overdueBooks.length;

    if (overdueBooks.length === 0) {
      overdueBooksTable.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-4">
                        <i class="fas fa-check-circle me-2"></i>No overdue books
                    </td>
                </tr>
            `;
      return;
    }

    overdueBooksTable.innerHTML = "";
    overdueBooks.slice(0, 5).forEach((borrowing) => {
      const dueDate = new Date(borrowing.due_date);
      const daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${borrowing.book_title}</td>
                <td>${borrowing.member_name}</td>
                <td>${dueDate.toLocaleDateString()}</td>
                <td><span class="badge bg-danger">${daysLate} days</span></td>
            `;
      overdueBooksTable.appendChild(row);
    });
  } catch (error) {
    console.error("Failed to load overdue books:", error);
  }
}

// Popular Books
async function loadPopularBooks() {
  try {
    const popularBooksTable = getElement("popular-books-table");
    if (!popularBooksTable) return;

    const borrowings = await ipcRenderer.invoke("get-borrowings");
    const books = await ipcRenderer.invoke("get-books");

    const bookBorrowCount = {};
    borrowings.forEach((borrowing) => {
      bookBorrowCount[borrowing.book_title] =
        (bookBorrowCount[borrowing.book_title] || 0) + 1;
    });

    const popularBooks = Object.entries(bookBorrowCount)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count);

    if (popularBooks.length === 0) {
      popularBooksTable.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-muted py-4">
                        <i class="fas fa-book me-2"></i>No borrowing data yet
                    </td>
                </tr>
            `;
      return;
    }

    popularBooksTable.innerHTML = "";
    popularBooks.slice(0, 5).forEach((book) => {
      const bookInfo = books.find((b) => b.title === book.title);
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${book.title}</td>
                <td>${bookInfo ? bookInfo.author : "Unknown"}</td>
                <td><span class="badge bg-primary">${book.count}</span></td>
            `;
      popularBooksTable.appendChild(row);
    });
  } catch (error) {
    console.error("Failed to load popular books:", error);
  }
}

// Today's Statistics
async function loadTodayStatistics() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const books = await ipcRenderer.invoke("get-books");
    const members = await ipcRenderer.invoke("get-members");
    const borrowings = await ipcRenderer.invoke("get-borrowings");

    const booksAddedToday = books.filter(
      (book) => book.added_date && book.added_date.includes(today)
    ).length;

    const membersJoinedToday = members.filter(
      (member) => member.join_date && member.join_date.includes(today)
    ).length;

    const booksBorrowedToday = borrowings.filter(
      (borrowing) =>
        borrowing.borrow_date && borrowing.borrow_date.includes(today)
    ).length;

    const booksReturnedToday = borrowings.filter(
      (borrowing) =>
        borrowing.return_date && borrowing.return_date.includes(today)
    ).length;

    // Update elements safely
    const booksAddedElement = getElement("books-added-today");
    const membersJoinedElement = getElement("members-joined-today");
    const booksBorrowedElement = getElement("books-borrowed-today");
    const booksReturnedElement = getElement("books-returned-today");

    if (booksAddedElement) booksAddedElement.textContent = booksAddedToday;
    if (membersJoinedElement)
      membersJoinedElement.textContent = membersJoinedToday;
    if (booksBorrowedElement)
      booksBorrowedElement.textContent = booksBorrowedToday;
    if (booksReturnedElement)
      booksReturnedElement.textContent = booksReturnedToday;
  } catch (error) {
    console.error("Failed to load today statistics:", error);
  }
}

// Books Management
document.getElementById("save-book").addEventListener("click", async () => {
  const form = document.getElementById("add-book-form");
  const formData = new FormData(form);
  const bookData = Object.fromEntries(formData.entries());

  try {
    await ipcRenderer.invoke("add-book", bookData);
    Swal.fire("Success", "Book added successfully!", "success");
    form.reset();
    $("#addBookModal").modal("hide");
    await loadBooks(); // Reload books to include the new one
    if (currentSearchTerm) {
      performBookSearch(); // Re-apply search if active
    }
    loadDashboardData();
  } catch (error) {
    Swal.fire("Error", "Failed to add book: " + error.message, "error");
  }
});

async function loadBooks() {
  try {
    const books = await ipcRenderer.invoke("get-books");
    allBooks = books; // Store all books for searching

    displayBooks(books);

    // Update dashboard safely
    const totalBooksElement = getElement("total-books");
    const availableBooksElement = getElement("available-books");

    if (totalBooksElement) {
      totalBooksElement.textContent = books.reduce(
        (sum, book) => sum + book.quantity,
        0
      );
    }
    if (availableBooksElement) {
      availableBooksElement.textContent = books.reduce(
        (sum, book) => sum + book.available,
        0
      );
    }
  } catch (error) {
    console.error("Failed to load books:", error);
  }
}

// Members Management
document.getElementById("save-member").addEventListener("click", async () => {
  const form = document.getElementById("add-member-form");
  const formData = new FormData(form);
  const memberData = Object.fromEntries(formData.entries());

  try {
    await ipcRenderer.invoke("add-member", memberData);
    Swal.fire("Success", "Member added successfully!", "success");
    form.reset();
    $("#addMemberModal").modal("hide");
    loadMembers();
    loadDashboardData();
  } catch (error) {
    Swal.fire("Error", "Failed to add member: " + error.message, "error");
  }
});

async function loadMembers() {
  try {
    const members = await ipcRenderer.invoke("get-members");
    const tbody = document.querySelector("#members-table tbody");

    // Check if element exists
    if (!tbody) {
      console.warn("Members table tbody not found");
      return;
    }

    tbody.innerHTML = "";

    members.forEach((member) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${member.id}</td>
                <td>${member.name}</td>
                <td>${member.contact || "-"}</td>
                <td>${new Date(member.join_date).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-action edit-member" data-id="${
                      member.id
                    }">Edit</button>
                    <button class="btn btn-sm btn-danger btn-action delete-member" data-id="${
                      member.id
                    }">Delete</button>
                </td>
            `;
      tbody.appendChild(row);
    });

    // Update dashboard safely
    const totalMembersElement = getElement("total-members");
    if (totalMembersElement) {
      totalMembersElement.textContent = members.length;
    }
  } catch (error) {
    console.error("Failed to load members:", error);
  }
}

// Borrowings Management
document
  .getElementById("save-borrowing")
  .addEventListener("click", async () => {
    const form = document.getElementById("add-borrowing-form");
    const formData = new FormData(form);
    const borrowData = Object.fromEntries(formData.entries());

    try {
      await ipcRenderer.invoke("borrow-book", borrowData);
      Swal.fire("Success", "Book borrowed successfully!", "success");
      form.reset();
      $("#addBorrowingModal").modal("hide");
      loadBorrowings();
      loadBooks();
      loadDashboardData();
    } catch (error) {
      Swal.fire("Error", "Failed to borrow book: " + error.message, "error");
    }
  });

async function loadBorrowings() {
  try {
    const borrowings = await ipcRenderer.invoke("get-borrowings");
    const tbody = document.querySelector("#borrowings-table tbody");

    if (!tbody) {
      console.warn("Borrowings table tbody not found");
      return;
    }

    tbody.innerHTML = "";

    borrowings.forEach((borrowing) => {
      const status = borrowing.return_date
        ? "returned"
        : new Date(borrowing.due_date) < new Date()
        ? "overdue"
        : "borrowed";

      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${borrowing.id}</td>
                <td>${borrowing.book_title}</td>
                <td>${borrowing.member_name}</td>
                <td>${new Date(borrowing.due_date).toLocaleDateString()}</td>
                <td><span class="badge badge-${status}">${status}</span></td>
                <td>
                    ${
                      status === "borrowed"
                        ? `<button class="btn btn-sm btn-success btn-action return-book" data-id="${borrowing.id}">Return</button>`
                        : "-"
                    }
                </td>
            `;
      tbody.appendChild(row);
    });

    // Update dashboard safely
    const activeBorrowingsElement = getElement("active-borrowings");
    if (activeBorrowingsElement) {
      activeBorrowingsElement.textContent = borrowings.filter(
        (b) => !b.return_date
      ).length;
    }
  } catch (error) {
    console.error("Failed to load borrowings:", error);
  }
}

// Initial load - with error handling
document.addEventListener("DOMContentLoaded", () => {
  try {
    loadBooks();
    loadMembers();
    loadBorrowings();
    loadDashboardData();
    initializeBookSearch(); // Initialize search functionality
  } catch (error) {
    console.error("Error during initial load:", error);
  }
});

// Event delegation for dynamic buttons
document.addEventListener("click", async (e) => {
  if (e.target.matches(".return-book")) {
    const id = e.target.dataset.id;
    try {
      await ipcRenderer.invoke("return-book", id);
      Swal.fire("Success", "Book returned successfully!", "success");
      loadBorrowings();
      loadBooks();
      loadDashboardData();
    } catch (error) {
      Swal.fire("Error", "Failed to return book: " + error.message, "error");
    }
  }

  // DELETE BOOK
  if (e.target.matches(".delete-book")) {
    const id = e.target.dataset.id;
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the book!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await ipcRenderer.invoke("delete-book", id);
        Swal.fire("Deleted!", "Book deleted successfully.", "success");
        await loadBooks(); // Reload books
        if (currentSearchTerm) {
          performBookSearch(); // Re-apply search if active
        }
        loadDashboardData();
      } catch (error) {
        Swal.fire("Error", "Failed to delete book: " + error.message, "error");
      }
    }
  }

  // EDIT BOOK
  if (e.target.matches(".edit-book")) {
    const id = e.target.dataset.id;
    const books = await ipcRenderer.invoke("get-books");
    const book = books.find((b) => b.id == id);

    if (!book) return;

    document.querySelector("#edit-book-id").value = book.id;
    document.querySelector("#edit-title").value = book.title;
    document.querySelector("#edit-author").value = book.author;
    document.querySelector("#edit-isbn").value = book.isbn;
    document.querySelector("#edit-category").value = book.category;
    document.querySelector("#edit-quantity").value = book.quantity;
    document.querySelector("#edit-available").value = book.available;

    $("#editBookModal").modal("show");
  }

  // DELETE MEMBER
  if (e.target.matches(".delete-member")) {
    const id = e.target.dataset.id;
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the member!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await ipcRenderer.invoke("delete-member", id);
        Swal.fire("Deleted!", "Member deleted successfully.", "success");
        loadMembers();
        loadDashboardData();
      } catch (error) {
        Swal.fire(
          "Error",
          "Failed to delete member: " + error.message,
          "error"
        );
      }
    }
  }

  // EDIT MEMBER
  if (e.target.matches(".edit-member")) {
    const id = e.target.dataset.id;
    const members = await ipcRenderer.invoke("get-members");
    const member = members.find((m) => m.id == id);

    if (!member) return;

    document.querySelector("#edit-member-id").value = member.id;
    document.querySelector("#edit-name").value = member.name;
    document.querySelector("#edit-contact").value = member.contact;
    document.querySelector("#edit-address").value = member.address;

    $("#editMemberModal").modal("show");
  }
});

// Update book and member event listeners
document.getElementById("update-book").addEventListener("click", async () => {
  const form = document.getElementById("edit-book-form");
  const formData = new FormData(form);
  const bookData = Object.fromEntries(formData.entries());

  try {
    await ipcRenderer.invoke("update-book", bookData);
    Swal.fire("Updated!", "Book updated successfully!", "success");
    $("#editBookModal").modal("hide");
    await loadBooks(); // Reload books
    if (currentSearchTerm) {
      performBookSearch(); // Re-apply search if active
    }
    loadDashboardData();
  } catch (error) {
    Swal.fire("Error", "Failed to update book: " + error.message, "error");
  }
});

document.getElementById("update-member").addEventListener("click", async () => {
  const form = document.getElementById("edit-member-form");
  const formData = new FormData(form);
  const memberData = Object.fromEntries(formData.entries());

  try {
    await ipcRenderer.invoke("update-member", memberData);
    Swal.fire("Updated!", "Member updated successfully!", "success");
    $("#editMemberModal").modal("hide");
    loadMembers();
    loadDashboardData();
  } catch (error) {
    Swal.fire("Error", "Failed to update member: " + error.message, "error");
  }
});

// Dropdown population functions
async function populateBooksDropdown() {
  try {
    const books = await ipcRenderer.invoke("get-books");
    const bookSelect = document.getElementById("borrow-book-id");
    if (!bookSelect) return;

    bookSelect.innerHTML = '<option value="">Select Book</option>';

    books
      .filter((book) => book.available > 0)
      .forEach((book) => {
        const option = document.createElement("option");
        option.value = book.id;
        option.textContent = `${book.title} (${book.available}/${book.quantity})`;
        bookSelect.appendChild(option);
      });
  } catch (error) {
    console.error("Failed to load books for dropdown:", error);
  }
}

async function populateMembersDropdown() {
  try {
    const members = await ipcRenderer.invoke("get-members");
    const memberSelect = document.getElementById("borrow-member-id");
    if (!memberSelect) return;

    memberSelect.innerHTML = '<option value="">Select Member</option>';

    members.forEach((member) => {
      const option = document.createElement("option");
      option.value = member.id;
      option.textContent = member.name;
      memberSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Failed to load members for dropdown:", error);
  }
}

$("#addBorrowingModal").on("show.bs.modal", () => {
  populateBooksDropdown();
  populateMembersDropdown();
});
