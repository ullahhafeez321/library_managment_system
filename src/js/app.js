const { ipcRenderer } = require("electron");

// Navigation
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const page = e.target.dataset.page;
    showPage(page);
  });
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

// Alert function
function showAlert(message, type = "success") {
  Swal.fire({
    title: type === "success" ? "Success!" : "Error!",
    text: message,
    icon: type,
    confirmButtonText: "OK",
    customClass: {
      confirmButton: type === "success" ? "btn btn-success" : "btn btn-danger",
    },
  });
}

// Books Management
document.getElementById("save-book").addEventListener("click", async () => {
  const form = document.getElementById("add-book-form");
  const formData = new FormData(form);
  const bookData = Object.fromEntries(formData.entries());

  // Validate form
  if (!bookData.title || !bookData.author) {
    showAlert("Please fill in all required fields", "error");
    return;
  }

  try {
    const response = await ipcRenderer.invoke("add-book", bookData);
    if (response.success) {
      showAlert("Book added successfully!", "success");
      form.reset();
      $("#addBookModal").modal("hide");
      loadBooks();
    } else {
      showAlert("Failed to add book: " + response.error, "error");
    }
  } catch (error) {
    showAlert("Failed to add book: " + error.message, "error");
  }
});

async function loadBooks() {
  try {
    const response = await ipcRenderer.invoke("get-books");
    if (response.success) {
      const books = response.data;
      const tbody = document.querySelector("#books-table tbody");
      tbody.innerHTML = "";

      if (books.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No books found. Add your first book!</td></tr>`;
      } else {
        books.forEach((book) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${book.id}</td>
            <td><strong>${book.title}</strong></td>
            <td>${book.author}</td>
            <td>${book.isbn || "-"}</td>
            <td><span class="badge bg-secondary">${
              book.category || "General"
            }</span></td>
            <td>
              <span class="availability ${
                book.available > 0 ? "text-success" : "text-danger"
              }">
                ${book.available}/${book.quantity}
              </span>
            </td>
            <td>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary edit-book" data-id="${
                  book.id
                }" title="Edit">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-outline-danger delete-book" data-id="${
                  book.id
                }" title="Delete">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
            </td>
          `;
          tbody.appendChild(row);
        });
      }

      // Update dashboard
      document.getElementById("total-books").textContent = books.reduce(
        (sum, book) => sum + book.quantity,
        0
      );
      document.getElementById("available-books").textContent = books.reduce(
        (sum, book) => sum + book.available,
        0
      );
    } else {
      showAlert("Failed to load books: " + response.error, "error");
    }
  } catch (error) {
    showAlert("Error loading books: " + error.message, "error");
  }
}

// Members Management
document.getElementById("save-member").addEventListener("click", async () => {
  const form = document.getElementById("add-member-form");
  const formData = new FormData(form);
  const memberData = Object.fromEntries(formData.entries());

  if (!memberData.name) {
    showAlert("Please enter member name", "error");
    return;
  }

  try {
    const response = await ipcRenderer.invoke("add-member", memberData);
    if (response.success) {
      showAlert("Member added successfully!", "success");
      form.reset();
      $("#addMemberModal").modal("hide");
      loadMembers();
    } else {
      showAlert("Failed to add member: " + response.error, "error");
    }
  } catch (error) {
    showAlert("Failed to add member: " + error.message, "error");
  }
});

async function loadMembers() {
  try {
    const response = await ipcRenderer.invoke("get-members");
    if (response.success) {
      const members = response.data;
      const tbody = document.querySelector("#members-table tbody");
      tbody.innerHTML = "";

      if (members.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No members found. Add your first member!</td></tr>`;
      } else {
        members.forEach((member) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${member.id}</td>
            <td><strong>${member.name}</strong></td>
            <td>${member.contact || "-"}</td>
            <td>${member.address || "-"}</td>
            <td>${new Date(member.join_date).toLocaleDateString()}</td>
            <td>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary edit-member" data-id="${
                  member.id
                }" title="Edit">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-outline-danger delete-member" data-id="${
                  member.id
                }" title="Delete">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
            </td>
          `;
          tbody.appendChild(row);
        });
      }

      // Update dashboard
      document.getElementById("total-members").textContent = members.length;
    } else {
      showAlert("Failed to load members: " + response.error, "error");
    }
  } catch (error) {
    showAlert("Error loading members: " + error.message, "error");
  }
}

// Borrowings Management
document
  .getElementById("save-borrowing")
  .addEventListener("click", async () => {
    const form = document.getElementById("add-borrowing-form");
    const formData = new FormData(form);
    const borrowData = Object.fromEntries(formData.entries());

    if (!borrowData.book_id || !borrowData.member_id) {
      showAlert("Please select both book and member", "error");
      return;
    }

    try {
      const response = await ipcRenderer.invoke("borrow-book", borrowData);
      if (response.success) {
        showAlert("Book borrowed successfully!", "success");
        form.reset();
        $("#addBorrowingModal").modal("hide");
        loadBorrowings();
        loadBooks(); // Refresh books to update availability
      } else {
        showAlert("Failed to borrow book: " + response.error, "error");
      }
    } catch (error) {
      showAlert("Failed to borrow book: " + error.message, "error");
    }
  });

async function loadBorrowings() {
  try {
    const response = await ipcRenderer.invoke("get-borrowings");
    if (response.success) {
      const borrowings = response.data;
      const tbody = document.querySelector("#borrowings-table tbody");
      tbody.innerHTML = "";

      if (borrowings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No borrowings found.</td></tr>`;
      } else {
        borrowings.forEach((borrowing) => {
          const dueDate = new Date(borrowing.due_date);
          const today = new Date();
          const isOverdue = dueDate < today && !borrowing.return_date;
          const status = borrowing.return_date
            ? "returned"
            : isOverdue
            ? "overdue"
            : "borrowed";

          const statusClass = {
            returned: "bg-success",
            overdue: "bg-danger",
            borrowed: "bg-warning",
          }[status];

          const statusText = {
            returned: "Returned",
            overdue: "Overdue",
            borrowed: "Borrowed",
          }[status];

          row.innerHTML = `
            <td>${borrowing.id}</td>
            <td><strong>${borrowing.book_title}</strong></td>
            <td><strong>${borrowing.member_name}</strong></td>
            <td>${new Date(borrowing.borrow_date).toLocaleDateString()}</td>
            <td class="${isOverdue ? "text-danger fw-bold" : ""}">
              ${dueDate.toLocaleDateString()}
              ${isOverdue ? " ⚠️" : ""}
            </td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td>
              ${
                status === "borrowed"
                  ? `
                <button class="btn btn-success btn-sm return-book" data-id="${borrowing.id}" title="Return Book">
                  <i class="fas fa-undo"></i> Return
                </button>
              `
                  : "-"
              }
            </td>
          `;
          tbody.appendChild(row);
        });
      }

      // Update dashboard
      document.getElementById("active-borrowings").textContent =
        borrowings.filter((b) => !b.return_date).length;
    } else {
      showAlert("Failed to load borrowings: " + response.error, "error");
    }
  } catch (error) {
    showAlert("Error loading borrowings: " + error.message, "error");
  }
}

// Event delegation for dynamic buttons
document.addEventListener("click", async (e) => {
  if (e.target.matches(".return-book") || e.target.closest(".return-book")) {
    const button = e.target.matches(".return-book")
      ? e.target
      : e.target.closest(".return-book");
    const id = button.dataset.id;

    const confirm = await Swal.fire({
      title: "Return Book?",
      text: "Are you sure you want to mark this book as returned?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Return",
      cancelButtonText: "Cancel",
    });

    if (confirm.isConfirmed) {
      try {
        const response = await ipcRenderer.invoke("return-book", id);
        if (response.success) {
          showAlert("Book returned successfully!", "success");
          loadBorrowings();
          loadBooks();
        } else {
          showAlert("Failed to return book: " + response.error, "error");
        }
      } catch (error) {
        showAlert("Failed to return book: " + error.message, "error");
      }
    }
  }
});

// ====================== EDIT & DELETE: BOOKS ======================
document.addEventListener("click", async (e) => {
  // DELETE BOOK
  if (e.target.matches(".delete-book") || e.target.closest(".delete-book")) {
    const button = e.target.matches(".delete-book")
      ? e.target
      : e.target.closest(".delete-book");
    const id = button.dataset.id;

    const confirm = await Swal.fire({
      title: "Delete Book?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc3545",
    });

    if (confirm.isConfirmed) {
      try {
        const response = await ipcRenderer.invoke("delete-book", id);
        if (response.success) {
          showAlert("Book deleted successfully!", "success");
          loadBooks();
        } else {
          showAlert("Failed to delete book: " + response.error, "error");
        }
      } catch (error) {
        showAlert("Failed to delete book: " + error.message, "error");
      }
    }
  }

  // EDIT BOOK
  if (e.target.matches(".edit-book") || e.target.closest(".edit-book")) {
    const button = e.target.matches(".edit-book")
      ? e.target
      : e.target.closest(".edit-book");
    const id = button.dataset.id;

    try {
      const response = await ipcRenderer.invoke("get-book", id);
      if (response.success && response.data) {
        const book = response.data;

        // Fill modal form
        document.querySelector("#edit-book-id").value = book.id;
        document.querySelector("#edit-title").value = book.title;
        document.querySelector("#edit-author").value = book.author;
        document.querySelector("#edit-isbn").value = book.isbn || "";
        document.querySelector("#edit-category").value = book.category || "";
        document.querySelector("#edit-quantity").value = book.quantity;
        document.querySelector("#edit-available").value = book.available;

        $("#editBookModal").modal("show");
      } else {
        showAlert("Book not found!", "error");
      }
    } catch (error) {
      showAlert("Error loading book details: " + error.message, "error");
    }
  }
});

document.getElementById("update-book").addEventListener("click", async () => {
  const form = document.getElementById("edit-book-form");
  const formData = new FormData(form);
  const bookData = Object.fromEntries(formData.entries());

  try {
    const response = await ipcRenderer.invoke("update-book", bookData);
    if (response.success) {
      showAlert("Book updated successfully!", "success");
      $("#editBookModal").modal("hide");
      loadBooks();
    } else {
      showAlert("Failed to update book: " + response.error, "error");
    }
  } catch (error) {
    showAlert("Failed to update book: " + error.message, "error");
  }
});

// ====================== EDIT & DELETE: MEMBERS ======================
document.addEventListener("click", async (e) => {
  // DELETE MEMBER
  if (
    e.target.matches(".delete-member") ||
    e.target.closest(".delete-member")
  ) {
    const button = e.target.matches(".delete-member")
      ? e.target
      : e.target.closest(".delete-member");
    const id = button.dataset.id;

    const confirm = await Swal.fire({
      title: "Delete Member?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc3545",
    });

    if (confirm.isConfirmed) {
      try {
        const response = await ipcRenderer.invoke("delete-member", id);
        if (response.success) {
          showAlert("Member deleted successfully!", "success");
          loadMembers();
        } else {
          showAlert("Failed to delete member: " + response.error, "error");
        }
      } catch (error) {
        showAlert("Failed to delete member: " + error.message, "error");
      }
    }
  }

  // EDIT MEMBER
  if (e.target.matches(".edit-member") || e.target.closest(".edit-member")) {
    const button = e.target.matches(".edit-member")
      ? e.target
      : e.target.closest(".edit-member");
    const id = button.dataset.id;

    try {
      const response = await ipcRenderer.invoke("get-member", id);
      if (response.success && response.data) {
        const member = response.data;

        // Fill modal form
        document.querySelector("#edit-member-id").value = member.id;
        document.querySelector("#edit-name").value = member.name;
        document.querySelector("#edit-contact").value = member.contact || "";
        document.querySelector("#edit-address").value = member.address || "";

        $("#editMemberModal").modal("show");
      } else {
        showAlert("Member not found!", "error");
      }
    } catch (error) {
      showAlert("Error loading member details: " + error.message, "error");
    }
  }
});

document.getElementById("update-member").addEventListener("click", async () => {
  const form = document.getElementById("edit-member-form");
  const formData = new FormData(form);
  const memberData = Object.fromEntries(formData.entries());

  try {
    const response = await ipcRenderer.invoke("update-member", memberData);
    if (response.success) {
      showAlert("Member updated successfully!", "success");
      $("#editMemberModal").modal("hide");
      loadMembers();
    } else {
      showAlert("Failed to update member: " + response.error, "error");
    }
  } catch (error) {
    showAlert("Failed to update member: " + error.message, "error");
  }
});

// Dropdown population functions
async function populateBooksDropdown() {
  try {
    const response = await ipcRenderer.invoke("get-books");
    if (response.success) {
      const books = response.data;
      const bookSelect = document.getElementById("borrow-book-id");
      bookSelect.innerHTML = '<option value="">Select Book</option>';

      const availableBooks = books.filter((book) => book.available > 0);

      if (availableBooks.length === 0) {
        bookSelect.innerHTML = '<option value="">No available books</option>';
        bookSelect.disabled = true;
      } else {
        availableBooks.forEach((book) => {
          const option = document.createElement("option");
          option.value = book.id;
          option.textContent = `${book.title} by ${book.author} (${book.available} available)`;
          bookSelect.appendChild(option);
        });
        bookSelect.disabled = false;
      }
    }
  } catch (error) {
    console.error("Error loading books dropdown:", error);
  }
}

async function populateMembersDropdown() {
  try {
    const response = await ipcRenderer.invoke("get-members");
    if (response.success) {
      const members = response.data;
      const memberSelect = document.getElementById("borrow-member-id");
      memberSelect.innerHTML = '<option value="">Select Member</option>';

      members.forEach((member) => {
        const option = document.createElement("option");
        option.value = member.id;
        option.textContent = `${member.name} (ID: ${member.id})`;
        memberSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error loading members dropdown:", error);
  }
}

// Modal event listeners
$("#addBorrowingModal").on("show.bs.modal", () => {
  populateBooksDropdown();
  populateMembersDropdown();
});

$("#addBookModal").on("hidden.bs.modal", function () {
  this.querySelector("form").reset();
});

$("#addMemberModal").on("hidden.bs.modal", function () {
  this.querySelector("form").reset();
});

// Search functionality
document.getElementById("search-books").addEventListener("input", async (e) => {
  const searchTerm = e.target.value.trim();
  if (searchTerm.length > 2) {
    try {
      const response = await ipcRenderer.invoke("search-books", searchTerm);
      if (response.success) {
        // Implement search results display here
        console.log("Search results:", response.data);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  }
});

// Backup functionality
document.getElementById("backup-btn").addEventListener("click", async () => {
  try {
    const { dialog } =
      require("electron").remote || require("@electron/remote");
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Select backup location",
    });

    if (!result.canceled) {
      const backupPath = result.filePaths[0];
      const response = await ipcRenderer.invoke("backup-database", backupPath);
      if (response.success) {
        showAlert(
          `Database backed up successfully to: ${response.path}`,
          "success"
        );
      } else {
        showAlert("Backup failed: " + response.error, "error");
      }
    }
  } catch (error) {
    showAlert("Backup error: " + error.message, "error");
  }
});

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  loadBooks();
  loadMembers();
  loadBorrowings();

  // Show dashboard by default
  showPage("dashboard");
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case "1":
        e.preventDefault();
        showPage("dashboard");
        break;
      case "2":
        e.preventDefault();
        showPage("books");
        break;
      case "3":
        e.preventDefault();
        showPage("members");
        break;
      case "4":
        e.preventDefault();
        showPage("borrowings");
        break;
      case "n":
        if (
          document.getElementById("books-section").classList.contains("active")
        ) {
          e.preventDefault();
          $("#addBookModal").modal("show");
        } else if (
          document
            .getElementById("members-section")
            .classList.contains("active")
        ) {
          e.preventDefault();
          $("#addMemberModal").modal("show");
        } else if (
          document
            .getElementById("borrowings-section")
            .classList.contains("active")
        ) {
          e.preventDefault();
          $("#addBorrowingModal").modal("show");
        }
        break;
    }
  }
});
